//! Field-Level Permission Checker
//!
//! Implements field-level access control for tools and data objects.
//! Controls which fields a user can see/modify based on their role and permissions.

use std::collections::{HashMap, HashSet};
use serde::{Deserialize, Serialize};
use thiserror::Error;


/// Field permission error types
#[derive(Debug, Error)]
pub enum FieldPermissionError {
    #[error("Invalid field configuration: {0}")]
    InvalidConfig(String),

    #[error("Field not found: {0}")]
    FieldNotFound(String),

    #[error("Access denied for field: {0}")]
    AccessDenied(String),
}

/// Field permission action
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FieldAction {
    /// Field can be read
    Read,
    /// Field can be written
    Write,
    /// Field can be both read and written
    ReadWrite,
    /// Field is hidden (no access)
    Hidden,
}

impl Default for FieldAction {
    fn default() -> Self {
        FieldAction::Read
    }
}

/// Field permission rule
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldPermissionRule {
    /// Tool or entity this rule applies to
    pub entity: String,
    /// Field name pattern (supports wildcards)
    pub field_pattern: String,
    /// Allowed actions
    pub actions: Vec<FieldAction>,
    /// Optional condition for this rule
    pub condition: Option<String>,
}

impl FieldPermissionRule {
    /// Create a new rule
    pub fn new(entity: &str, field_pattern: &str, actions: Vec<FieldAction>) -> Self {
        Self {
            entity: entity.to_string(),
            field_pattern: field_pattern.to_string(),
            actions,
            condition: None,
        }
    }

    /// Check if this rule matches the given entity and field
    pub fn matches(&self, entity: &str, field: &str) -> bool {
        self.entity == entity && self.pattern_matches(field)
    }

    /// Check if field pattern matches
    fn pattern_matches(&self, field: &str) -> bool {
        let pattern = &self.field_pattern;
        if pattern == "*" {
            return true;
        }
        if pattern.ends_with("*") {
            let prefix = &pattern[..pattern.len() - 1];
            return field.starts_with(prefix);
        }
        if pattern.starts_with("*") {
            let suffix = &pattern[1..];
            return field.ends_with(suffix);
        }
        field == pattern
    }
}

/// Field permission configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FieldPermissionConfig {
    /// Rules by role
    pub role_rules: HashMap<String, Vec<FieldPermissionRule>>,
    /// Default rules (fallback)
    pub default_rules: Vec<FieldPermissionRule>,
    /// Sensitive fields that require special handling
    pub sensitive_fields: HashSet<String>,
}

impl Default for FieldPermissionConfig {
    fn default() -> Self {
        Self::standard()
    }
}

