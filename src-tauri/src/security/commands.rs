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

// ==================== 数据治理命令 ====================

#[tauri::command]
pub async fn security_create_classification(
    state: State<'_, SecurityState>,
    request: CreateClassificationRequest,
    tenant_id: Option<String>,
) -> Result<DataClassification, String> {
    info!("创建数据分类: {}", request.name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let classification = DataClassification {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        sensitivity: request.sensitivity,
        description: request.description.unwrap_or_default(),
        retention_days: request.retention_days.unwrap_or(365),
        encryption_required: request.encryption_required.unwrap_or(true),
        metadata: request.metadata.unwrap_or_default(),
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_classification(classification)
}

#[tauri::command]
pub async fn security_get_classification(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<DataClassification, String> {
    info!("获取数据分类: {}", id);
    state.db.get_classification(&id).ok_or_else(|| "数据分类不存在".to_string())
}

#[tauri::command]
pub async fn security_list_classifications(
    state: State<'_, SecurityState>,
) -> Result<Vec<DataClassification>, String> {
    info!("列出数据分类");
    Ok(state.db.list_classifications())
}

#[tauri::command]
pub async fn security_update_classification(
    state: State<'_, SecurityState>,
    id: String,
    request: UpdateClassificationRequest,
) -> Result<DataClassification, String> {
    info!("更新数据分类: {}", id);
    state.db.update_classification(&id, request)
}

#[tauri::command]
pub async fn security_delete_classification(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<(), String> {
    info!("删除数据分类: {}", id);
    state.db.delete_classification(&id)
}

#[tauri::command]
pub async fn security_create_masking_rule(
    state: State<'_, SecurityState>,
    request: CreateMaskingRuleRequest,
    tenant_id: Option<String>,
) -> Result<DataMaskingRule, String> {
    info!("创建脱敏规则: {}", request.field_name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let rule = DataMaskingRule {
        id: uuid::Uuid::new_v4().to_string(),
        field_name: request.field_name,
        masking_type: request.masking_type,
        pattern: request.pattern,
        enabled: request.enabled.unwrap_or(true),
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_masking_rule(rule)
}

#[tauri::command]
pub async fn security_list_masking_rules(
    state: State<'_, SecurityState>,
) -> Result<Vec<DataMaskingRule>, String> {
    info!("列出脱敏规则");
    Ok(state.db.list_masking_rules())
}

#[tauri::command]
pub async fn security_update_masking_rule(
    state: State<'_, SecurityState>,
    id: String,
    request: UpdateMaskingRuleRequest,
) -> Result<DataMaskingRule, String> {
    info!("更新脱敏规则: {}", id);
    state.db.update_masking_rule(&id, request)
}

#[tauri::command]
pub async fn security_delete_masking_rule(
    state: State<'_, SecurityState>,
    id: String,
) -> Result<(), String> {
    info!("删除脱敏规则: {}", id);
    state.db.delete_masking_rule(&id)
}

#[tauri::command]
pub async fn security_apply_masking(
    state: State<'_, SecurityState>,
    request: MaskingRequest,
) -> Result<MaskingResponse, String> {
    info!("应用脱敏: {}", request.rule_id);
    let rule = state.db.get_masking_rule(&request.rule_id).ok_or("脱敏规则不存在")?;
    let masked = state.db.apply_masking(&request.value, &rule);
    Ok(MaskingResponse {
        original_value: request.value,
        masked_value: masked,
        rule_id: request.rule_id,
    })
}

#[tauri::command]
pub async fn security_create_retention_policy(
    state: State<'_, SecurityState>,
    request: CreateRetentionPolicyRequest,
    tenant_id: Option<String>,
) -> Result<DataRetentionPolicy, String> {
    info!("创建保留策略: {}", request.name);
    let tenant_id = tenant_id.unwrap_or_else(|| "default".to_string());
    let now = chrono::Utc::now().timestamp();
    
    let policy = DataRetentionPolicy {
        id: uuid::Uuid::new_v4().to_string(),
        name: request.name,
        data_type: request.data_type,
        retention_days: request.retention_days,
        auto_delete: request.auto_delete.unwrap_or(false),
        archive_before_delete: request.archive_before_delete.unwrap_or(true),
        tenant_id,
        created_at: now,
        updated_at: now,
    };
    
    state.db.create_retention_policy(policy)
}

#[tauri::command]
pub async fn security_list_retention_policies(
    state: State<'_, SecurityState>,
) -> Result<Vec<DataRetentionPolicy>, String> {
    info!("列出保留策略");
    Ok(state.db.list_retention_policies())
}

#[tauri::command]
pub async fn security_record_sensitive_access(
    state: State<'_, SecurityState>,
    access: SensitiveDataAccess,
) -> Result<(), String> {
    info!("记录敏感数据访问");
    state.db.record_sensitive_access(access);
    Ok(())
}

#[tauri::command]
pub async fn security_get_sensitive_access(
    state: State<'_, SecurityState>,
    user_id: Option<String>,
    limit: Option<usize>,
) -> Result<Vec<SensitiveDataAccess>, String> {
    info!("获取敏感数据访问记录");
    Ok(state.db.get_sensitive_access(user_id.as_deref(), limit.unwrap_or(100)))
}

#[tauri::command]
pub async fn security_get_governance_stats(
    state: State<'_, SecurityState>,
) -> Result<GovernanceStats, String> {
    info!("获取治理统计");
    Ok(state.db.get_governance_stats())
}
