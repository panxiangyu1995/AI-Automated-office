//! Data Scope Filter
//!
//! Implements data access filtering based on user's scope.
//! Supports: Personal, Department, All, Executive scopes.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use super::DataScopeType;

/// Scope filter error types
#[derive(Debug, Error)]
pub enum ScopeFilterError {
    #[error("Invalid scope configuration: {0}")]
    InvalidConfig(String),

    #[error("Scope not applicable: {0}")]
    ScopeNotApplicable(String),
}

/// Scope filter result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopeFilterResult {
    /// The applied scope
    pub scope: DataScopeType,
    /// SQL WHERE clause (if applicable)
    pub sql_filter: Option<String>,
    /// Field mappings for data isolation
    pub field_mappings: HashMap<String, String>,
    /// Whether additional joins are required
    pub requires_join: bool,
    /// Additional conditions
    pub conditions: Vec<String>,
}

impl Default for ScopeFilterResult {
    fn default() -> Self {
        Self {
            scope: DataScopeType::Personal,
            sql_filter: None,
            field_mappings: HashMap::new(),
            requires_join: false,
            conditions: Vec::new(),
        }
    }
}

/// Data scope filter
#[derive(Debug, Clone)]
pub struct DataScopeFilter {
    /// Current user ID
    user_id: String,
    /// Current user department ID
    department_id: Option<String>,
    /// User role
    role: String,
    /// Is executive user
    is_executive: bool,
}

impl DataScopeFilter {
    /// Create a new scope filter
    pub fn new(user_id: String, department_id: Option<String>, role: String) -> Self {
        let is_executive = role == "admin" || role == "executive";
        Self {
            user_id,
            department_id,
            role,
            is_executive,
        }
    }

    /// Create from execution context
    pub fn from_context(
        user_id: &str,
        department_id: Option<&str>,
        role: &str,
    ) -> Self {
        Self::new(
            user_id.to_string(),
            department_id.map(|s| s.to_string()),
            role.to_string(),
        )
    }

    /// Filter a query based on user's scope
    pub fn filter_query(&self, scope: DataScopeType, table_alias: &str) -> String {
        match scope {
            DataScopeType::Personal => {
                format!("{}.user_id = '{}'", table_alias, self.user_id)
            }
            DataScopeType::Department => {
                if let Some(dept_id) = &self.department_id {
                    format!("{}.department_id = '{}'", table_alias, dept_id)
                } else {
                    // Fallback to personal if no department
                    format!("{}.user_id = '{}'", table_alias, self.user_id)
                }
            }
            DataScopeType::All => {
                "1=1".to_string() // No filtering
            }
            DataScopeType::Executive => {
                "1=1".to_string() // Executives see everything
            }
        }
    }

    /// Build a complete SQL WHERE clause
    pub fn build_where_clause(
        &self,
        scope: DataScopeType,
        table_alias: &str,
        user_field: &str,
        department_field: &str,
    ) -> String {
        match scope {
            DataScopeType::Personal => {
                format!("{} = '{}'", user_field, self.user_id)
            }
            DataScopeType::Department => {
                if let Some(dept_id) = &self.department_id {
                    format!("{} = '{}'", department_field, dept_id)
                } else {
                    format!("{} = '{}'", user_field, self.user_id)
                }
            }
            DataScopeType::All => "1=1".to_string(),
            DataScopeType::Executive => "1=1".to_string(),
        }
    }

    /// Get scope for a specific entity type
    pub fn get_scope_for_entity(&self, entity_type: &str) -> DataScopeType {
        match entity_type {
            "finance" | "expense" | "invoice" => {
                match self.role.as_str() {
                    "admin" | "executive" => DataScopeType::Executive,
                    "manager" => DataScopeType::All,
                    "specialist" => DataScopeType::Department,
                    _ => DataScopeType::Personal,
                }
            }
            "hr" | "employee" | "attendance" => {
                match self.role.as_str() {
                    "admin" | "executive" => DataScopeType::All,
                    "manager" => DataScopeType::Department,
                    _ => DataScopeType::Personal,
                }
            }
            "warehouse" | "inventory" => {
                match self.role.as_str() {
                    "admin" | "executive" | "manager" => DataScopeType::All,
                    _ => DataScopeType::Department,
                }
            }
            "sales" | "customer" | "order" => {
                match self.role.as_str() {
                    "admin" | "executive" => DataScopeType::All,
                    "manager" => DataScopeType::Department,
                    _ => DataScopeType::Personal,
                }
            }
            _ => DataScopeType::Personal,
        }
    }

