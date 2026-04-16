//! Security 模块数据库操作

use crate::security::types::*;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::info;

/// Security 数据库状态
pub struct SecurityDatabase {
    keys: RwLock<HashMap<String, SecretKey>>,
    audit_logs: RwLock<Vec<AuditLog>>,
    classifications: RwLock<HashMap<String, DataClassification>>,
    masking_rules: RwLock<HashMap<String, DataMaskingRule>>,
    retention_policies: RwLock<HashMap<String, DataRetentionPolicy>>,
    sensitive_access: RwLock<Vec<SensitiveDataAccess>>,
}

impl SecurityDatabase {
    pub fn new() -> Self {
        info!("初始化 Security 数据库");
        Self {
            keys: RwLock::new(HashMap::new()),
            audit_logs: RwLock::new(Vec::new()),
            classifications: RwLock::new(HashMap::new()),
            masking_rules: RwLock::new(HashMap::new()),
            retention_policies: RwLock::new(HashMap::new()),
            sensitive_access: RwLock::new(Vec::new()),
        }
    }

    pub fn init_defaults(&self) {
        info!("Security 数据库初始化完成");
    }

    // ==================== 密钥操作 ====================

    pub fn create_key(&self, key: SecretKey) -> Result<SecretKey, String> {
        let mut keys = self.keys.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = key.id.clone();
        keys.insert(id.clone(), key.clone());
        info!("创建密钥成功: {}", key.name);
        Ok(key)
    }

    pub fn get_key(&self, id: &str) -> Option<SecretKey> {
        self.keys.read().ok()?.get(id).cloned()
    }

    pub fn list_keys(&self, params: &QueryKeysParams) -> PagedResult<KeyListItem> {
        let keys = self.keys.read().unwrap_or_else(|e| e.into_inner());

        let mut items: Vec<KeyListItem> = keys
            .values()
            .filter(|k| {
                if let Some(ref kt) = params.key_type {
                    if &k.key_type != kt { return false; }
                }
                if let Some(ref status) = params.status {
                    if &k.status != status { return false; }
                }
                if let Some(ref search) = params.search {
                    let search_lower = search.to_lowercase();
                    if !k.name.to_lowercase().contains(&search_lower) { return false; }
                }
                true
            })
            .map(|k| KeyListItem {
                id: k.id.clone(),
                name: k.name.clone(),
                key_type: k.key_type,
                status: k.status,
                algorithm: k.algorithm.clone(),
                expires_at: k.expires_at,
                created_at: k.created_at,
            })
            .collect();

        items.sort_by(|a, b| b.created_at.cmp(&a.created_at));

        let page = params.page.unwrap_or(1).max(1);
        let page_size = params.page_size.unwrap_or(20).min(100);
        let total = items.len() as u32;
        let start = ((page - 1) * page_size) as usize;
        let end = (start + page_size as usize).min(items.len());
        let page_items = if start < items.len() { items[start..end].to_vec() } else { Vec::new() };

        PagedResult { items: page_items, total, page, page_size }
    }

    pub fn update_key(&self, id: &str, request: UpdateKeyRequest) -> Result<SecretKey, String> {
        let mut keys = self.keys.write().map_err(|_| "获取写入锁失败".to_string())?;
        let key = keys.get_mut(id).ok_or("密钥不存在")?;
        
        if let Some(name) = request.name { key.name = name; }
        if let Some(expires) = request.expires_at { key.expires_at = Some(expires); }
        if let Some(policy) = request.rotation_policy { key.rotation_policy = Some(policy); }
        if let Some(metadata) = request.metadata { key.metadata = metadata; }
        key.updated_at = chrono::Utc::now().timestamp();
        
        info!("更新密钥成功: {}", id);
        Ok(key.clone())
    }

    pub fn rotate_key(&self, id: &str) -> Result<SecretKey, String> {
        let mut keys = self.keys.write().map_err(|_| "获取写入锁失败".to_string())?;
        let key = keys.get_mut(id).ok_or("密钥不存在")?;
        
        // 生成新密钥值 (模拟)
        let new_value = format!("rotated_{}_{}", uuid::Uuid::new_v4(), chrono::Utc::now().timestamp_millis());
        key.key_value = new_value;
        key.updated_at = chrono::Utc::now().timestamp();
        
        if let Some(ref mut policy) = key.rotation_policy {
            policy.last_rotated = Some(chrono::Utc::now().timestamp());
        }
        
        info!("轮换密钥成功: {}", id);
        Ok(key.clone())
    }

    pub fn revoke_key(&self, id: &str) -> Result<SecretKey, String> {
        let mut keys = self.keys.write().map_err(|_| "获取写入锁失败".to_string())?;
        let key = keys.get_mut(id).ok_or("密钥不存在")?;
        key.status = KeyStatus::Revoked;
        key.updated_at = chrono::Utc::now().timestamp();
        
        info!("吊销密钥成功: {}", id);
        Ok(key.clone())
    }

