//! Agent Lifecycle Hooks Module
//!
//! Provides lifecycle hook system for the Agent:
//! - Hook types and context definitions
//! - Hook trait for implementing custom hooks
//! - Hook registry for managing hook execution

pub mod hook_registry;
pub mod hook_trait;
pub mod hook_types;

pub use hook_registry::HookRegistry;
pub use hook_trait::{LoggingHook, MetricsHook, PermissionHook};


pub use hook_types::{HookConfig, HookContext};
