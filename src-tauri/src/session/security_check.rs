//! Security checker for session metadata
//!
//! This module provides additional security checks to prevent
//! storing forbidden fields in session metadata.

use crate::session::SessionMetadata;

/// Forbidden fields that should never be stored locally
const FORBIDDEN_FIELDS: &[&str] = &[
    "password",
    "password_hash",
    "access_token",
    "permissions",
    "roles",
    "secret",
    "private_key",
    "api_key",
];

/// Security checker for session metadata
pub struct SecurityChecker;

impl SecurityChecker {
    /// Check if a JSON string contains any forbidden fields
    ///
    /// This is an additional safety measure to catch any attempts
    /// to store sensitive data in the metadata.
    pub fn check_json_for_forbidden_fields(json: &str) -> Vec<String> {
        let json_lower = json.to_lowercase();
        let mut found = Vec::new();

        for field in FORBIDDEN_FIELDS {
            // Check for field name patterns in JSON
            let patterns = [
                format!("\"{}\"", field),
                format!("\"{}\"", field.replace("_", "-")),
                format!("\"{}\"", field.replace("_", "")),
            ];

            for pattern in patterns {
                if json_lower.contains(&pattern.to_lowercase()) {
                    found.push(field.to_string());
                    break;
                }
            }
        }

        found
    }

    /// Validate that the metadata doesn't contain forbidden fields
    ///
    /// Since SessionMetadata struct doesn't have these fields,
    /// this is mainly for logging/auditing purposes.
    pub fn validate_metadata(metadata: &SessionMetadata) -> Result<(), String> {
        // Serialize to JSON for additional check
        let json = serde_json::to_string(metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

        let forbidden = Self::check_json_for_forbidden_fields(&json);
        if !forbidden.is_empty() {
            return Err(format!(
                "Metadata contains forbidden fields: {}",
                forbidden.join(", ")
            ));
        }

        Ok(())
    }

    /// Log security event for audit purposes
    pub fn log_security_event(event_type: &str, details: &str) {
        tracing::warn!(
            event_type = event_type,
            details = details,
            "Session cache security event"
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_check_json_for_forbidden_fields_password() {
        let json = r#"{"user_id": "123", "password": "secret123"}"#;
        let found = SecurityChecker::check_json_for_forbidden_fields(json);
        assert!(found.contains(&"password".to_string()));
    }

    #[test]
    fn test_check_json_for_forbidden_fields_access_token() {
        let json = r#"{"user_id": "123", "access_token": "token123"}"#;
        let found = SecurityChecker::check_json_for_forbidden_fields(json);
        assert!(found.contains(&"access_token".to_string()));
    }

    #[test]
    fn test_check_json_no_forbidden_fields() {
        let json = r#"{"user_id": "123", "username": "test", "tenant_id": "456"}"#;
        let found = SecurityChecker::check_json_for_forbidden_fields(json);
        assert!(found.is_empty());
    }

    #[test]
    fn test_validate_metadata_valid() {
        let metadata = crate::session::SessionMetadata::new(
            "user-123".to_string(),
            "testuser".to_string(),
            "tenant-456".to_string(),
            "refresh-token".to_string(),
            3600,
        );
        let result = SecurityChecker::validate_metadata(&metadata);
        assert!(result.is_ok());
    }
}