    pub fn delete_key(&self, id: &str) -> Result<(), String> {
        let mut keys = self.keys.write().map_err(|_| "获取写入锁失败".to_string())?;
        if keys.remove(id).is_none() {
            return Err("密钥不存在".to_string());
        }
        info!("删除密钥成功: {}", id);
        Ok(())
    }

    pub fn get_stats(&self) -> KeyStats {
        let keys = self.keys.read().unwrap_or_else(|e| e.into_inner());
        let now = chrono::Utc::now().timestamp();
        
        let total = keys.len() as u32;
        let active = keys.values().filter(|k| k.status == KeyStatus::Active).count() as u32;
        let expiring = keys.values().filter(|k| {
            k.status == KeyStatus::Active && 
            k.expires_at.map(|e| e - now < 7 * 24 * 3600).unwrap_or(false)
        }).count() as u32;
        let expired = keys.values().filter(|k| k.status == KeyStatus::Expired).count() as u32;
        
        KeyStats { total_keys: total, active_keys: active, expiring_keys: expiring, expired_keys: expired }
    }

    // ==================== 加密操作 ====================

    pub fn encrypt(&self, request: &EncryptRequest) -> Result<EncryptResult, String> {
        let key_id = request.key_id.clone().unwrap_or_else(|| "default".to_string());
        let algorithm = request.algorithm.clone().unwrap_or_else(|| "AES-256-GCM".to_string());
        
        // 模拟加密 (实际使用 AES-256-GCM)
        let iv = uuid::Uuid::new_v4().to_string().replace("-", "").chars().take(24).collect::<String>();
        let ciphertext = format!("enc:{}:{}", iv, request.plaintext);
        
        Ok(EncryptResult {
            ciphertext,
            key_id,
            algorithm,
            iv,
        })
    }

    pub fn decrypt(&self, request: &DecryptRequest) -> Result<DecryptResult, String> {
        // 模拟解密
        let parts: Vec<&str> = request.ciphertext.splitn(3, ':').collect();
        let plaintext = if parts.len() >= 3 { parts[2].to_string() } else { request.ciphertext.clone() };
        
        Ok(DecryptResult { plaintext })
    }

    // ==================== 审计日志 ====================

    pub fn add_audit_log(&self, log: AuditLog) {
        let mut logs = self.audit_logs.write().unwrap_or_else(|e| e.into_inner());
        logs.push(log);
        
        // 保持最近 10000 条
        if logs.len() > 10000 {
            logs.drain(0..1000);
        }
    }

