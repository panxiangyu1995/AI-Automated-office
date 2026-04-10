//! Session cache module for local session metadata storage
//!
//! This module provides secure local storage for session metadata,
//! supporting offline session recovery while maintaining security.

mod cache;
mod context;
mod metadata;
mod security_check;

pub use cache::SessionCache;
pub use context::TenantContext;
pub use metadata::SessionMetadata;
pub use security_check::SecurityChecker;

#[allow(dead_code)]
#[derive(Debug, thiserror::Error)]
pub enum SessionError {
    #[error("Security violation: {0}")]
    SecurityViolation(String),

    #[error("Encryption error: {0}")]
    EncryptionError(String),

    #[error("Decryption error: {0}")]
    DecryptionError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    SerializationError(String),

    #[error("Session expired")]
    SessionExpired,

    #[error("Machine ID error: {0}")]
    MachineIdError(String),

    #[error("Cache not found")]
    CacheNotFound,
}
