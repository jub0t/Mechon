use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use axum::{
    async_trait,
    extract::{FromRequestParts, Path, State},
    http::request::Parts,
    Json,
};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use chrono::Utc;
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use mechon_types::{UserRole, api::*};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::{
    error::{AppError, Result},
    state::AppState,
};

// ============================================================
// JWT CLAIMS
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// User ID
    pub sub: String,
    pub role: String,
    /// Expiry (Unix timestamp)
    pub exp: usize,
    pub iat: usize,
}

// ============================================================
// AUTH USER EXTRACTOR
// ============================================================

/// Injected into handlers that require authentication.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: Uuid,
    pub role: UserRole,
    pub parent_id: Option<Uuid>,
}

impl AuthUser {
    pub fn require_owner(&self) -> Result<()> {
        if self.role == UserRole::Owner {
            Ok(())
        } else {
            Err(AppError::Forbidden)
        }
    }

    pub fn require_admin_or_owner(&self) -> Result<()> {
        if matches!(self.role, UserRole::Owner | UserRole::Admin) {
            Ok(())
        } else {
            Err(AppError::Forbidden)
        }
    }

    pub fn require_admin(&self) -> Result<()> {
        if self.role == UserRole::Admin {
            Ok(())
        } else {
            Err(AppError::Forbidden)
        }
    }
}

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> std::result::Result<Self, Self::Rejection> {
        // Try Bearer token first
        if let Some(auth) = parts.headers.get("Authorization") {
            let auth_str = auth.to_str().map_err(|_| AppError::Unauthorized)?;
            if let Some(token) = auth_str.strip_prefix("Bearer ") {
                return validate_jwt(token, state).await;
            }
        }

        // Try API key
        if let Some(key_header) = parts.headers.get("X-Api-Key") {
            let key = key_header.to_str().map_err(|_| AppError::Unauthorized)?;
            return validate_api_key(key, state).await;
        }

        Err(AppError::Unauthorized)
    }
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

async fn validate_jwt(token: &str, state: &AppState) -> Result<AuthUser> {
    let key = DecodingKey::from_secret(state.config.server.secret_key.as_bytes());
    let data = decode::<Claims>(token, &key, &Validation::default())
        .map_err(|_| AppError::Unauthorized)?;

    let user_id = Uuid::parse_str(&data.claims.sub).map_err(|_| AppError::Unauthorized)?;

    #[derive(sqlx::FromRow)]
    struct Row {
        role: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT role::text AS role, parent_id FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    Ok(AuthUser {
        id: user_id,
        role: parse_role(&row.role)?,
        parent_id: row.parent_id,
    })
}

async fn validate_api_key(key: &str, state: &AppState) -> Result<AuthUser> {
    let hash = format!("{:x}", Sha256::digest(key.as_bytes()));

    #[derive(sqlx::FromRow)]
    struct Row {
        user_id: Uuid,
        role: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        r#"SELECT ak.user_id, u.role::text AS role, u.parent_id
           FROM api_keys ak
           JOIN users u ON ak.user_id = u.id
           WHERE ak.key_hash = $1
             AND (ak.expires_at IS NULL OR ak.expires_at > NOW())"#,
    )
    .bind(&hash)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    // Bump last_used_at without blocking the response
    let db = state.db.clone();
    let hash_clone = hash.clone();
    tokio::spawn(async move {
        let _ = sqlx::query("UPDATE api_keys SET last_used_at = NOW() WHERE key_hash = $1")
            .bind(&hash_clone)
            .execute(&db)
            .await;
    });

    Ok(AuthUser {
        id: row.user_id,
        role: parse_role(&row.role)?,
        parent_id: row.parent_id,
    })
}

fn parse_role(s: &str) -> Result<UserRole> {
    match s {
        "owner" => Ok(UserRole::Owner),
        "admin" => Ok(UserRole::Admin),
        "user" => Ok(UserRole::User),
        _ => Err(AppError::Internal(anyhow::anyhow!("Unknown role: {}", s))),
    }
}

pub fn make_jwt(user_id: Uuid, role: &UserRole, secret: &str) -> anyhow::Result<String> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs() as usize;

    let role_str = match role {
        UserRole::Owner => "owner",
        UserRole::Admin => "admin",
        UserRole::User => "user",
    };

    let claims = Claims {
        sub: user_id.to_string(),
        role: role_str.into(),
        exp: now + 86400 * 7, // 7 days
        iat: now,
    };

    Ok(encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )?)
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| anyhow::anyhow!("Password hashing failed: {}", e))?
        .to_string();
    Ok(hash)
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(password.as_bytes(), &parsed)
        .is_ok()
}

// ============================================================
// HANDLERS
// ============================================================

pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        password_hash: String,
        role: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        r#"SELECT id, email, username, password_hash, role::text AS role, parent_id
           FROM users
           WHERE email = $1 OR username = $1"#,
    )
    .bind(&body.identifier)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::Unauthorized)?;

    if !verify_password(&body.password, &row.password_hash) {
        return Err(AppError::Unauthorized);
    }

    let role = parse_role(&row.role)?;
    let token = make_jwt(row.id, &role, &state.config.server.secret_key)
        .map_err(|e| AppError::Internal(e))?;

    Ok(Json(LoginResponse {
        token,
        user: UserInfo {
            id: row.id,
            email: row.email,
            username: row.username,
            role,
            parent_id: row.parent_id,
        },
    }))
}

pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<Json<UserInfo>> {
    // Check if open registration is enabled
    let open: String = sqlx::query_scalar(
        "SELECT value FROM platform_config WHERE key = 'open_registration'",
    )
    .fetch_optional(&state.db)
    .await?
    .unwrap_or_else(|| "false".into());

    if open != "true" {
        return Err(AppError::Forbidden);
    }

    create_user_internal(&state, &body.email, &body.username, &body.password, UserRole::User, None).await
}

pub async fn me(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<UserInfo>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        email: String,
        username: String,
        role: String,
        parent_id: Option<Uuid>,
    }

    let row = sqlx::query_as::<_, Row>(
        "SELECT id, email, username, role::text AS role, parent_id FROM users WHERE id = $1",
    )
    .bind(auth.id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(Json(UserInfo {
        id: row.id,
        email: row.email,
        username: row.username,
        role: parse_role(&row.role)?,
        parent_id: row.parent_id,
    }))
}

pub async fn list_api_keys(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<mechon_types::ApiKey>>> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        name: String,
        last_used_at: Option<chrono::DateTime<Utc>>,
        expires_at: Option<chrono::DateTime<Utc>>,
        created_at: chrono::DateTime<Utc>,
    }

    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, name, last_used_at, expires_at, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC",
    )
    .bind(auth.id)
    .fetch_all(&state.db)
    .await?;

    let keys = rows
        .into_iter()
        .map(|r| mechon_types::ApiKey {
            id: r.id,
            user_id: auth.id,
            name: r.name,
            last_used_at: r.last_used_at,
            expires_at: r.expires_at,
            created_at: r.created_at,
        })
        .collect();

    Ok(Json(keys))
}

pub async fn create_api_key(
    auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateApiKeyRequest>,
) -> Result<Json<CreateApiKeyResponse>> {
    // Generate random 32-byte key, encode as base64url
    let mut raw = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut raw);
    let key = URL_SAFE_NO_PAD.encode(raw);

    let hash = format!("{:x}", Sha256::digest(key.as_bytes()));
    let id = Uuid::new_v4();
    let now = Utc::now();

    sqlx::query(
        "INSERT INTO api_keys (id, user_id, key_hash, name, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(id)
    .bind(auth.id)
    .bind(&hash)
    .bind(&body.name)
    .bind(body.expires_at)
    .bind(now)
    .execute(&state.db)
    .await?;

    Ok(Json(CreateApiKeyResponse {
        id,
        name: body.name,
        key,
        created_at: now,
    }))
}

pub async fn revoke_api_key(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<serde_json::Value>> {
    let deleted = sqlx::query(
        "DELETE FROM api_keys WHERE id = $1 AND user_id = $2",
    )
    .bind(id)
    .bind(auth.id)
    .execute(&state.db)
    .await?;

    if deleted.rows_affected() == 0 {
        return Err(AppError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

// ============================================================
// SHARED HELPER: create a user account
// ============================================================

pub async fn create_user_internal(
    state: &AppState,
    email: &str,
    username: &str,
    password: &str,
    role: UserRole,
    parent_id: Option<Uuid>,
) -> Result<Json<UserInfo>> {
    // Check uniqueness
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1 OR username = $2)",
    )
    .bind(email)
    .bind(username)
    .fetch_one(&state.db)
    .await?;

    if exists {
        return Err(AppError::Conflict("Email or username already taken".into()));
    }

    let password_hash = hash_password(password).map_err(|e| AppError::Internal(e))?;
    let id = Uuid::new_v4();
    let now = Utc::now();

    let role_str = match &role {
        UserRole::Owner => "owner",
        UserRole::Admin => "admin",
        UserRole::User => "user",
    };

    sqlx::query(
        "INSERT INTO users (id, email, username, password_hash, role, parent_id, created_at, updated_at) VALUES ($1,$2,$3,$4,$5::user_role,$6,$7,$7)",
    )
    .bind(id)
    .bind(email)
    .bind(username)
    .bind(&password_hash)
    .bind(role_str)
    .bind(parent_id)
    .bind(now)
    .execute(&state.db)
    .await?;

    Ok(Json(UserInfo {
        id,
        email: email.into(),
        username: username.into(),
        role,
        parent_id,
    }))
}
