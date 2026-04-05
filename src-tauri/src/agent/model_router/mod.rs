//! Model Layer Router Module
//!
//! Implements intelligent model selection based on task complexity.
//! Supports:
//! - Task complexity evaluation
//! - Dynamic model selection (primary, light, small)
//! - Model switching during execution

pub mod router;

pub use router::{ModelRouter, ModelSelectionRule, TaskComplexity, TaskContext};
