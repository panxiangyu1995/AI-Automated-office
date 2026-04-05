//! Orchestrator Module
//!
//! Implements cross-department task orchestration.
//! Supports:
//! - Parallel delegation to multiple subagents
//! - Sequential delegation with dependency ordering
//! - Result aggregation from multiple departments

pub mod engine;
pub mod config;

pub use engine::{OrchestrationEngine, OrchestrationTask, OrchestrationMode, OrchestrationResult};
pub use engine::{ExecutionStep, StepStatus, SubagentResult as DelegationResult};
pub use config::{OrchestratorConfig, OrchestratorPermissions};
