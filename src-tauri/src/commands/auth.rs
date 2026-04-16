use tauri::State;
use serde::{Deserialize, Serialize};
use crate::auth::{AuthService, User, check_permission, Permission};

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

/// Register requires admin permission — only admins can create new users
#[tauri::command]
pub async fn register(
    request: RegisterRequest,
    auth_service: State<'_, AuthService>,
    current_token: Option<String>,
) -> Result<RegisterResponse, String> {
    // RBAC: verify the caller has admin permission
    if let Some(token) = current_token {
        let caller = auth_service.verify_token(&token).await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "未认证：请先登录".to_string())?;
        check_permission(&caller, Permission::Admin)?;
    } else {
        return Err("未认证：请先登录".to_string());
    }

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

/// Check if the current user has a specific permission level
#[tauri::command]
pub async fn check_user_permission(
    token: String,
    permission: String,
    auth_service: State<'_, AuthService>,
) -> Result<bool, String> {
    let user = auth_service.verify_token(&token).await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "未认证".to_string())?;

    let required = match permission.as_str() {
        "admin" => Permission::Admin,
        "write" => Permission::Write,
        _ => Permission::Read,
    };

    Ok(check_permission(&user, required).is_ok())
}
