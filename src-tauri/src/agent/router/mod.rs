//! Intent Router Module
//!
//! Implements intelligent intent routing and delegation to subagents.
//! Supports:
//! - Intent classification (keyword + semantic)
//! - Route decision based on permissions and capabilities
//! - Delegation execution with timeout and error handling
//! - Semantic routing using vector embeddings

pub mod classifier;
pub mod router;
pub mod executor;
pub mod semantic;

pub use classifier::IntentResult;
pub use router::RouteDecision;
pub use executor::ExecutionError;

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Intent types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "snake_case")]
pub enum IntentType {
    // ========== 通用意图 (0-9) ==========
    /// 通用聊天
    General = 0,
    /// 聊天
    Chat = 1,
    /// 提问
    Question = 2,

    // ========== 财务意图 (10-19) ==========
    /// 财务通用
    Finance = 10,
    /// 财务查询
    FinanceQuery = 11,
    /// 财务OCR
    FinanceOcr = 12,
    /// 财务报表
    FinanceReport = 13,

    // ========== 人事意图 (20-29) ==========
    /// 人事通用
    Hr = 20,
    /// 人事查询
    HrQuery = 21,
    /// 入职办理
    HrOnboard = 22,

    // ========== 销售意图 (30-39) ==========
    /// 销售通用
    Sales = 30,
    /// 销售订单
    SalesOrder = 31,
    /// 客户管理
    SalesCustomer = 32,

    // ========== 审批意图 (40-49) ==========
    /// 审批通用
    Approval = 40,
    /// 提交审批
    ApprovalSubmit = 41,
    /// 处理审批
    ApprovalProcess = 42,

    // ========== 仓储意图 (50-59) ==========
    /// 仓储通用
    Warehouse = 50,
    /// 库存查询
    WarehouseQuery = 51,
    /// 库存管理
    WarehouseStock = 52,

    // ========== 跨部门意图 (100-199) ==========
    /// 跨部门协作
    CrossDepartment = 100,

    // ========== 系统意图 (200-254) ==========
    /// 系统命令
    System = 200,

    // ========== 未知 (255) ==========
    /// 未知意图
    Unknown = 255,
}

impl IntentType {
    pub fn as_str(&self) -> &'static str {
        match self {
            // 通用意图
            IntentType::General => "general",
            IntentType::Chat => "chat",
            IntentType::Question => "question",

            // 财务意图
            IntentType::Finance => "finance",
            IntentType::FinanceOcr => "finance.ocr",
            IntentType::FinanceQuery => "finance.query",
            IntentType::FinanceReport => "finance.report",

            // 人事意图
            IntentType::Hr => "hr",
            IntentType::HrQuery => "hr.query",
            IntentType::HrOnboard => "hr.onboard",

            // 销售意图
            IntentType::Sales => "sales",
            IntentType::SalesOrder => "sales.order",
            IntentType::SalesCustomer => "sales.customer",

            // 审批意图
            IntentType::Approval => "approval",
            IntentType::ApprovalSubmit => "approval.submit",
            IntentType::ApprovalProcess => "approval.process",

            // 仓储意图
            IntentType::Warehouse => "warehouse",
            IntentType::WarehouseQuery => "warehouse.query",
            IntentType::WarehouseStock => "warehouse.stock",

            // 跨部门
            IntentType::CrossDepartment => "cross.department",

            // 系统
            IntentType::System => "system",

            // 未知
            IntentType::Unknown => "unknown",
        }
    }

    /// 获取意图分类（粗粒度）
    pub fn category(&self) -> IntentCategory {
        match self {
            IntentType::General | IntentType::Chat | IntentType::Question => IntentCategory::General,
            IntentType::Finance | IntentType::FinanceQuery | IntentType::FinanceOcr | IntentType::FinanceReport => IntentCategory::Finance,
            IntentType::Hr | IntentType::HrQuery | IntentType::HrOnboard => IntentCategory::Hr,
            IntentType::Sales | IntentType::SalesOrder | IntentType::SalesCustomer => IntentCategory::Sales,
            IntentType::Approval | IntentType::ApprovalSubmit | IntentType::ApprovalProcess => IntentCategory::Approval,
            IntentType::Warehouse | IntentType::WarehouseQuery | IntentType::WarehouseStock => IntentCategory::Warehouse,
            IntentType::CrossDepartment => IntentCategory::CrossDepartment,
            IntentType::System => IntentCategory::System,
            IntentType::Unknown => IntentCategory::Unknown,
        }
    }

    /// 从字符串解析
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            // 通用意图
            "general" => Some(IntentType::General),
            "chat" => Some(IntentType::Chat),
            "question" => Some(IntentType::Question),

            // 财务意图
            "finance" => Some(IntentType::Finance),
            "finance.ocr" => Some(IntentType::FinanceOcr),
            "finance.query" => Some(IntentType::FinanceQuery),
            "finance.report" => Some(IntentType::FinanceReport),

            // 人事意图
            "hr" => Some(IntentType::Hr),
            "hr.query" => Some(IntentType::HrQuery),
            "hr.onboard" => Some(IntentType::HrOnboard),

            // 销售意图
            "sales" => Some(IntentType::Sales),
            "sales.order" => Some(IntentType::SalesOrder),
            "sales.customer" => Some(IntentType::SalesCustomer),

            // 审批意图
            "approval" => Some(IntentType::Approval),
            "approval.submit" => Some(IntentType::ApprovalSubmit),
            "approval.process" => Some(IntentType::ApprovalProcess),

            // 仓储意图
            "warehouse" => Some(IntentType::Warehouse),
            "warehouse.query" => Some(IntentType::WarehouseQuery),
            "warehouse.stock" => Some(IntentType::WarehouseStock),

            // 跨部门
            "cross.department" => Some(IntentType::CrossDepartment),

            // 系统
            "system" => Some(IntentType::System),

            // 未知
            "unknown" | _ => Some(IntentType::Unknown),
        }
    }
}

