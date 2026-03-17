use tauri::State;
use serde::{Deserialize, Serialize};
use crate::auth::{AuthService, User};

#[derive(Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
    remember_me: bool,
}

#[derive(Serialize)]
pub struct LoginResponse {
    user: User,
    token: String,
}

#[tauri::command]
pub async fn login(
    request: LoginRequest,
    auth_service: State<'_, AuthService>,
) -> Result<LoginResponse, String> {
    let (user, token) = auth_service
        .login(&request.username, &request.password, request.remember_me)
        .await
        .map_err(|e| e.to_string())?;

    Ok(LoginResponse { user, token })
}

#[tauri::command]
pub async fn logout() -> Result<(), String> {
    // Logout is handled client-side by removing token
    Ok(())
}

#[tauri::command]
pub async fn get_current_user(
    token: String,
    auth_service: State<'_, AuthService>,
) -> Result<Option<User>, String> {
    auth_service.get_current_user(&token).await.map_err(|e| e.to_string())
}
