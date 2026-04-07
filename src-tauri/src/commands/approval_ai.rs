//! 审批AI辅助 Tauri 命令
//!
//! 暴露AI辅助功能给前端

use std::sync::Arc;
use tokio::sync::RwLock;
use tauri::State;

use crate::approval::ai_assist::{
    ApprovalAIAssist, ApprovalData, DateRange, SmartFillResult, PredictionResult,
    RiskAlert,
};

pub struct ApprovalAIState(pub Arc<RwLock<ApprovalAIAssist>>);

/// 检测审批风险
#[tauri::command]
pub async fn detect_approval_risks(
    state: State<'_, ApprovalAIState>,
    approval: ApprovalData,
) -> Result<Vec<RiskAlert>, String> {
    let assist = state.0.read().await;
    Ok(assist.detect_risks(&approval))
}

/// 生成审批摘要
#[tauri::command]
pub async fn generate_approval_summary(
    state: State<'_, ApprovalAIState>,
    approvals: Vec<ApprovalData>,
    date_range: DateRange,
) -> Result<crate::approval::ai_assist::ApprovalSummary, String> {
    let assist = state.0.read().await;
    Ok(assist.generate_summary(&approvals, &date_range))
}

/// 智能表单填充
#[tauri::command]
pub async fn smart_fill_form(
    state: State<'_, ApprovalAIState>,
    form_type: String,
    context: String,
) -> Result<SmartFillResult, String> {
    let assist = state.0.read().await;
    Ok(assist.smart_fill(&form_type, &context))
}

/// 预测审批结果
#[tauri::command]
pub async fn predict_approval_outcome(
    state: State<'_, ApprovalAIState>,
    approval: ApprovalData,
) -> Result<PredictionResult, String> {
    let assist = state.0.read().await;
    Ok(assist.predict_outcome(&approval))
}

/// 初始化AI辅助服务
pub fn init_approval_ai_service() -> ApprovalAIState {
    ApprovalAIState(Arc::new(RwLock::new(ApprovalAIAssist::new())))
}
