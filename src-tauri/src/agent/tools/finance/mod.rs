//! 财务工具模块
//!
//! 实现 ADR-059 财务部门 Subagent 的工具集

pub mod query;
pub mod ocr;
pub mod mutate;
pub mod aggregate;
pub mod export_report;
pub mod permission;
pub mod register;

use serde::{Deserialize, Serialize};

/// 财务角色
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FinanceRole {
    Staff,       // 普通员工
    Specialist,  // 财务专员
    Manager,    // 财务经理
    Executive,  // 高管
}

impl Default for FinanceRole {
    fn default() -> Self {
        FinanceRole::Staff
    }
}

impl std::fmt::Display for FinanceRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FinanceRole::Staff => write!(f, "staff"),
            FinanceRole::Specialist => write!(f, "specialist"),
            FinanceRole::Manager => write!(f, "manager"),
            FinanceRole::Executive => write!(f, "executive"),
        }
    }
}

/// 财务工具枚举
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum FinanceTool {
    Query,       // 查询
    Ocr,         // OCR识别
    Mutate,      // 变更
    Aggregate,   // 聚合统计
    Export,      // 导出
    Report,      // 报表生成
    Forecast,    // 预测分析
    Dashboard,   // 看板
}

impl std::fmt::Display for FinanceTool {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FinanceTool::Query => write!(f, "finance_query"),
            FinanceTool::Ocr => write!(f, "finance_ocr"),
            FinanceTool::Mutate => write!(f, "finance_mutate"),
            FinanceTool::Aggregate => write!(f, "finance_aggregate"),
            FinanceTool::Export => write!(f, "finance_export"),
            FinanceTool::Report => write!(f, "finance_report"),
            FinanceTool::Forecast => write!(f, "finance_forecast"),
            FinanceTool::Dashboard => write!(f, "finance_dashboard"),
        }
    }
}

/// 发票类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum InvoiceType {
    Vat,         // 增值税发票
    Normal,      // 普通发票
    Receipt,     // 收据
    Electronic,  // 电子发票
    Train,       // 火车票
    Airplane,    // 机票
    Hotel,       // 酒店
    Other,       // 其他
}

/// 报销状态
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExpenseStatus {
    Draft,       // 草稿
    Submitted,    // 已提交
    Approved,     // 已批准
    Rejected,    // 已拒绝
    Paid,        // 已付款
    Cancelled,   // 已取消
}

/// 日期范围
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DateRange {
    pub start: String,
    pub end: String,
}

/// 金额范围
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AmountRange {
    pub min: f64,
    pub max: f64,
}

/// 发票数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub invoice_type: InvoiceType,
    pub amount: f64,
    pub tax_amount: Option<f64>,
    pub date: String,
    pub description: String,
    pub applicant_id: String,
    pub applicant_name: Option<String>,
    pub department: Option<String>,
    pub category: Option<String>,
    pub status: ExpenseStatus,
    pub attachments: Vec<String>,
    pub bank_account: Option<String>,
    pub tax_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// 发票查询结果（带字段过滤）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceQueryResult {
    pub total: usize,
    pub invoices: Vec<Invoice>,
    pub page: usize,
    pub page_size: usize,
}

/// OCR 识别结果
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcrResult {
    pub invoice_number: Option<String>,
    pub amount: Option<f64>,
    pub tax_amount: Option<f64>,
    pub date: Option<String>,
    pub seller: Option<String>,
    pub buyer: Option<String>,
    pub invoice_type: Option<InvoiceType>,
    pub verified: bool,
    pub confidence: f32,
}

/// 报销操作请求
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExpenseOperation {
    pub action: ExpenseAction,
    pub expense_id: String,
    pub reason: Option<String>,
    pub amount: Option<f64>,
}

/// 报销操作类型
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExpenseAction {
    Submit,    // 提交
    Approve,   // 批准
    Reject,    // 拒绝
    Adjust,    // 调整
    Cancel,    // 取消
    Pay,       // 付款
}

/// 财务统计数据
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FinanceStatistics {
    pub total_amount: f64,
    pub total_count: usize,
    pub by_category: std::collections::HashMap<String, f64>,
    pub by_department: std::collections::HashMap<String, f64>,
    pub by_status: std::collections::HashMap<String, usize>,
    pub period_start: String,
    pub period_end: String,
}

/// 导出格式
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportFormat {
    Excel,
    Pdf,
    Csv,
    Json,
}
