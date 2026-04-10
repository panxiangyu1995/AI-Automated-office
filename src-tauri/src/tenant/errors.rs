//! Tenant module error types

use thiserror::Error;

/// Tenant-related errors
#[derive(Debug, Error)]
pub enum TenantError {
    #[error("Tenant not found: {0}")]
    NotFound(String),
    
    #[error("Tenant already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Invalid tenant data: {0}")]
    InvalidData(String),
    
    #[error("Database error: {0}")]
    Database(String),
}
