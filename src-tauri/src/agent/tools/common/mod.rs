//! Common utilities for Agent Tools
//!
//! This module provides shared utilities to eliminate code duplication across tool modules.
//!
//! # Contents
//!
//! - `builder.rs` - ToolDescriptor builder for consistent construction
//! - `helpers.rs` - Common helper functions (base_metadata, base_capabilities, etc.)
//! - `config.rs` - Unified configuration manager
//! - `errors.rs` - Common error types

pub mod builder;
pub mod config;
pub mod errors;
pub mod helpers;

pub use builder::ToolDescriptorBuilder;
pub use config::ToolConfigManager;
pub use errors::{ToolBuildError, ToolConfigError};
pub use helpers::*;