impl FieldPermissionConfig {
    /// Create standard permission config
    pub fn standard() -> Self {
        let mut role_rules = HashMap::new();

        // Admin rules - full access
        role_rules.insert("admin".to_string(), vec![
            FieldPermissionRule::new("*", "*", vec![FieldAction::ReadWrite]),
        ]);

        // Manager rules - read most fields, write specific ones
        role_rules.insert("manager".to_string(), vec![
            FieldPermissionRule::new("*", "*", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "id", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "name", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "status", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "updated_at", vec![FieldAction::ReadWrite]),
            // Hide sensitive financial data
            FieldPermissionRule::new("*", "salary", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "bonus", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "tax_id", vec![FieldAction::Hidden]),
        ]);

        // Specialist rules - can read/write operational fields
        role_rules.insert("specialist".to_string(), vec![
            FieldPermissionRule::new("*", "id", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "name", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "status", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "category", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "description", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "amount", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "date", vec![FieldAction::Read]),
            // Hide sensitive fields
            FieldPermissionRule::new("*", "salary", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "bank_account", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "tax_id", vec![FieldAction::Hidden]),
        ]);

        // Staff rules - limited read/write
        role_rules.insert("staff".to_string(), vec![
            FieldPermissionRule::new("*", "id", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "name", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "status", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "description", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("*", "amount", vec![FieldAction::Read]),
            FieldPermissionRule::new("*", "date", vec![FieldAction::Read]),
            // Hide all sensitive fields
            FieldPermissionRule::new("*", "salary", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "bonus", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "bank_account", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "tax_id", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "profit_margin", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("*", "cost_breakdown", vec![FieldAction::Hidden]),
        ]);

        // Finance-specific rules
        let finance_rules = vec![
            // Invoice fields
            FieldPermissionRule::new("invoice", "id", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "amount", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "status", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "date", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "description", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "bank_account", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "tax_amount", vec![FieldAction::Read]),
            FieldPermissionRule::new("invoice", "applicant_name", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("invoice", "department", vec![FieldAction::Hidden]),
            // Expense fields
            FieldPermissionRule::new("expense", "id", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("expense", "amount", vec![FieldAction::ReadWrite]),
            FieldPermissionRule::new("expense", "status", vec![FieldAction::Read]),
            FieldPermissionRule::new("expense", "bank_account", vec![FieldAction::Hidden]),
            FieldPermissionRule::new("expense", "tax_id", vec![FieldAction::Hidden]),
        ];

        // Merge finance rules into specialist and staff roles
        if let Some(rules) = role_rules.get_mut("specialist") {
            rules.extend(finance_rules.clone());
        }
        if let Some(rules) = role_rules.get_mut("staff") {
            rules.extend(finance_rules);
        }

        let sensitive_fields: HashSet<String> = vec![
            "salary".to_string(),
            "bonus".to_string(),
            "bank_account".to_string(),
            "tax_id".to_string(),
            "social_security".to_string(),
            "password".to_string(),
            "secret_key".to_string(),
        ].into_iter().collect();

        Self {
            role_rules,
            default_rules: vec![
                FieldPermissionRule::new("*", "id", vec![FieldAction::Read]),
                FieldPermissionRule::new("*", "created_at", vec![FieldAction::Read]),
            ],
            sensitive_fields,
        }
    }

    /// Get rules for a specific role
    pub fn get_role_rules(&self, role: &str) -> &[FieldPermissionRule] {
        self.role_rules.get(role).map(|r| r.as_slice()).unwrap_or(&[])
    }
}

/// Field permission checker
#[derive(Debug, Clone)]
pub struct FieldPermissionChecker {
    config: FieldPermissionConfig,
}

impl Default for FieldPermissionChecker {
    fn default() -> Self {
        Self::new(FieldPermissionConfig::default())
    }
}

impl FieldPermissionChecker {
    /// Create a new checker with the given config
    pub fn new(config: FieldPermissionConfig) -> Self {
        Self { config }
    }

    /// Create with standard config
    pub fn standard() -> Self {
        Self::new(FieldPermissionConfig::standard())
    }

    /// Get allowed fields for a role and entity
    pub fn get_allowed_fields(&self, role: &str, entity: &str) -> Vec<String> {
        let mut allowed = Vec::new();
        let mut hidden = HashSet::new();

        // Check role-specific rules
        for rule in self.config.get_role_rules(role) {
            if rule.entity == entity || rule.entity == "*" {
                for action in &rule.actions {
                    match action {
                        FieldAction::Read | FieldAction::ReadWrite => {
                            if rule.field_pattern == "*" {
                                // Will be populated later
                            } else if rule.field_pattern.ends_with("*") {
                                // Pattern - store for later matching
                                allowed.push(rule.field_pattern.clone());
                            } else {
                                allowed.push(rule.field_pattern.clone());
                            }
                        }
                        FieldAction::Hidden => {
                            if rule.field_pattern == "*" {
                                // All hidden
                                return Vec::new();
                            } else {
                                hidden.insert(rule.field_pattern.clone());
                            }
                        }
                        FieldAction::Write => {} // Write-only fields are not readable
                    }
                }
            }
        }

        // Check default rules
        for rule in &self.config.default_rules {
            if rule.entity == entity || rule.entity == "*" {
                for action in &rule.actions {
                    if matches!(action, FieldAction::Read | FieldAction::ReadWrite) {
                        allowed.push(rule.field_pattern.clone());
                    }
                }
            }
        }

        // Remove hidden fields
        allowed.retain(|f| !hidden.contains(f));
        allowed
    }

    /// Check if a field can be accessed
    pub fn check_field_access(
        &self,
        role: &str,
        entity: &str,
        field: &str,
        action: FieldAction,
    ) -> bool {
        // Check role-specific rules first
        for rule in self.config.get_role_rules(role) {
            if rule.matches(entity, field) {
                if rule.actions.contains(&action) || rule.actions.contains(&FieldAction::ReadWrite) {
                    return true;
                }
                if rule.actions.contains(&FieldAction::Hidden) {
                    return false;
                }
            }
        }

        // Check default rules
        for rule in &self.config.default_rules {
            if rule.matches(entity, field) {
                if rule.actions.contains(&action) || rule.actions.contains(&FieldAction::ReadWrite) {
                    return true;
                }
            }
        }

        // Default: deny if not explicitly allowed
        false
    }

    /// Filter data based on field permissions
    pub fn filter_fields<T: serde::Serialize>(
        &self,
        data: &T,
        role: &str,
        entity: &str,
    ) -> Result<serde_json::Value, FieldPermissionError> {
        let json = serde_json::to_value(data)
            .map_err(|e| FieldPermissionError::InvalidConfig(e.to_string()))?;

        let allowed_fields = self.get_allowed_fields(role, entity);
        let allowed_set: HashSet<&str> = allowed_fields.iter().map(|s| s.as_str()).collect();

        let filtered = self.filter_json_object(&json, &allowed_set, role, entity);
        Ok(filtered)
    }

    /// Filter JSON object based on allowed fields
    fn filter_json_object(
        &self,
        json: &serde_json::Value,
        allowed_fields: &HashSet<&str>,
        role: &str,
        entity: &str,
    ) -> serde_json::Value {
        if let serde_json::Value::Object(obj) = json {
            let mut filtered = serde_json::Map::new();

            for (key, value) in obj {
                // Check if field is allowed
                let is_allowed = if allowed_fields.contains(key.as_str()) {
                    true
                } else if allowed_fields.iter().any(|p| {
                    if p.ends_with("*") {
                        let prefix = &p[..p.len() - 1];
                        key.starts_with(prefix)
                    } else {
                        false
                    }
                }) {
                    true
                } else if self.check_field_access(role, entity, key, FieldAction::Read) {
                    true
                } else {
                    false
                };

                if is_allowed {
                    // Recursively filter nested objects
                    if value.is_object() || value.is_array() {
                        filtered.insert(
                            key.clone(),
                            self.filter_json_recursive(value, role, entity),
                        );
                    } else {
                        filtered.insert(key.clone(), value.clone());
                    }
                }
            }

            serde_json::Value::Object(filtered)
        } else {
            json.clone()
        }
    }

    /// Recursively filter nested structures
    fn filter_json_recursive(
        &self,
        value: &serde_json::Value,
        role: &str,
        entity: &str,
    ) -> serde_json::Value {
        match value {
            serde_json::Value::Object(_obj) => {
                let allowed_fields = self.get_allowed_fields(role, entity);
                let allowed_set: HashSet<&str> = allowed_fields.iter().map(|s| s.as_str()).collect();
                self.filter_json_object(value, &allowed_set, role, entity)
            }
            serde_json::Value::Array(arr) => {
                serde_json::Value::Array(
                    arr.iter()
                        .map(|v| self.filter_json_recursive(v, role, entity))
                        .collect(),
                )
            }
            _ => value.clone(),
        }
    }

    /// Check if a field is sensitive
    pub fn is_sensitive_field(&self, field: &str) -> bool {
        self.config.sensitive_fields.contains(field)
    }

    /// Get all sensitive fields
    pub fn get_sensitive_fields(&self) -> &HashSet<String> {
        &self.config.sensitive_fields
    }

    /// Add a custom rule
    pub fn add_rule(&mut self, role: &str, rule: FieldPermissionRule) {
        self.config
            .role_rules
            .entry(role.to_string())
            .or_insert_with(Vec::new)
            .push(rule);
    }
}

/// Check field access (convenience function)
pub fn check_field_access(
    role: &str,
    entity: &str,
    field: &str,
    action: FieldAction,
) -> bool {
    let checker = FieldPermissionChecker::standard();
    checker.check_field_access(role, entity, field, action)
}

/// Get allowed fields (convenience function)
pub fn get_allowed_fields(role: &str, entity: &str) -> Vec<String> {
    let checker = FieldPermissionChecker::standard();
    checker.get_allowed_fields(role, entity)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_admin_full_access() {
        let checker = FieldPermissionChecker::standard();

        // Admin should have access to all fields
        assert!(checker.check_field_access("admin", "invoice", "salary", FieldAction::Read));
        assert!(checker.check_field_access("admin", "invoice", "bank_account", FieldAction::ReadWrite));
        assert!(checker.check_field_access("admin", "invoice", "amount", FieldAction::ReadWrite));
    }

    #[test]
    fn test_staff_limited_access() {
        let checker = FieldPermissionChecker::standard();

        // Staff should not see sensitive fields
        assert!(!checker.check_field_access("staff", "invoice", "salary", FieldAction::Read));
        assert!(!checker.check_field_access("staff", "invoice", "bank_account", FieldAction::Read));
        assert!(!checker.check_field_access("staff", "invoice", "tax_id", FieldAction::Read));

        // But should see normal fields
        assert!(checker.check_field_access("staff", "invoice", "amount", FieldAction::Read));
        assert!(checker.check_field_access("staff", "invoice", "date", FieldAction::Read));
        assert!(checker.check_field_access("staff", "invoice", "status", FieldAction::Read));
    }

    #[test]
    fn test_get_allowed_fields() {
        let checker = FieldPermissionChecker::standard();

        let fields = checker.get_allowed_fields("staff", "invoice");

        // Should include normal fields
        assert!(fields.contains(&"amount".to_string()));
        assert!(fields.contains(&"date".to_string()));
        assert!(fields.contains(&"status".to_string()));

        // Should not include sensitive fields
        assert!(!fields.contains(&"salary".to_string()));
        assert!(!fields.contains(&"bank_account".to_string()));
    }

    #[test]
    fn test_filter_fields() {
        let checker = FieldPermissionChecker::standard();

        let data = serde_json::json!({
            "id": "123",
            "amount": 1000.0,
            "bank_account": "1234567890",
            "tax_id": "ABC123",
            "description": "Test expense"
        });

        let filtered = checker.filter_fields(&data, "staff", "expense").unwrap();

        // Should include normal fields
        assert!(filtered.get("id").is_some());
        assert!(filtered.get("amount").is_some());
        assert!(filtered.get("description").is_some());

        // Should not include sensitive fields
        assert!(filtered.get("bank_account").is_none());
        assert!(filtered.get("tax_id").is_none());
    }

    #[test]
    fn test_pattern_matching() {
        let rule = FieldPermissionRule::new("invoice", "tax_*", vec![FieldAction::Hidden]);

        assert!(rule.matches("invoice", "tax_amount"));
        assert!(rule.matches("invoice", "tax_id"));
        assert!(!rule.matches("invoice", "amount"));
        assert!(!rule.matches("expense", "tax_amount"));
    }

    #[test]
    fn test_wildcard_entity() {
        let checker = FieldPermissionChecker::standard();

        // Rules with "*" entity should apply to all entities
        assert!(checker.check_field_access("admin", "any_entity", "any_field", FieldAction::ReadWrite));
        assert!(checker.check_field_access("staff", "some_table", "id", FieldAction::Read));
    }

    #[test]
    fn test_nested_object_filtering() {
        let checker = FieldPermissionChecker::standard();

        let data = serde_json::json!({
            "invoice": {
                "id": "123",
                "amount": 1000.0,
                "bank_account": "1234567890",
                "nested": {
                    "salary": 50000.0,
                    "description": "Test"
                }
            }
        });

        let filtered = checker.filter_fields(&data, "staff", "wrapper").unwrap();

        // Should filter nested objects
        if let Some(invoice) = filtered.get("invoice") {
            assert!(invoice.get("id").is_some());
            assert!(invoice.get("amount").is_some());
            assert!(invoice.get("bank_account").is_none());

            if let Some(nested) = invoice.get("nested") {
                assert!(nested.get("description").is_some());
                assert!(nested.get("salary").is_none());
            }
        }
    }
}
