//! Security 模块 Tauri 命令

use crate::security::db::SecurityDatabase;
use crate::security::types::*;
use std::sync::Arc;
use tauri::State;
use tracing::info;

/// Security 状态
pub struct SecurityState {
    pub db: Arc<SecurityDatabase>,
}

impl SecurityState {
    pub fn new() -> Self {
        let db = Arc::new(SecurityDatabase::new());
        db.init_defaults();
        Self { db }
    }
}

impl Default for SecurityState {
    fn default() -> Self {
        Self::new()
    }
}

// ==================== 密钥命令 ====================

#[tauri::command]
pub async fn security_create_key(
    state: State<'_, SecurityState>,
    request: CreateKeyRequest,
    tenant_id: Option<String>,
    user_id: Option<String>,
) -> Result<SecretKey, String> {
    info!("创建密钥: {}", request.name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let user_id = user_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let key = SecretKey {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        key_type: request.key_type,
        key_value: uuid::Uuid::new_v4().to_string(),
        status: KeyStatus::Active,
        algorithm: request.algorithm.unwrap_or_else(|| "AES-256-GCM".to_string()),
        key_size: request.key_size.unwrap_or(256),
        expires_at: request.expires_at,
        rotation_policy: request.rotation_policy,
        metadata: request.metadata.unwrap_or_default(),
        tenant_id,
        created_at: now,
        updated_at: now,
        created_by: user_id,
    };
    
    state.db.create_key(key)
}

#[tauri::command]
pub async fn security_get_key(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<SecretKey, String> {
    info!("获取密钥: {}", id);
    state.db.get_key(&id).ok_or_else(|| "密钥不存在".to_string())
}

#[tauri::command]
pub async fn security_list_keys(
    state: State<'_, SecurityState>,
    params: Option<QueryKeysParams>,
) -> Result<PagedResult<KeyListItem>, String> {
    let params = params.unwrap_or_default();
    Ok(state.db.list_keys(&params))
}

#[tauri::command]
pub async fn security_update_key(
    state: State<'_, SecurityState>,
    id: String,
    request: UpdateKeyRequest,
) -> Result<SecretKey, String> {
    info!("更新密钥: {}", id);
    state.db.update_key(&id, request)
}

#[tauri::command]
pub async fn security_rotate_key(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<SecretKey, String> {
    info!("轮换密钥: {}", id);
    state.db.rotate_key(&id)
}

#[tauri::command]
pub async fn security_revoke_key(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<SecretKey, String> {
    info!("吊销密钥: {}", id);
    state.db.revoke_key(&id)
}

#[tauri::command]
pub async fn security_delete_key(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<(), String> {
    info!("删除密钥: {}", id);
    state.db.delete_key(&id)
}

#[tauri::command]
pub async fn security_get_stats(
    state: State<'_, SecurityState>,
) -> Result<KeyStats, String> {
    info!("获取密钥统计");
    Ok(state.db.get_stats())
}

// ==================== 加密命令 ====================

#[tauri::command]
pub async fn security_encrypt(
    state: State<'_, SecurityState>,
    request: EncryptRequest,
) -> Result<EncryptResult, String> {
    info!("加密数据");
    state.db.encrypt(&request)
}

#[tauri::command]
pub async fn security_decrypt(
    state: State<'_, SecurityState>,
    request: DecryptRequest,
) -> Result<DecryptResult, String> {
    info!("解密数据");
    state.db.decrypt(&request)
}

// ==================== 审计日志命令 ====================

#[tauri::command]
pub async fn security_get_audit_logs(
    state: State<'_, SecurityState>,
    key_id: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<AuditLog>, String> {
    info!("获取审计日志");
    Ok(state.db.get_audit_logs(key_id.as_deref(), limit.unwrap_or(100)))
}
