//! Approval 模块数据类型定义

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 审批流程状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FlowStatus {
    Draft,
    Active,
    Archived,
}

impl Default for FlowStatus {
    fn default() -> Self {
        Self::Draft
    }
}

/// 审批记录状态
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum RecordStatus {
    Pending,
    Approved,
    Rejected,
    Cancelled,
}

impl Default for RecordStatus {
    fn default() -> Self {
        Self::Pending
    }
}

impl std::fmt::Display for RecordStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pending => write!(f, "pending"),
            Self::Approved => write!(f, "approved"),
            Self::Rejected => write!(f, "rejected"),
            Self::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// 审批步骤类型
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum StepType {
    Sequential,
    Parallel,
}

/// 审批条件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalCondition {
    pub field: String,
    pub operator: String,
    pub value: serde_json::Value,
}

/// 审批人
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Approver {
    pub id: String,
    pub name: String,
    pub employee_id: String,
}

/// 审批步骤
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalStep {
    pub id: String,
    pub order: i32,
    pub approvers: Vec<Approver>,
    pub step_type: StepType,
    pub condition: Option<ApprovalCondition>,
}

/// 审批流程
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalFlow {
    pub id: String,
    pub name: String,
    pub description: String,
    pub steps: Vec<ApprovalStep>,
    pub form_schema: HashMap<String, serde_json::Value>,
    pub status: FlowStatus,
    pub created_by: String,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 审批历史
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalHistory {
    pub id: String,
    pub step_id: String,
    pub approver_id: String,
    pub approver_name: String,
    pub action: String,
    pub comment: Option<String>,
    pub timestamp: i64,
}

/// 审批记录
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalRecord {
    pub id: String,
    pub flow_id: String,
    pub flow_name: String,
    pub applicant_id: String,
    pub applicant_name: String,
    pub status: RecordStatus,
    pub current_step: i32,
    pub form_data: HashMap<String, serde_json::Value>,
    pub history: Vec<ApprovalHistory>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 创建流程请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFlowRequest {
    pub name: String,
    pub description: String,
    pub steps: Vec<ApprovalStep>,
    pub form_schema: HashMap<String, serde_json::Value>,
}

/// 更新流程请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFlowRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub steps: Option<Vec<ApprovalStep>>,
    pub form_schema: Option<HashMap<String, serde_json::Value>>,
    pub status: Option<FlowStatus>,
}

/// 发起审批请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRecordRequest {
    pub flow_id: String,
    pub applicant_id: String,
    pub applicant_name: String,
    pub form_data: HashMap<String, serde_json::Value>,
}

/// 审批操作请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApproveRequest {
    pub approver_id: String,
    pub approver_name: String,
    pub comment: Option<String>,
}

/// 流程列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlowListItem {
    pub id: String,
    pub name: String,
    pub description: String,
    pub status: FlowStatus,
    pub step_count: usize,
    pub created_by: String,
    pub created_at: i64,
}

/// 记录列表项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecordListItem {
    pub id: String,
    pub flow_name: String,
    pub applicant_name: String,
    pub status: RecordStatus,
    pub current_step: i32,
    pub created_at: i64,
}

/// 统计信息
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApprovalStats {
    pub pending: i64,
    pub approved: i64,
    pub rejected: i64,
    pub total: i64,
}
