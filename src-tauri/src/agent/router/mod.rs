//! Intent Router Module
//!
//! Implements intelligent intent routing and delegation to subagents.
//! Supports:
//! - Intent classification (keyword + semantic)
//! - Route decision based on permissions and capabilities
//! - Delegation execution with timeout and error handling

pub mod classifier;
pub mod router;
pub mod executor;

pub use classifier::{IntentClassifier, IntentResult, KeywordRule};
pub use router::{IntentRouter, RouteDecision, RoutingError};
pub use executor::{DelegationExecutor, DelegationContext, ExecutionError};

use serde::{Deserialize, Serialize};
use thiserror::Error;

/// Intent types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IntentType {
    /// Finance department intents
    FinanceOcr,
    FinanceQuery,
    FinanceReport,
    
    /// Sales department intents
    SalesOrder,
    SalesQuery,
    
    /// HR department intents
    HrOnboard,
    HrQuery,
    
    /// Cross-department coordination
    CrossDepartment,
    
    /// General query
    GeneralQuery,
    
    /// Unknown intent
    Unknown,
}

impl IntentType {
    pub fn as_str(&self) -> &'static str {
        match self {
            IntentType::FinanceOcr => "finance.ocr",
            IntentType::FinanceQuery => "finance.query",
            IntentType::FinanceReport => "finance.report",
            IntentType::SalesOrder => "sales.order",
            IntentType::SalesQuery => "sales.query",
            IntentType::HrOnboard => "hr.onboard",
            IntentType::HrQuery => "hr.query",
            IntentType::CrossDepartment => "cross.department",
            IntentType::GeneralQuery => "general.query",
            IntentType::Unknown => "unknown",
        }
    }
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
