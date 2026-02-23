/// Typed HTTP client for the Mechon API.
use anyhow::{bail, Context, Result};
use mechon_types::api::*;
use reqwest::multipart;
use serde::{de::DeserializeOwned, Serialize};

pub struct Client {
    http: reqwest::Client,
    base_url: String,
    token: Option<String>,
}

impl Client {
    pub fn new(base_url: impl Into<String>, token: Option<String>) -> Self {
        Self {
            http: reqwest::Client::new(),
            base_url: base_url.into().trim_end_matches('/').to_string(),
            token,
        }
    }

    fn url(&self, path: &str) -> String {
        format!("{}/{}", self.base_url, path.trim_start_matches('/'))
    }

    fn request(&self, method: reqwest::Method, path: &str) -> reqwest::RequestBuilder {
        let mut req = self.http.request(method, self.url(path));
        if let Some(token) = &self.token {
            req = req.bearer_auth(token);
        }
        req
    }

    async fn send<T: DeserializeOwned>(&self, req: reqwest::RequestBuilder) -> Result<T> {
        let resp = req.send().await.context("Request failed")?;
        let status = resp.status();
        let body = resp.text().await.context("Failed to read response body")?;

        if !status.is_success() {
            // Try to extract "error" field from JSON response
            let msg = serde_json::from_str::<serde_json::Value>(&body)
                .ok()
                .and_then(|v| v["error"].as_str().map(str::to_string))
                .unwrap_or(body);
            bail!("HTTP {} — {}", status, msg);
        }

        serde_json::from_str(&body).context("Failed to deserialize response")
    }

    async fn send_json<B: Serialize, T: DeserializeOwned>(
        &self,
        method: reqwest::Method,
        path: &str,
        body: &B,
    ) -> Result<T> {
        let req = self.request(method, path).json(body);
        self.send(req).await
    }

    // ============================================================
    // SETUP
    // ============================================================

    pub async fn setup_status(&self) -> Result<SetupStatus> {
        self.send(self.request(reqwest::Method::GET, "/setup/status")).await
    }

    pub async fn setup(&self, body: &SetupRequest) -> Result<UserInfo> {
        self.send_json(reqwest::Method::POST, "/setup", body).await
    }

    // ============================================================
    // AUTH
    // ============================================================

    pub async fn login(&self, body: &LoginRequest) -> Result<LoginResponse> {
        self.send_json(reqwest::Method::POST, "/auth/login", body).await
    }

    pub async fn me(&self) -> Result<UserInfo> {
        self.send(self.request(reqwest::Method::GET, "/auth/me")).await
    }

    pub async fn create_api_key(&self, body: &CreateApiKeyRequest) -> Result<CreateApiKeyResponse> {
        self.send_json(reqwest::Method::POST, "/auth/api-keys", body).await
    }

    pub async fn list_api_keys(&self) -> Result<Vec<mechon_types::ApiKey>> {
        self.send(self.request(reqwest::Method::GET, "/auth/api-keys")).await
    }

    pub async fn revoke_api_key(&self, id: uuid::Uuid) -> Result<serde_json::Value> {
        self.send(self.request(reqwest::Method::DELETE, &format!("/auth/api-keys/{}", id))).await
    }

    // ============================================================
    // BOTS
    // ============================================================

    pub async fn list_bots(&self) -> Result<Vec<BotResponse>> {
        self.send(self.request(reqwest::Method::GET, "/bots")).await
    }

    pub async fn get_bot(&self, id: uuid::Uuid) -> Result<BotResponse> {
        self.send(self.request(reqwest::Method::GET, &format!("/bots/{}", id))).await
    }

    pub async fn create_bot(&self, body: &CreateBotRequest) -> Result<BotResponse> {
        self.send_json(reqwest::Method::POST, "/bots", body).await
    }

    pub async fn delete_bot(&self, id: uuid::Uuid) -> Result<serde_json::Value> {
        self.send(self.request(reqwest::Method::DELETE, &format!("/bots/{}", id))).await
    }

