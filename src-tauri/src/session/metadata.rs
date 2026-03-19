//! Session metadata structure definition
//!
//! This module defines the SessionMetadata structure that can be safely
//! stored locally. It explicitly excludes sensitive fields like passwords
//! and access tokens.

use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// Security check result for session metadata validation
#[derive(Debug, Clone)]
pub struct SecurityCheckResult {
    /// Whether the metadata passed all security checks
    pub is_valid: bool,
    /// List of violations found during the check
    pub violations: Vec<String>,
}

/// Safe session metadata structure for local caching
///
/// # Security Notes
///
/// This structure intentionally does NOT include:
/// - `password` - Never store passwords locally
/// - `password_hash` - Managed by cloud
/// - `access_token` - Short-lived, sensitive
/// - `permissions` - Calculated by cloud in real-time
/// - `roles` - Calculated by cloud in real-time
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionMetadata {
    /// User ID (UUID)
    pub user_id: String,

    /// Username for display purposes
    pub username: String,

    /// Display name (optional)
    pub display_name: Option<String>,

    /// Tenant ID
    pub tenant_id: String,

    /// Tenant name (optional)
    pub tenant_name: Option<String>,

    /// Refresh token for token refresh (the only token stored)
    pub refresh_token: String,

    /// Token expiration time (Unix timestamp in seconds)
    pub expires_at: i64,

    /// Last active time (Unix timestamp in seconds)
    pub last_active_at: i64,

    /// Creation time (Unix timestamp in seconds)
    pub created_at: i64,
}

impl SessionMetadata {
    /// Create a new session metadata
    pub fn new(
        user_id: String,
        username: String,
        tenant_id: String,
        refresh_token: String,
        expires_in_seconds: i64,
    ) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        Self {
            user_id,
            username,
            display_name: None,
            tenant_id,
            tenant_name: None,
            refresh_token,
            expires_at: now + expires_in_seconds,
            last_active_at: now,
            created_at: now,
        }
    }

    /// Perform security check on the metadata
    ///
    /// This validates that:
    /// - Required fields are not empty
    /// - Timestamps are reasonable
    /// - Session hasn't expired yet (for storage)
    pub fn security_check(&self) -> SecurityCheckResult {
        let mut violations = Vec::new();

        // Check required fields
        if self.user_id.is_empty() {
            violations.push("user_id cannot be empty".to_string());
        }
        if self.username.is_empty() {
            violations.push("username cannot be empty".to_string());
        }
        if self.tenant_id.is_empty() {
            violations.push("tenant_id cannot be empty".to_string());
        }
        if self.refresh_token.is_empty() {
            violations.push("refresh_token cannot be empty".to_string());
        }

        // Check timestamps are reasonable
        if self.expires_at <= self.created_at {
            violations.push("expires_at must be greater than created_at".to_string());
        }
        if self.last_active_at < self.created_at {
            violations.push("last_active_at cannot be before created_at".to_string());
        }

        // Check expiration is in the future
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        if self.expires_at <= now {
            violations.push("session has already expired".to_string());
        }

        SecurityCheckResult {
            is_valid: violations.is_empty(),
            violations,
        }
    }

    /// Check if the session has expired
    pub fn is_expired(&self) -> bool {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        self.expires_at <= now
    }

    /// Update last active time to now
    pub fn touch(&mut self) {
        self.last_active_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_valid_metadata() -> SessionMetadata {
        SessionMetadata::new(
            "user-123".to_string(),
            "testuser".to_string(),
            "tenant-456".to_string(),
            "refresh-token-xyz".to_string(),
            3600, // 1 hour
        )
    }

    #[test]
    fn test_security_check_valid() {
        let metadata = create_valid_metadata();
        let result = metadata.security_check();
        assert!(result.is_valid);
        assert!(result.violations.is_empty());
    }

    #[test]
    fn test_security_check_empty_user_id() {
        let mut metadata = create_valid_metadata();
        metadata.user_id = String::new();
        let result = metadata.security_check();
        assert!(!result.is_valid);
        assert!(result.violations.iter().any(|v| v.contains("user_id")));
    }

    #[test]
    fn test_security_check_empty_refresh_token() {
        let mut metadata = create_valid_metadata();
        metadata.refresh_token = String::new();
        let result = metadata.security_check();
        assert!(!result.is_valid);
        assert!(result.violations.iter().any(|v| v.contains("refresh_token")));
    }

    #[test]
    fn test_is_expired() {
        let mut metadata = create_valid_metadata();
        metadata.expires_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
            - 1;
        assert!(metadata.is_expired());
    }

    #[test]
    fn test_touch_updates_last_active() {
        let mut metadata = create_valid_metadata();
        // Set last_active_at to 1 second in the past
        metadata.last_active_at -= 1;
        let old_active = metadata.last_active_at;
        metadata.touch();
        assert!(metadata.last_active_at > old_active);
    }
}
