//! Permission Ruleset Implementation
//!
//! Core components:
//! - PermissionAction: Allow/Ask/Deny - the action to take
//! - PermissionOperation: office operation types
//! - PermissionRule: single rule with operation, pattern, action
//! - PermissionChecker: checks permissions against ruleset
//!
//! Pattern matching supports glob patterns:
//! - `*` matches any sequence of characters
//! - `?` matches any single character
//! - Specific patterns like `expense_*`, `employee_*`

use serde::{Deserialize, Serialize};

/// Permission action - what to do when a rule matches
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PermissionAction {
    /// Allow the operation directly
    Allow,
    /// Ask the user for confirmation
    Ask,
    /// Deny the operation directly
    Deny,
}

impl std::fmt::Display for PermissionAction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionAction::Allow => write!(f, "allow"),
            PermissionAction::Ask => write!(f, "ask"),
            PermissionAction::Deny => write!(f, "deny"),
        }
    }
}

/// Office operation types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PermissionOperation {
    /// Department data access
    Department,
    /// Approval operations (submit, approve, reject)
    Approval,
    /// Document operations (create, read, modify, delete)
    Document,
    /// Employee information operations
    Employee,
    /// Financial data operations
    Finance,
    /// Warehouse operations (inbound, outbound, inventory)
    Warehouse,
}

impl PermissionOperation {
    /// Parse from string, returns None for unknown operations
    pub fn parse(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "department" => Some(PermissionOperation::Department),
            "approval" => Some(PermissionOperation::Approval),
            "document" => Some(PermissionOperation::Document),
            "employee" => Some(PermissionOperation::Employee),
            "finance" => Some(PermissionOperation::Finance),
            "warehouse" => Some(PermissionOperation::Warehouse),
            _ => None,
        }
    }
}

impl std::fmt::Display for PermissionOperation {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PermissionOperation::Department => write!(f, "department"),
            PermissionOperation::Approval => write!(f, "approval"),
            PermissionOperation::Document => write!(f, "document"),
            PermissionOperation::Employee => write!(f, "employee"),
            PermissionOperation::Finance => write!(f, "finance"),
            PermissionOperation::Warehouse => write!(f, "warehouse"),
        }
    }
}

/// A single permission rule
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionRule {
    /// Operation type (department, approval, document, etc.)
    pub operation: String,
    /// Glob pattern for matching resources (e.g., "expense_*", "employee_*")
    pub pattern: String,
    /// Action to take when rule matches
    pub action: PermissionAction,
}

impl PermissionRule {
    /// Create a new rule
    pub fn new(operation: impl Into<String>, pattern: impl Into<String>, action: PermissionAction) -> Self {
        Self {
            operation: operation.into(),
            pattern: pattern.into(),
            action,
        }
    }

    /// Check if this rule matches the given operation and resource
    pub fn matches(&self, operation: &str, resource: &str) -> bool {
        // Check operation match
        if !self.operation.contains('*') {
            if self.operation != operation {
                return false;
            }
        } else if !glob_match(&self.operation, operation) {
            return false;
        }

        // Check resource pattern match
        glob_match(&self.pattern, resource)
    }
}

/// A ruleset is a collection of permission rules
pub type Ruleset = Vec<PermissionRule>;

/// Permission checker for evaluating permissions
#[derive(Debug, Clone)]
pub struct PermissionChecker {
    /// User-defined rules (highest priority)
    ruleset: Ruleset,
    /// Default rules (fallback)
    defaults: Ruleset,
}

impl PermissionChecker {
    /// Create a new permission checker with given ruleset and defaults
    pub fn new(ruleset: Ruleset, defaults: Ruleset) -> Self {
        Self { ruleset, defaults }
    }

    /// Create with only defaults (empty user ruleset)
    pub fn with_defaults(defaults: Ruleset) -> Self {
        Self {
            ruleset: Ruleset::new(),
            defaults,
        }
    }