    /// Check if user can access all data of a type
    pub fn can_access_all(&self) -> bool {
        matches!(self.role.as_str(), "admin" | "executive" | "manager")
    }

    /// Check if user can access department data
    pub fn can_access_department(&self) -> bool {
        self.department_id.is_some()
            && matches!(
                self.role.as_str(),
                "admin" | "executive" | "manager" | "specialist"
            )
    }

    /// Get filter result for an entity
    pub fn get_filter_result(&self, entity_type: &str) -> ScopeFilterResult {
        let scope = self.get_scope_for_entity(entity_type);
        self.to_filter_result(scope, entity_type)
    }

    /// Convert scope to filter result
    fn to_filter_result(&self, scope: DataScopeType, entity_type: &str) -> ScopeFilterResult {
        let (sql_filter, conditions) = match scope {
            DataScopeType::Personal => {
                let filter = match entity_type {
                    "finance" | "expense" | "invoice" => {
                        format!("applicant_id = '{}'", self.user_id)
                    }
                    "hr" | "employee" => {
                        format!("employee_id = '{}'", self.user_id)
                    }
                    _ => {
                        format!("user_id = '{}'", self.user_id)
                    }
                };
                (Some(filter), Vec::new())
            }
            DataScopeType::Department => {
                if let Some(dept_id) = &self.department_id {
                    let filter = match entity_type {
                        "finance" | "expense" | "invoice" => {
                            format!("department = '{}'", dept_id)
                        }
                        "hr" | "employee" => {
                            format!("department_id = '{}'", dept_id)
                        }
                        _ => {
                            format!("department_id = '{}'", dept_id)
                        }
                    };
                    (Some(filter), Vec::new())
                } else {
                    // Fall back to personal if no department
                    let filter = format!("user_id = '{}'", self.user_id);
                    (Some(filter), Vec::new())
                }
            }
            DataScopeType::All => (Some("1=1".to_string()), Vec::new()),
            DataScopeType::Executive => {
                let mut conditions = Vec::new();
                if entity_type == "finance" || entity_type == "expense" {
                    // Executive can see all but with additional checks
                    conditions.push("include_sensitive = true".to_string());
                }
                (Some("1=1".to_string()), conditions)
            }
        };

        ScopeFilterResult {
            scope,
            sql_filter,
            field_mappings: HashMap::new(),
            requires_join: false,
            conditions,
        }
    }

    /// Filter data based on scope
    pub fn filter_data<T: Clone>(
        &self,
        data: &[T],
        entity_type: &str,
        user_field_extractor: impl Fn(&T) -> String,
        department_field_extractor: impl Fn(&T) -> Option<String>,
    ) -> Vec<T> {
        let scope = self.get_scope_for_entity(entity_type);

        data.iter()
            .filter(|item| {
                match scope {
                    DataScopeType::Personal => {
                        user_field_extractor(item) == self.user_id
                    }
                    DataScopeType::Department => {
                        if let Some(dept_id) = &self.department_id {
                            department_field_extractor(item).as_ref() == Some(dept_id)
                        } else {
                            user_field_extractor(item) == self.user_id
                        }
                    }
                    DataScopeType::All => true,
                    DataScopeType::Executive => true,
                }
            })
            .cloned()
            .collect()
    }
}

/// Apply scope filter to a collection (convenience function)
pub fn apply_scope_filter<T: Clone>(
    data: &[T],
    user_id: &str,
    department_id: Option<&str>,
    role: &str,
    entity_type: &str,
    user_field_extractor: impl Fn(&T) -> String,
    department_field_extractor: impl Fn(&T) -> Option<String>,
) -> Vec<T> {
    let filter = DataScopeFilter::from_context(user_id, department_id, role);
    filter.filter_data(
        data,
        entity_type,
        user_field_extractor,
        department_field_extractor,
    )
}

