//! Security module for capability packages.
//!
//! This module implements:
//! - Security scanning for packages
//! - Signature verification
//! - Malicious pattern detection
//! - Scan result caching

mod scanner;
mod signature;
mod patterns;
mod cache;

pub use scanner::{SecurityScanner, SecurityScanResult, SecurityWarning, SecurityError};
pub use signature::{SignatureVerifier, SignatureInfo, SignatureAlgorithm};
pub use patterns::MaliciousPatternMatcher;
pub use cache::ScanResultCache;

/// Security scan configuration
#[derive(Debug, Clone)]
pub struct SecurityConfig {
    /// Enable security scanning
    pub enabled: bool,
    /// Scan timeout in seconds
    pub scan_timeout_secs: u64,
    /// Cache scan results
    pub cache_enabled: bool,
    /// Cache TTL in seconds
    pub cache_ttl_secs: u64,
    /// Require signature verification
    pub require_signature: bool,
    /// List of trusted signers
    pub trusted_signers: Vec<String>,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            scan_timeout_secs: 30,
            cache_enabled: true,
            cache_ttl_secs: 3600,
            require_signature: false,
            trusted_signers: vec![],
        }
    }
}