    /// Check permission for an operation and resource
    ///
    /// Returns the matching PermissionAction:
    /// - First checks user ruleset
    /// - Then checks default ruleset
    /// - Returns Deny if no rule matches (conservative default)
    pub fn check(&self, operation: &str, resource: &str) -> PermissionAction {
        // Check user rules first (higher priority)
        if let Some(action) = self.find_matching_rule(&self.ruleset, operation, resource) {
            return action;
        }

        // Fall back to default rules
        if let Some(action) = self.find_matching_rule(&self.defaults, operation, resource) {
            return action;
        }

        // No matching rule - conservative default is Deny
        PermissionAction::Deny
    }

    /// Find the most specific matching rule in a ruleset
    fn find_matching_rule(&self, rules: &Ruleset, operation: &str, resource: &str) -> Option<PermissionAction> {
        let mut best_match: Option<(usize, PermissionAction)> = None;

        for rule in rules {
            if rule.matches(operation, resource) {
                // Calculate specificity: longer pattern = more specific
                let specificity = rule.pattern.len() + rule.operation.len();

                match &best_match {
                    None => {
                        best_match = Some((specificity, rule.action));
                    }
                    Some((best_specificity, _)) if specificity > *best_specificity => {
                        best_match = Some((specificity, rule.action));
                    }
                    Some((best_specificity, best_action)) if specificity == *best_specificity => {
                        // Same specificity: deny wins
                        if rule.action == PermissionAction::Deny {
                            best_match = Some((specificity, rule.action));
                        } else if *best_action != PermissionAction::Deny {
                            best_match = Some((specificity, rule.action));
                        }
                    }
                    _ => {}
                }
            }
        }

        best_match.map(|(_, action)| action)
    }

    /// Merge another ruleset into this one
    ///
    /// Rules from the other ruleset are appended, with deny taking priority
    /// when the same specificity match is found.
    pub fn merge(&mut self, other: Ruleset) {
        self.ruleset.extend(other);
    }

    /// Get a reference to the current ruleset
    pub fn ruleset(&self) -> &Ruleset {
        &self.ruleset
    }

    /// Get a reference to the default ruleset
    pub fn defaults(&self) -> &Ruleset {
        &self.defaults
    }
}

impl Default for PermissionChecker {
    fn default() -> Self {
        Self::with_defaults(Ruleset::new())
    }
}

/// Glob pattern matching
///
/// Supports:
/// - `*` matches any sequence of characters
/// - `?` matches any single character
fn glob_match(pattern: &str, text: &str) -> bool {
    // Simple glob matching implementation
    // For complex patterns, consider using the `glob` crate

    let pattern_chars: Vec<char> = pattern.chars().collect();
    let text_chars: Vec<char> = text.chars().collect();

    glob_match_inner(&pattern_chars, &text_chars, 0, 0)
}

