use tauri::State;
use serde::{Deserialize, Serialize};
use crate::auth::{AuthService, User};

/// Login request with optional tenant_id (defaults to "default")
#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
    pub remember_me: bool,
    #[serde(default = "default_tenant_id")]
    pub tenant_id: String,
}

fn default_tenant_id() -> String {
    "default".to_string()
}

/// Register request with optional tenant_id (defaults to "default")
#[derive(Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub password: String,
    pub name: String,
    pub department: Option<String>,
    #[serde(default = "default_tenant_id")]
    pub tenant_id: String,
}

#[derive(Serialize)]
pub struct LoginResponse {
    pub user: User,
    pub token: String,
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub user: User,
}

#[tauri::command]
pub async fn login(
    request: LoginRequest,
    auth_service: State<'_, AuthService>,
) -> Result<LoginResponse, String> {
    let (user, token) = auth_service
        .login(&request.tenant_id, &request.username, &request.password)
        .await
        .map_err(|e| e.to_string())?;

    Ok(LoginResponse { user, token })
}

#[tauri::command]
pub async fn register(
    request: RegisterRequest,
    auth_service: State<'_, AuthService>,
) -> Result<RegisterResponse, String> {
    let user = auth_service
        .register(
            &request.tenant_id,
            &request.username,
            &request.password,
            &request.name,
            request.department.as_deref(),
        )
        .await
        .map_err(|e| e.to_string())?;

    Ok(RegisterResponse { user })
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(
    token: String,
    auth_service: State<'_, AuthService>,
) -> Result<Option<User>, String> {
    auth_service.verify_token(&token).await.map_err(|e| e.to_string())
}
