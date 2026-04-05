//! Finance Mutate 工具
//!
//! 报销操作工具：提交、审核、调整等

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use serde::{Deserialize, Serialize};
use serde_json::json;

use super::{ExpenseAction, ExpenseOperation, ExpenseStatus, FinanceRole};
use crate::agent::tools::descriptor::{Tool, ToolCapabilities, ToolParameter, ToolParameterType, ToolParameterTypeSpec, ToolReturnType};

/// 报销操作参数
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceMutateParams {
    /// 操作类型
    pub action: String,
    /// 发票ID
    pub expense_id: String,
    /// 操作原因
    pub reason: Option<String>,
    /// 调整金额（调整操作时需要）
    pub amount: Option<f64>,
}

/// 报销操作工具
#[derive(Debug, Clone)]
pub struct FinanceMutateTool {
    /// 操作历史
    history: Arc<RwLock<Vec<ExpenseOperation>>>,
}

impl Default for FinanceMutateTool {
    fn default() -> Self {
        Self {
            history: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

impl FinanceMutateTool {
    /// 获取角色允许的操作
    fn get_allowed_actions(role: FinanceRole) -> Vec<ExpenseAction> {
        match role {
            FinanceRole::Staff => vec![ExpenseAction::Submit, ExpenseAction::Cancel],
            FinanceRole::Specialist => vec![
                ExpenseAction::Approve, 
                ExpenseAction::Reject, 
                ExpenseAction::Adjust
            ],
            FinanceRole::Manager | FinanceRole::Executive => {
                vec![
                    ExpenseAction::Submit,
                    ExpenseAction::Approve,
                    ExpenseAction::Reject,
                    ExpenseAction::Adjust,
                    ExpenseAction::Cancel,
                    ExpenseAction::Pay,
                ]
            }
        }
    }

    /// 获取角色金额限制
    fn get_amount_limit(role: FinanceRole) -> Option<f64> {
        match role {
            FinanceRole::Staff => Some(1000.0),
            FinanceRole::Specialist => Some(10000.0),
            FinanceRole::Manager => Some(100000.0),
            FinanceRole::Executive => None, // 无限制
        }
    }

    /// 验证操作权限
    fn validate_action(&self, action: &ExpenseAction, role: FinanceRole) -> Result<(), String> {
        let allowed = Self::get_allowed_actions(role);
        if !allowed.contains(action) {
            return Err(format!(
                "您的角色（{}）无权执行此操作（{}）",
                role, format!("{:?}", action)
            ));
        }
        Ok(())
    }

    /// 验证金额限制
    fn validate_amount(&self, amount: f64, role: FinanceRole) -> Result<(), String> {
        if let Some(limit) = Self::get_amount_limit(role) {
            if amount > limit {
                return Err(format!(
                    "金额（{:.2}）超过您的限额（{:.2}）",
                    amount, limit
                ));
            }
        }
        Ok(())
    }

    /// 执行操作
    pub async fn execute(
        &self,
        params: FinanceMutateParams,
        user_id: &str,
        role: FinanceRole,
    ) -> Result<serde_json::Value, String> {
        // 1. 解析操作类型
        let action = match params.action.to_lowercase().as_str() {
            "submit" | "提交" => ExpenseAction::Submit,
            "approve" | "批准" => ExpenseAction::Approve,
            "reject" | "拒绝" => ExpenseAction::Reject,
            "adjust" | "调整" => ExpenseAction::Adjust,
            "cancel" | "取消" => ExpenseAction::Cancel,
            "pay" | "付款" => ExpenseAction::Pay,
            _ => return Err(format!("未知操作类型: {}", params.action)),
        };

        // 2. 验证操作权限
        self.validate_action(&action, role)?;

        // 3. 验证金额（如果有的话）
        if let Some(amount) = params.amount {
            self.validate_amount(amount, role)?;
        }

        // 4. 记录操作
        let operation = ExpenseOperation {
            action,
            expense_id: params.expense_id.clone(),
            reason: params.reason.clone(),
            amount: params.amount,
        };

        {
            let mut history = self.history.write().await;
            history.push(operation);
        }

        // 5. 返回结果
        Ok(json!({
            "success": true,
            "message": format!("报销申请 {} 成功", params.action),
            "data": {
                "expenseId": params.expense_id,
                "action": format!("{:?}", operation.action).to_lowercase(),
                "operator": user_id,
                "timestamp": chrono::Utc::now().to_rfc3339(),
            }
        }))
    }
}

impl Tool for FinanceMutateTool {
    fn name(&self) -> &str {
        "finance_mutate"
    }

    fn description(&self) -> &str {
        "报销操作：提交、审核、调整、取消、付款"
    }

    fn capabilities(&self) -> ToolCapabilities {
        ToolCapabilities {
            supports_streaming: false,
            supports_cancellation: true,
            requires_permission: true,
            requires_confirmation: true,
            is_read_only: false,
            has_side_effects: true,
        }
    }

    fn parameters(&self) -> Vec<ToolParameter> {
        vec![
            ToolParameter {
                name: "action".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作类型".to_string(),
                required: true,
                default: None,
                enum_: Some(vec![
                    "submit".to_string(),
                    "approve".to_string(),
                    "reject".to_string(),
                    "adjust".to_string(),
                    "cancel".to_string(),
                    "pay".to_string(),
                ]),
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "expenseId".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "报销单ID".to_string(),
                required: true,
                default: None,
                enum_: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "reason".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::String),
                description: "操作原因".to_string(),
                required: false,
                default: None,
                enum_: None,
                minimum: None,
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
            ToolParameter {
                name: "amount".to_string(),
                param_type: ToolParameterTypeSpec::Single(ToolParameterType::Number),
                description: "调整金额".to_string(),
                required: false,
                default: None,
                enum_: None,
                minimum: Some(0.0),
                maximum: None,
                pattern: None,
                items: None,
                properties: None,
            },
        ]
    }

    fn return_type(&self) -> ToolReturnType {
        ToolReturnType {
            return_type: crate::agent::tools::descriptor::ToolParameterType::Object,
            description: Some("操作结果".to_string()),
            items: None,
            properties: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_staff_submit() {
        let tool = FinanceMutateTool::default();
        let result = tool.execute(
            FinanceMutateParams {
                action: "submit".to_string(),
                expense_id: "exp-001".to_string(),
                reason: Some("出差报销".to_string()),
                amount: Some(500.0),
            },
            "user-001",
            FinanceRole::Staff,
        ).await.unwrap();

        assert!(result["success"].as_bool().unwrap());
    }

    #[tokio::test]
    async fn test_staff_cannot_approve() {
        let tool = FinanceMutateTool::default();
        let result = tool.execute(
            FinanceMutateParams {
                action: "approve".to_string(),
                expense_id: "exp-001".to_string(),
                reason: Some("测试".to_string()),
                amount: None,
            },
            "user-001",
            FinanceRole::Staff,
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("无权执行"));
    }

    #[tokio::test]
    async fn test_amount_limit() {
        let tool = FinanceMutateTool::default();
        let result = tool.execute(
            FinanceMutateParams {
                action: "submit".to_string(),
                expense_id: "exp-001".to_string(),
                reason: Some("超额报销".to_string()),
                amount: Some(2000.0), // 超过 staff 的 1000 元限额
            },
            "user-001",
            FinanceRole::Staff,
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("超过您的限额"));
    }

    #[tokio::test]
    async fn test_manager_no_limit() {
        let tool = FinanceMutateTool::default();
        let result = tool.execute(
            FinanceMutateParams {
                action: "approve".to_string(),
                expense_id: "exp-001".to_string(),
                reason: Some("经理批准".to_string()),
                amount: Some(50000.0), // 超过 1000 但 manager 有限额 100000
            },
            "manager-001",
            FinanceRole::Manager,
        ).await;

        assert!(result.is_ok());
    }
}
