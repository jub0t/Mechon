use axum::{extract::State, Json};
use mechon_types::{UserRole, api::*};

use crate::{
    auth::create_user_internal,
    error::{AppError, Result},
    state::AppState,
};

pub async fn handle_status(State(state): State<AppState>) -> Result<Json<SetupStatus>> {
    let configured: String =
        sqlx::query_scalar("SELECT value FROM platform_config WHERE key = 'setup_complete'")
            .fetch_optional(&state.db)
            .await?
            .unwrap_or_else(|| "false".into());

    Ok(Json(SetupStatus {
        configured: configured == "true",
    }))
}

pub async fn handle_setup(
    State(state): State<AppState>,
    Json(body): Json<SetupRequest>,
) -> Result<Json<UserInfo>> {
    // Guard: only works once
    let configured: String =
        sqlx::query_scalar("SELECT value FROM platform_config WHERE key = 'setup_complete'")
            .fetch_optional(&state.db)
            .await?
            .unwrap_or_else(|| "false".into());

    if configured == "true" {
        return Err(AppError::Conflict("Server is already configured".into()));
    }

    // Validate input
    if body.password.len() < 8 {
        return Err(AppError::BadRequest("Password must be at least 8 characters".into()));
    }

    // Create the owner account
    let user = create_user_internal(
        &state,
        &body.email,
        &body.username,
        &body.password,
        UserRole::Owner,
        None,
    )
    .await?;

    // Mark setup as complete
    sqlx::query(
        "UPDATE platform_config SET value = 'true', updated_at = NOW() WHERE key = 'setup_complete'",
    )
    .execute(&state.db)
    .await?;

    tracing::info!(user_id = %user.id, "Owner account created — setup complete");

    Ok(user)
}
