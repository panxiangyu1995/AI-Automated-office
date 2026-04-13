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

#[derive(Debug, Clone, Serialize, Deserialize)]
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