fn glob_match_inner(pattern: &[char], text: &[char], pi: usize, ti: usize) -> bool {
    // Base cases
    if pi == pattern.len() && ti == text.len() {
        return true;
    }
    if pi == pattern.len() {
        return false;
    }
    if ti == text.len() {
        // Only trailing * can match nothing
        return pattern[pi..].iter().all(|&c| c == '*');
    }

    let pc = pattern[pi];
    let tc = text[ti];

    if pc == '*' {
        // * can match:
        // 1. Zero characters (skip *)
        // 2. One character (consume text char)
        // 3. Multiple characters (consume text chars)
        glob_match_inner(pattern, text, pi + 1, ti) // Zero chars
            || glob_match_inner(pattern, text, pi, ti + 1) // One or more chars
    } else if pc == '?' || pc == tc {
        // ? matches any single char, or exact match
        glob_match_inner(pattern, text, pi + 1, ti + 1)
    } else {
        false
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_rule(operation: &str, pattern: &str, action: PermissionAction) -> PermissionRule {
        PermissionRule::new(operation, pattern, action)
    }

    #[test]
    fn test_glob_match_exact() {
        assert!(glob_match("foo", "foo"));
        assert!(!glob_match("foo", "bar"));
    }

    #[test]
    fn test_glob_match_star() {
        assert!(glob_match("*", "anything"));
        assert!(glob_match("expense_*", "expense_report"));
        assert!(glob_match("expense_*", "expense_"));
        assert!(!glob_match("expense_*", "expense"));
        assert!(!glob_match("expense_*", "expenses"));
    }

    #[test]
    fn test_glob_match_question() {
        assert!(glob_match("?", "a"));
        assert!(!glob_match("?", "ab"));
        assert!(glob_match("file_?", "file_1"));
        assert!(!glob_match("file_?", "file_12"));
    }

    #[test]
    fn test_rule_matches() {
        let rule = make_rule("department", "public_*", PermissionAction::Allow);

        assert!(rule.matches("department", "public_report"));
        assert!(rule.matches("department", "public_info"));
        assert!(!rule.matches("department", "private_report"));
        assert!(!rule.matches("approval", "public_report"));
    }

    #[test]
    fn test_permission_checker_default_deny() {
        let checker = PermissionChecker::default();
        assert_eq!(checker.check("any_op", "any_resource"), PermissionAction::Deny);
    }

    #[test]
    fn test_permission_checker_user_rules() {
        let rules = vec![
            make_rule("department", "*", PermissionAction::Ask),
            make_rule("document", "read_*", PermissionAction::Allow),
        ];
        let checker = PermissionChecker::with_defaults(rules);

        assert_eq!(checker.check("department", "any"), PermissionAction::Ask);
        assert_eq!(checker.check("document", "read_report"), PermissionAction::Allow);
        assert_eq!(checker.check("document", "write_report"), PermissionAction::Deny); // No rule matches
    }

    #[test]
    fn test_permission_checker_deny_priority() {
        let rules = vec![
            make_rule("document", "*", PermissionAction::Allow),
            make_rule("document", "delete_*", PermissionAction::Deny),
        ];
        let checker = PermissionChecker::with_defaults(rules);

        assert_eq!(checker.check("document", "read_report"), PermissionAction::Allow);
        assert_eq!(checker.check("document", "write_report"), PermissionAction::Allow);
        assert_eq!(checker.check("document", "delete_report"), PermissionAction::Deny);
    }

    #[test]
    fn test_permission_checker_specificity() {
        let rules = vec![
            make_rule("document", "*", PermissionAction::Allow),
            make_rule("document", "delete_*", PermissionAction::Deny),
            make_rule("document", "delete_secure_*", PermissionAction::Ask),
        ];
        let checker = PermissionChecker::with_defaults(rules);

        // Most specific pattern wins
        assert_eq!(checker.check("document", "delete_report"), PermissionAction::Deny);
        assert_eq!(checker.check("document", "delete_secure_report"), PermissionAction::Ask);
    }

    #[test]
    fn test_permission_checker_merge() {
        let mut checker = PermissionChecker::with_defaults(vec![
            make_rule("department", "*", PermissionAction::Ask),
        ]);

        checker.merge(vec![
            make_rule("document", "*", PermissionAction::Allow),
        ]);

        assert_eq!(checker.check("department", "any"), PermissionAction::Ask);
        assert_eq!(checker.check("document", "any"), PermissionAction::Allow);
    }

    #[test]
    fn test_permission_operation_parse() {
        assert_eq!(PermissionOperation::parse("department"), Some(PermissionOperation::Department));
        assert_eq!(PermissionOperation::parse("DEPARTMENT"), Some(PermissionOperation::Department));
        assert_eq!(PermissionOperation::parse("approval"), Some(PermissionOperation::Approval));
        assert_eq!(PermissionOperation::parse("unknown"), None);
    }
}
