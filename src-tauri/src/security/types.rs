//! Security 模块类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ==================== 密钥库类型 ====================

/// 密钥类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum KeyType {
    Master,
    DataEncryption,
    Signing,
    Api,
    Database,
}

impl Default for KeyType {
    fn default() -> Self {
        Self::Api
    }
}

/// 密钥状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum KeyStatus {
    Active,
    Rotating,
    Expired,
    Revoked,
}

impl Default for KeyStatus {
    fn default() -> Self {
        Self::Active
    }
}

/// 密钥
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecretKey {
    pub id: String,
    pub name: String,
    pub key_type: KeyType,
    pub key_value: String,
    pub status: KeyStatus,
    pub algorithm: String,
    pub key_size: i32,
    pub expires_at: Option<i64>,
    pub rotation_policy: Option<RotationPolicy>,
    pub metadata: HashMap<String, String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
}

impl Default for SecretKey {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            key_type: KeyType::default(),
            key_value: String::new(),
            status: KeyStatus::default(),
            algorithm: "AES-256-GCM".to_string(),
            key_size: 256,
            expires_at: None,
            rotation_policy: None,
            metadata: HashMap::new(),
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
            created_by: String::new(),
        }
    }
}

/// 轮换策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RotationPolicy {
    pub enabled: bool,
    pub interval_days: i32,
    pub last_rotated: Option<i64>,
    pub next_rotation: Option<i64>,
    pub auto_rotate: bool,
}

// ==================== 加密操作类型 ====================

/// 加密请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptRequest {
    pub plaintext: String,
    pub key_id: Option<String>,
    pub algorithm: Option<String>,
}

/// 加密结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptResult {
    pub ciphertext: String,
    pub key_id: String,
    pub algorithm: String,
    pub iv: String,
}

/// 解密请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptRequest {
    pub ciphertext: String,
    pub key_id: String,
    pub algorithm: String,
    pub iv: String,
}

/// 解密结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptResult {
    pub plaintext: String,
}

// ==================== 审计日志类型 ====================

/// 审计事件类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AuditEventType {
    KeyCreated,
    KeyAccessed,
    KeyRotated,
    KeyExpired,
    KeyRevoked,
    EncryptionPerformed,
    DecryptionPerformed,
    AccessDenied,
}

impl Default for AuditEventType {
    fn default() -> Self {
        Self::KeyAccessed
    }
}

/// 审计日志
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLog {
    pub id: String,
    pub event_type: AuditEventType,
    pub key_id: Option<String>,
    pub user_id: String,
    pub ip_address: Option<String>,
    pub user_agent: Option<String>,
    pub success: bool,
    pub error_message: Option<String>,
    pub metadata: HashMap<String, String>,
    pub timestamp: i64,
}

// ==================== 请求/响应类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateKeyRequest {
    pub name: String,
    pub key_type: KeyType,
    pub algorithm: Option<String>,
    pub key_size: Option<i32>,
    pub expires_at: Option<i64>,
    pub rotation_policy: Option<RotationPolicy>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateKeyRequest {
    pub name: Option<String>,
    pub expires_at: Option<i64>,
    pub rotation_policy: Option<RotationPolicy>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RotateKeyRequest {
    pub key_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct QueryKeysParams {
    pub key_type: Option<KeyType>,
    pub status: Option<KeyStatus>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PagedResult<T> {
    pub items: Vec<T>,
    pub total: u32,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyListItem {
    pub id: String,
    pub name: String,
    pub key_type: KeyType,
    pub status: KeyStatus,
    pub algorithm: String,
    pub expires_at: Option<i64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyStats {
    pub total_keys: u32,
    pub active_keys: u32,
    pub expiring_keys: u32,
    pub expired_keys: u32,
}

// ==================== 数据治理类型 ====================

/// 数据敏感等级
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DataSensitivity {
    Public,
    Internal,
    Confidential,
    HighlyConfidential,
}

impl Default for DataSensitivity {
    fn default() -> Self {
        Self::Internal
    }
}

/// 数据分类
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataClassification {
    pub id: String,
    pub name: String,
    pub sensitivity: DataSensitivity,
    pub description: String,
    pub retention_days: i32,
    pub encryption_required: bool,
    pub metadata: HashMap<String, String>,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for DataClassification {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            sensitivity: DataSensitivity::default(),
            description: String::new(),
            retention_days: 365,
            encryption_required: true,
            metadata: HashMap::new(),
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 数据脱敏规则
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataMaskingRule {
    pub id: String,
    pub field_name: String,
    pub masking_type: MaskingType,
    pub pattern: Option<String>,
    pub enabled: bool,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for DataMaskingRule {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            field_name: String::new(),
            masking_type: MaskingType::default(),
            pattern: None,
            enabled: true,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 脱敏类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MaskingType {
    Full,
    Partial,
    Email,
    Phone,
    IdCard,
    Custom,
}

impl Default for MaskingType {
    fn default() -> Self {
        Self::Partial
    }
}

/// 数据保留策略
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DataRetentionPolicy {
    pub id: String,
    pub name: String,
    pub data_type: String,
    pub retention_days: i32,
    pub auto_delete: bool,
    pub archive_before_delete: bool,
    pub tenant_id: String,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Default for DataRetentionPolicy {
    fn default() -> Self {
        let now = chrono::Utc::now().timestamp();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            name: String::new(),
            data_type: String::new(),
            retention_days: 365,
            auto_delete: false,
            archive_before_delete: true,
            tenant_id: String::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// 敏感数据访问记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SensitiveDataAccess {
    pub id: String,
    pub data_type: String,
    pub field_name: String,
    pub access_type: String,
    pub user_id: String,
    pub reason: String,
    pub ip_address: Option<String>,
    pub timestamp: i64,
}

/// 治理统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GovernanceStats {
    pub total_classifications: u32,
    pub total_masking_rules: u32,
    pub total_retention_policies: u32,
    pub sensitive_access_count: u32,
}

// ==================== 数据治理请求类型 ====================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateClassificationRequest {
    pub name: String,
    pub sensitivity: DataSensitivity,
    pub description: Option<String>,
    pub retention_days: Option<i32>,
    pub encryption_required: Option<bool>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateClassificationRequest {
    pub name: Option<String>,
    pub sensitivity: Option<DataSensitivity>,
    pub description: Option<String>,
    pub retention_days: Option<i32>,
    pub encryption_required: Option<bool>,
    pub metadata: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateMaskingRuleRequest {
    pub field_name: String,
    pub masking_type: MaskingType,
    pub pattern: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMaskingRuleRequest {
    pub masking_type: Option<MaskingType>,
    pub pattern: Option<String>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRetentionPolicyRequest {
    pub name: String,
    pub data_type: String,
    pub retention_days: i32,
    pub auto_delete: Option<bool>,
    pub archive_before_delete: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaskingRequest {
    pub value: String,
    pub rule_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MaskingResponse {
    pub original_value: String,
    pub masked_value: String,
    pub rule_id: String,
}