    pub async fn start_bot(&self, id: uuid::Uuid) -> Result<BotResponse> {
        self.send(self.request(reqwest::Method::POST, &format!("/bots/{}/start", id))).await
    }

    pub async fn stop_bot(&self, id: uuid::Uuid) -> Result<BotResponse> {
        self.send(self.request(reqwest::Method::POST, &format!("/bots/{}/stop", id))).await
    }

    pub async fn restart_bot(&self, id: uuid::Uuid) -> Result<BotResponse> {
        self.send(self.request(reqwest::Method::POST, &format!("/bots/{}/restart", id))).await
    }

    pub async fn get_logs(&self, id: uuid::Uuid) -> Result<LogsResponse> {
        self.send(self.request(reqwest::Method::GET, &format!("/bots/{}/logs", id))).await
    }

    pub async fn get_metrics(&self, id: uuid::Uuid) -> Result<MetricsResponse> {
        self.send(self.request(reqwest::Method::GET, &format!("/bots/{}/metrics", id))).await
    }

    // ============================================================
    // DEPLOY
    // ============================================================

    pub async fn deploy(
        &self,
        bot_id: uuid::Uuid,
        archive_bytes: Vec<u8>,
        entrypoint: Option<String>,
    ) -> Result<mechon_types::BotVersion> {
        let mut form = multipart::Form::new()
            .part("archive", multipart::Part::bytes(archive_bytes).file_name("archive.zip"));

        if let Some(ep) = entrypoint {
            form = form.text("entrypoint", ep);
        }

        let req = self
            .request(reqwest::Method::POST, &format!("/bots/{}/deploy", bot_id))
            .multipart(form);

        self.send(req).await
    }

    pub async fn list_versions(&self, bot_id: uuid::Uuid) -> Result<VersionsResponse> {
        self.send(self.request(reqwest::Method::GET, &format!("/bots/{}/versions", bot_id))).await
    }

    pub async fn activate_version(
        &self,
        bot_id: uuid::Uuid,
        version: i32,
    ) -> Result<mechon_types::BotVersion> {
        self.send(
            self.request(
                reqwest::Method::POST,
                &format!("/bots/{}/versions/{}/activate", bot_id, version),
            ),
        )
        .await
    }

    // ============================================================
    // OWNER
    // ============================================================

    pub async fn list_admins(&self) -> Result<Vec<UserInfo>> {
        self.send(self.request(reqwest::Method::GET, "/owner/admins")).await
    }

    pub async fn create_admin(&self, body: &CreateAdminRequest) -> Result<UserInfo> {
        self.send_json(reqwest::Method::POST, "/owner/admins", body).await
    }

    pub async fn set_admin_limits(
        &self,
        admin_id: uuid::Uuid,
        body: &SetAdminLimitsRequest,
    ) -> Result<mechon_types::AdminLimits> {
        self.send_json(
            reqwest::Method::PUT,
            &format!("/owner/admins/{}/limits", admin_id),
            body,
        )
        .await
    }

    // ============================================================
    // ADMIN
    // ============================================================

    pub async fn list_users(&self) -> Result<Vec<UserInfo>> {
        self.send(self.request(reqwest::Method::GET, "/admin/users")).await
    }

    pub async fn create_user(&self, body: &CreateUserRequest) -> Result<UserInfo> {
        self.send_json(reqwest::Method::POST, "/admin/users", body).await
    }

    pub async fn set_user_limits(
        &self,
        user_id: uuid::Uuid,
        body: &SetUserLimitsRequest,
    ) -> Result<mechon_types::UserLimits> {
        self.send_json(
            reqwest::Method::PUT,
            &format!("/admin/users/{}/limits", user_id),
            body,
        )
        .await
    }

    pub async fn get_pool(&self) -> Result<AdminLimitsResponse> {
        self.send(self.request(reqwest::Method::GET, "/admin/pool")).await
    }
}
