use axum::{Router, routing::{delete, get, post, put}};
use tower_http::{cors::CorsLayer, trace::TraceLayer};

use crate::{
    auth, bots, code, metrics, owner, admin, setup,
    state::AppState,
};

pub fn build(state: AppState) -> Router {
    Router::new()
        // First-run setup (only works before owner account exists)
        .route("/setup", post(setup::handle_setup))
        .route("/setup/status", get(setup::handle_status))

        // Auth
        .route("/auth/login", post(auth::login))
        .route("/auth/register", post(auth::register))
        .route("/auth/me", get(auth::me))
        .route("/auth/api-keys", get(auth::list_api_keys).post(auth::create_api_key))
        .route("/auth/api-keys/:id", delete(auth::revoke_api_key))

        // Owner → admin management
        .route("/owner/admins", get(owner::list_admins).post(owner::create_admin))
        .route("/owner/admins/:id", get(owner::get_admin).delete(owner::delete_admin))
        .route("/owner/admins/:id/limits", get(owner::get_admin_limits).put(owner::set_admin_limits))
        .route("/owner/workers", get(owner::list_workers))
        .route("/owner/config", get(owner::get_config))
        .route("/owner/config/:key", put(owner::set_config))

        // Admin → user management
        .route("/admin/users", get(admin::list_users).post(admin::create_user))
        .route("/admin/users/:id", get(admin::get_user).delete(admin::delete_user))
        .route("/admin/users/:id/limits", get(admin::get_user_limits).put(admin::set_user_limits))
        .route("/admin/pool", get(admin::get_pool))

        // Bots (scoped to the authenticated user)
        .route("/bots", get(bots::list).post(bots::create))
        .route("/bots/:id", get(bots::get).delete(bots::delete))
        .route("/bots/:id/start", post(bots::start))
        .route("/bots/:id/stop", post(bots::stop))
        .route("/bots/:id/restart", post(bots::restart))
        .route("/bots/:id/logs", get(bots::logs))

        // Code upload & versioning (nested under bots for clarity)
        .route("/bots/:id/deploy", post(code::deploy))
        .route("/bots/:id/versions", get(code::list_versions))
        .route("/bots/:id/versions/:version/activate", post(code::activate_version))

        // Metrics
        .route("/bots/:id/metrics", get(metrics::get_metrics))
        .route("/bots/:id/metrics/stream", get(metrics::stream_metrics))

        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state)
}