    pub fn get_audit_logs(&self, key_id: Option<&str>, limit: usize) -> Vec<AuditLog> {
        let logs = self.audit_logs.read().unwrap_or_else(|e| e.into_inner());
        logs.iter()
            .filter(|l| key_id.map(|k| l.key_id.as_deref() == Some(k)).unwrap_or(true))
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    // ==================== 数据治理 ====================

    pub fn create_classification(&self, classification: DataClassification) -> Result<DataClassification, String> {
        let mut classifications = self.classifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = classification.id.clone();
        classifications.insert(id, classification.clone());
        info!("创建数据分类成功: {}", classification.name);
        Ok(classification)
    }

    pub fn get_classification(&self, id: &str) -> Option<DataClassification> {
        self.classifications.read().ok()?.get(id).cloned()
    }

    pub fn list_classifications(&self) -> Vec<DataClassification> {
        self.classifications.read().unwrap_or_else(|e| e.into_inner()).values().cloned().collect()
    }

    pub fn update_classification(&self, id: &str, request: UpdateClassificationRequest) -> Result<DataClassification, String> {
        let mut classifications = self.classifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        let classification = classifications.get_mut(id).ok_or("数据分类不存在")?;
        
        if let Some(name) = request.name { classification.name = name; }
        if let Some(sensitivity) = request.sensitivity { classification.sensitivity = sensitivity; }
        if let Some(description) = request.description { classification.description = description; }
        if let Some(retention_days) = request.retention_days { classification.retention_days = retention_days; }
        if let Some(encryption_required) = request.encryption_required { classification.encryption_required = encryption_required; }
        if let Some(metadata) = request.metadata { classification.metadata = metadata; }
        classification.updated_at = chrono::Utc::now().timestamp();
        
        Ok(classification.clone())
    }

    pub fn delete_classification(&self, id: &str) -> Result<(), String> {
        let mut classifications = self.classifications.write().map_err(|_| "获取写入锁失败".to_string())?;
        if classifications.remove(id).is_none() {
            return Err("数据分类不存在".to_string());
        }
        Ok(())
    }

    pub fn create_masking_rule(&self, rule: DataMaskingRule) -> Result<DataMaskingRule, String> {
        let mut rules = self.masking_rules.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = rule.id.clone();
        rules.insert(id, rule.clone());
        info!("创建脱敏规则成功: {}", rule.field_name);
        Ok(rule)
    }

    pub fn get_masking_rule(&self, id: &str) -> Option<DataMaskingRule> {
        self.masking_rules.read().ok()?.get(id).cloned()
    }

    pub fn list_masking_rules(&self) -> Vec<DataMaskingRule> {
        self.masking_rules.read().unwrap_or_else(|e| e.into_inner()).values().cloned().collect()
    }

    pub fn update_masking_rule(&self, id: &str, request: UpdateMaskingRuleRequest) -> Result<DataMaskingRule, String> {
        let mut rules = self.masking_rules.write().map_err(|_| "获取写入锁失败".to_string())?;
        let rule = rules.get_mut(id).ok_or("脱敏规则不存在")?;
        
        if let Some(masking_type) = request.masking_type { rule.masking_type = masking_type; }
        if let Some(pattern) = request.pattern { rule.pattern = Some(pattern); }
        if let Some(enabled) = request.enabled { rule.enabled = enabled; }
        rule.updated_at = chrono::Utc::now().timestamp();
        
        Ok(rule.clone())
    }

    pub fn delete_masking_rule(&self, id: &str) -> Result<(), String> {
        let mut rules = self.masking_rules.write().map_err(|_| "获取写入锁失败".to_string())?;
        if rules.remove(id).is_none() {
            return Err("脱敏规则不存在".to_string());
        }
        Ok(())
    }

    pub fn apply_masking(&self, value: &str, rule: &DataMaskingRule) -> String {
        match rule.masking_type {
            MaskingType::Full => "*".repeat(value.len()),
            MaskingType::Partial => {
                if value.len() <= 4 {
                    "*".repeat(value.len())
                } else {
                    format!("{}****", &value[0..value.len()-4])
                }
            },
            MaskingType::Email => {
                if let Some(idx) = value.find('@') {
                    let (name, _domain) = value.split_at(idx);
                    let masked_name = if name.len() <= 2 {
                        "*".repeat(name.len())
                    } else {
                        format!("{}**", &name[0..2])
                    };
                    format!("{}@", masked_name)
                } else {
                    value.to_string()
                }
            },
            MaskingType::Phone => {
                if value.len() >= 7 {
                    format!("{}****{}", &value[0..3], &value[value.len()-4..])
                } else {
                    "*".repeat(value.len())
                }
            },
            MaskingType::IdCard => {
                if value.len() >= 10 {
                    format!("{}**********{}", &value[0..6], &value[value.len()-4..])
                } else {
                    "*".repeat(value.len())
                }
            },
            MaskingType::Custom => {
                rule.pattern.as_ref().map(|p| p.clone()).unwrap_or_else(|| "*".repeat(value.len()))
            },
        }
    }

    pub fn create_retention_policy(&self, policy: DataRetentionPolicy) -> Result<DataRetentionPolicy, String> {
        let mut policies = self.retention_policies.write().map_err(|_| "获取写入锁失败".to_string())?;
        let id = policy.id.clone();
        policies.insert(id, policy.clone());
        info!("创建保留策略成功: {}", policy.name);
        Ok(policy)
    }

    pub fn list_retention_policies(&self) -> Vec<DataRetentionPolicy> {
        self.retention_policies.read().unwrap_or_else(|e| e.into_inner()).values().cloned().collect()
    }

    pub fn record_sensitive_access(&self, access: SensitiveDataAccess) {
        let mut accesses = self.sensitive_access.write().unwrap_or_else(|e| e.into_inner());
        accesses.push(access);
        
        if accesses.len() > 10000 {
            accesses.drain(0..1000);
        }
    }

    pub fn get_sensitive_access(&self, user_id: Option<&str>, limit: usize) -> Vec<SensitiveDataAccess> {
        let accesses = self.sensitive_access.read().unwrap_or_else(|e| e.into_inner());
        accesses.iter()
            .filter(|a| user_id.map(|u| a.user_id == u).unwrap_or(true))
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }

    pub fn get_governance_stats(&self) -> GovernanceStats {
        let classifications = self.classifications.read().unwrap_or_else(|e| e.into_inner());
        let rules = self.masking_rules.read().unwrap_or_else(|e| e.into_inner());
        let policies = self.retention_policies.read().unwrap_or_else(|e| e.into_inner());
        let accesses = self.sensitive_access.read().unwrap_or_else(|e| e.into_inner());
        
        GovernanceStats {
            total_classifications: classifications.len() as u32,
            total_masking_rules: rules.len() as u32,
            total_retention_policies: policies.len() as u32,
            sensitive_access_count: accesses.len() as u32,
        }
    }
}

impl Default for SecurityDatabase {
    fn default() -> Self {
        Self::new()
    }
}