/// Build a scope query (convenience function)
pub fn build_scope_query(
    user_id: &str,
    department_id: Option<&str>,
    role: &str,
    entity_type: &str,
    table_alias: &str,
) -> String {
    let filter = DataScopeFilter::from_context(user_id, department_id, role);
    let scope = filter.get_scope_for_entity(entity_type);
    filter.filter_query(scope, table_alias)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_personal_scope() {
        let filter = DataScopeFilter::new(
            "user1".to_string(),
            None,
            "staff".to_string(),
        );

        assert_eq!(filter.get_scope_for_entity("finance"), DataScopeType::Personal);
        let result = filter.get_filter_result("finance");
        assert_eq!(result.scope, DataScopeType::Personal);
        assert!(result.sql_filter.is_some());
    }

    #[test]
    fn test_department_scope() {
        let filter = DataScopeFilter::new(
            "user1".to_string(),
            Some("dept1".to_string()),
            "specialist".to_string(),
        );

        assert_eq!(filter.get_scope_for_entity("finance"), DataScopeType::Department);
        let result = filter.get_filter_result("finance");
        assert_eq!(result.scope, DataScopeType::Department);
        assert!(result.sql_filter.unwrap().contains("dept1"));
    }

    #[test]
    fn test_manager_all_scope() {
        let filter = DataScopeFilter::new(
            "mgr1".to_string(),
            Some("dept1".to_string()),
            "manager".to_string(),
        );

        assert_eq!(filter.get_scope_for_entity("finance"), DataScopeType::All);
        let result = filter.get_filter_result("finance");
        assert_eq!(result.scope, DataScopeType::All);
        assert_eq!(result.sql_filter.unwrap(), "1=1");
    }

    #[test]
    fn test_executive_scope() {
        let filter = DataScopeFilter::new(
            "exec1".to_string(),
            Some("dept1".to_string()),
            "executive".to_string(),
        );

        assert_eq!(filter.get_scope_for_entity("finance"), DataScopeType::Executive);
        let result = filter.get_filter_result("finance");
        assert_eq!(result.scope, DataScopeType::Executive);
        assert!(result.conditions.contains(&"include_sensitive = true".to_string()));
    }

    #[test]
    fn test_filter_data() {
        let data = vec![
            ("item1", "user1", Some("dept1")),
            ("item2", "user1", Some("dept2")),
            ("item3", "user2", Some("dept1")),
        ];

        let filter = DataScopeFilter::new(
            "user1".to_string(),
            Some("dept1".to_string()),
            "specialist".to_string(),
        );

        let result: Vec<_> = data
            .iter()
            .filter(|(name, user_id, dept_id)| {
                match filter.get_scope_for_entity("test") {
                    DataScopeType::Personal => *user_id == "user1",
                    DataScopeType::Department => {
                        *dept_id == Some(&"dept1".to_string())
                    }
                    _ => true,
                }
            })
            .collect();

        assert_eq!(result.len(), 2);
        assert_eq!(result[0].0, "item1");
        assert_eq!(result[1].0, "item3");
    }

    #[test]
    fn test_build_scope_query() {
        let query = build_scope_query(
            "user1",
            Some("dept1"),
            "staff",
            "finance",
            "t",
        );

        assert!(query.contains("dept1"));
    }

    #[test]
    fn test_hr_entity_scopes() {
        let filter = DataScopeFilter::new(
            "user1".to_string(),
            Some("dept1".to_string()),
            "staff".to_string(),
        );

        // Staff HR access is personal
        assert_eq!(filter.get_scope_for_entity("hr"), DataScopeType::Personal);
        assert_eq!(filter.get_scope_for_entity("employee"), DataScopeType::Personal);

        // Manager HR access is department
        let manager_filter = DataScopeFilter::new(
            "mgr1".to_string(),
            Some("dept1".to_string()),
            "manager".to_string(),
        );
        assert_eq!(manager_filter.get_scope_for_entity("hr"), DataScopeType::Department);
        assert_eq!(manager_filter.get_scope_for_entity("employee"), DataScopeType::Department);

        // Admin HR access is all
        let admin_filter = DataScopeFilter::new(
            "admin1".to_string(),
            Some("dept1".to_string()),
            "admin".to_string(),
        );
        assert_eq!(admin_filter.get_scope_for_entity("hr"), DataScopeType::All);
        assert_eq!(admin_filter.get_scope_for_entity("employee"), DataScopeType::All);
    }

    #[test]
    fn test_warehouse_entity_scopes() {
        let staff_filter = DataScopeFilter::new(
            "user1".to_string(),
            Some("dept1".to_string()),
            "staff".to_string(),
        );
        assert_eq!(staff_filter.get_scope_for_entity("warehouse"), DataScopeType::Department);

        let manager_filter = DataScopeFilter::new(
            "mgr1".to_string(),
            Some("dept1".to_string()),
            "manager".to_string(),
        );
        assert_eq!(manager_filter.get_scope_for_entity("warehouse"), DataScopeType::All);
    }
}
