//! 审批委托模块
//!
//! 实现FR143-FR148: 审批委托功能

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 委托类型
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum DelegationType {
    /// 全权委托 - 所有审批都委托
    Full,
    /// 分类委托 - 指定类型的审批委托
    Category { categories: Vec<String> },
    /// 金额委托 - 小于指定金额的审批委托
    Amount { max_amount: f64 },
}

/// 审批委托
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalDelegation {
    /// 委托ID
    pub id: String,
    /// 原审批人ID
    pub delegator_id: String,
    /// 被委托人ID
    pub delegate_id: String,
    /// 委托类型
    pub delegation_type: DelegationType,
    /// 开始时间
    pub start_time: DateTime<Utc>,
    /// 结束时间
    pub end_time: Option<DateTime<Utc>>,
    /// 是否激活
    pub is_active: bool,
    /// 委托原因
    pub reason: Option<String>,
    /// 创建时间
    pub created_at: DateTime<Utc>,
}

impl ApprovalDelegation {
    pub fn new(
        delegator_id: String,
        delegate_id: String,
        delegation_type: DelegationType,
        start_time: DateTime<Utc>,
        end_time: Option<DateTime<Utc>>,
        reason: Option<String>,
    ) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            delegator_id,
            delegate_id,
            delegation_type,
            start_time,
            end_time,
            is_active: true,
            reason,
            created_at: Utc::now(),
        }
    }

    /// 检查是否在有效期内
    pub fn is_valid(&self) -> bool {
        if !self.is_active {
            return false;
        }
        
        let now = Utc::now();
        if now < self.start_time {
            return false;
        }
        
        if let Some(end) = self.end_time {
            if now > end {
                return false;
            }
        }
        
        true
    }

    /// 检查是否适用于指定审批
    pub fn matches_approval(&self, category: &str, amount: f64) -> bool {
        if !self.is_valid() {
            return false;
        }
        
        match &self.delegation_type {
            DelegationType::Full => true,
            DelegationType::Category { categories } => categories.contains(&category.to_string()),
            DelegationType::Amount { max_amount } => amount <= *max_amount,
        }
    }
}

/// 委托存储服务
pub struct DelegationStore {
    /// 委托映射
    delegations: Arc<RwLock<HashMap<String, ApprovalDelegation>>>,
    /// 用户委托映射 (user_id -> delegation_id)
    user_delegations: Arc<RwLock<HashMap<String, String>>>,
}

impl DelegationStore {
    pub fn new() -> Self {
        Self {
            delegations: Arc::new(RwLock::new(HashMap::new())),
            user_delegations: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// 设置委托
    pub async fn set_delegation(
        &self,
        delegation: ApprovalDelegation,
    ) -> Result<ApprovalDelegation, DelegationError> {
        // 校验委托人 != 被委托人
        if delegation.delegator_id == delegation.delegate_id {
            return Err(DelegationError::SelfDelegation);
        }
        
        // 校验时间
        if delegation.start_time < Utc::now() {
            return Err(DelegationError::InvalidStartTime);
        }
        
        if let Some(end) = delegation.end_time {
            if end < delegation.start_time {
                return Err(DelegationError::InvalidTimeRange);
            }
        }
        
        let id = delegation.id.clone();
        let delegator_id = delegation.delegator_id.clone();
        
        // 保存委托
        let mut delegations = self.delegations.write().await;
        delegations.insert(id.clone(), delegation);

        // 更新用户映射
        let mut user_delegations = self.user_delegations.write().await;
        user_delegations.insert(delegator_id, id.clone());

        Ok(delegations.get(&id).unwrap().clone())
    }

    /// 取消委托
    pub async fn cancel_delegation(
        &self,
        delegation_id: &str,
        user_id: &str,
    ) -> Result<(), DelegationError> {
        let mut delegations = self.delegations.write().await;

        // Get mutable reference to check and modify
        let delegation = delegations.get_mut(delegation_id)
            .ok_or(DelegationError::NotFound)?;

        // 只能本人取消
        if delegation.delegator_id != user_id {
            return Err(DelegationError::PermissionDenied);
        }

        delegation.is_active = false;

        // 清理用户映射
        let mut user_delegations = self.user_delegations.write().await;
        user_delegations.remove(&delegation.delegator_id);

        Ok(())
    }

    /// 获取用户的委托
    pub async fn get_delegation(
        &self,
        user_id: &str,
    ) -> Option<ApprovalDelegation> {
        let user_delegations = self.user_delegations.read().await;

        user_delegations.get(user_id).cloned().and_then(|id| {
            let delegations = self.delegations.blocking_read();
            delegations.get(&id).cloned()
        })
    }

    /// 获取作为被委托人的委托列表
    pub async fn get_delegations_as_delegate(
        &self,
        delegate_id: &str,
    ) -> Vec<ApprovalDelegation> {
        let delegations = self.delegations.read().await;
        
        delegations.values()
            .filter(|d| d.delegate_id == delegate_id && d.is_valid())
            .cloned()
            .collect()
    }

    /// 获取有效的委托
    pub async fn get_active_delegation(
        &self,
        user_id: &str,
    ) -> Option<ApprovalDelegation> {
        self.get_delegation(user_id).await
            .filter(|d| d.is_valid())
    }

    /// 解析委托请求 (用于审批时查找实际审批人)
    pub async fn resolve_delegation(
        &self,
        approver_id: &str,
    ) -> Option<ApprovalDelegation> {
        self.get_active_delegation(approver_id).await
    }
}

impl Default for DelegationStore {
    fn default() -> Self {
        Self::new()
    }
}

/// 委托错误
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum DelegationError {
    /// 不能委托给自己
    SelfDelegation,
    /// 无效的开始时间
    InvalidStartTime,
    /// 无效的时间范围
    InvalidTimeRange,
    /// 委托不存在
    NotFound,
    /// 无权限
    PermissionDenied,
    /// 时间冲突
    TimeConflict,
}

impl std::fmt::Display for DelegationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::SelfDelegation => write!(f, "不能委托给自己"),
            Self::InvalidStartTime => write!(f, "开始时间无效"),
            Self::InvalidTimeRange => write!(f, "结束时间早于开始时间"),
            Self::NotFound => write!(f, "委托不存在"),
            Self::PermissionDenied => write!(f, "无权限操作"),
            Self::TimeConflict => write!(f, "时间冲突"),
        }
    }
}

impl std::error::Error for DelegationError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_set_delegation() {
        let store = DelegationStore::new();
        
        let delegation = ApprovalDelegation::new(
            "user-1".to_string(),
            "user-2".to_string(),
            DelegationType::Full,
            Utc::now(),
            None,
            Some("出差期间".to_string()),
        );
        
        let result = store.set_delegation(delegation).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_self_delegation() {
        let store = DelegationStore::new();
        
        let delegation = ApprovalDelegation::new(
            "user-1".to_string(),
            "user-1".to_string(),
            DelegationType::Full,
            Utc::now(),
            None,
            None,
        );
        
        let result = store.set_delegation(delegation).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_cancel_delegation() {
        let store = DelegationStore::new();
        
        let delegation = ApprovalDelegation::new(
            "user-1".to_string(),
            "user-2".to_string(),
            DelegationType::Full,
            Utc::now(),
            None,
            None,
        );
        
        let created = store.set_delegation(delegation).await.unwrap();
        let result = store.cancel_delegation(&created.id, "user-1").await;
        assert!(result.is_ok());
        
        let delegation = store.get_delegation("user-1").await;
        assert!(delegation.is_none());
    }
}
