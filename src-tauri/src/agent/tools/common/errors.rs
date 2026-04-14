//! Common error types for tool modules
//!
//! This module provides unified error types to be used across tool modules.

use thiserror::Error;

/// Error type for tool builder operations
#[derive(Debug, Error)]
pub enum ToolBuildError {
    #[error("missing required field: {0}")]
    MissingField(&'static str),

    #[error("invalid value for field {field}: {message}")]
    InvalidValue { field: &'static str, message: String },

    #[error("builder already finalized")]
    AlreadyBuilt,
}

/// Error type for tool configuration operations
#[derive(Debug, Error)]
pub enum ToolConfigError {
    #[error("configuration not initialized: {0}")]
    NotInitialized(&'static str),

    #[error("configuration locked: {0}")]
    LockError(String),

    #[error("invalid configuration value: {0}")]
    InvalidValue(String),

    #[error("permission denied: {0}")]
    PermissionDenied(String),

    #[error("resource not found: {0}")]
    NotFound(String),
}

/// Result type for tool builder operations
pub type ToolBuildResult<T> = Result<T, ToolBuildError>;

/// Result type for tool configuration operations
pub type ToolConfigResult<T> = Result<T, ToolConfigError>;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_error_display() {
        let err = ToolBuildError::MissingField("id");
        assert_eq!(err.to_string(), "missing required field: id");
    }

    #[test]
    fn test_config_error_display() {
        let err = ToolConfigError::NotInitialized("web");
        assert_eq!(err.to_string(), "configuration not initialized: web");
    }
}