/// 意图分类
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum IntentCategory {
    General,
    Finance,
    Hr,
    Sales,
    Approval,
    Warehouse,
    CrossDepartment,
    System,
    Unknown,
}

/// Subagent types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SubagentType {
    Finance,
    Sales,
    Hr,
    Warehouse,
    Primary,
    Orchestrator,
}

impl SubagentType {
    pub fn as_str(&self) -> &'static str {
        match self {
            SubagentType::Finance => "finance",
            SubagentType::Sales => "sales",
            SubagentType::Hr => "hr",
            SubagentType::Warehouse => "warehouse",
            SubagentType::Primary => "primary",
            SubagentType::Orchestrator => "orchestrator",
        }
    }
}

/// Routing errors
#[derive(Error, Debug)]
pub enum RoutingError {
    #[error("Classification failed: {0}")]
    ClassificationFailed(String),
    
    #[error("No matching subagent found for intent: {0}")]
    NoMatchingSubagent(String),
    
    #[error("Permission denied for subagent: {0}")]
    PermissionDenied(String),
    
    #[error("Model selection failed: {0}")]
    ModelSelectionFailed(String),
    
    #[error("Execution failed: {0}")]
    ExecutionFailed(String),
    
    #[error("Timeout after {0}ms")]
    Timeout(u64),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<ClassificationError> for RoutingError {
    fn from(err: ClassificationError) -> Self {
        match err {
            ClassificationError::KeywordMatchFailed(msg) => RoutingError::ClassificationFailed(msg),
            ClassificationError::SemanticFailed(msg) => RoutingError::ClassificationFailed(msg),
            ClassificationError::InvalidContext(msg) => RoutingError::Internal(msg),
        }
    }
}

impl From<ExecutionError> for RoutingError {
    fn from(err: ExecutionError) -> Self {
        match err {
            ExecutionError::Timeout(duration) => RoutingError::Timeout(duration.as_millis() as u64),
            ExecutionError::SessionCreationFailed(msg) => RoutingError::ExecutionFailed(msg),
            ExecutionError::ExecutionFailed(msg) => RoutingError::ExecutionFailed(msg),
            ExecutionError::CleanupFailed(msg) => RoutingError::Internal(msg),
        }
    }
}

/// Classification errors
#[derive(Error, Debug)]
pub enum ClassificationError {
    #[error("Keyword match failed: {0}")]
    KeywordMatchFailed(String),
    
    #[error("Semantic classification failed: {0}")]
    SemanticFailed(String),
    
    #[error("Invalid context: {0}")]
    InvalidContext(String),
}
