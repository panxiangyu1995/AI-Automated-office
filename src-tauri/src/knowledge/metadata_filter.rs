//! Metadata filter DSL module.
//!
//! Provides structured filtering for document metadata during retrieval.
//! Supports comparison, string, and array operators with logical combinations.

use serde::{Deserialize, Serialize};

/// Logical operator for combining filter conditions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum LogicalOperator {
    And,
    Or,
}

impl Default for LogicalOperator {
    fn default() -> Self {
        Self::And
    }
}

/// Filter value types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FilterValue {
    String(String),
    Number(f64),
    Bool(bool),
    Array(Vec<FilterValue>),
}

impl FilterValue {
    pub fn as_string(&self) -> Option<&str> {
        match self {
            FilterValue::String(s) => Some(s),
            _ => None,
        }
    }

    pub fn as_number(&self) -> Option<f64> {
        match self {
            FilterValue::Number(n) => Some(*n),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            FilterValue::Bool(b) => Some(*b),
            _ => None,
        }
    }

    pub fn as_array(&self) -> Option<&[FilterValue]> {
        match self {
            FilterValue::Array(arr) => Some(arr),
            _ => None,
        }
    }

    pub fn as_json_value(&self) -> serde_json::Value {
        match self {
            FilterValue::String(s) => serde_json::Value::String(s.clone()),
            FilterValue::Number(n) => serde_json::json!(*n),
            FilterValue::Bool(b) => serde_json::Value::Bool(*b),
            FilterValue::Array(arr) => {
                serde_json::Value::Array(arr.iter().map(|v| v.as_json_value()).collect())
            }
        }
    }
}

impl From<&str> for FilterValue {
    fn from(s: &str) -> Self {
        FilterValue::String(s.to_string())
    }
}

impl From<String> for FilterValue {
    fn from(s: String) -> Self {
        FilterValue::String(s)
    }
}

impl From<i32> for FilterValue {
    fn from(n: i32) -> Self {
        FilterValue::Number(n as f64)
    }
}

impl From<i64> for FilterValue {
    fn from(n: i64) -> Self {
        FilterValue::Number(n as f64)
    }
}

impl From<f32> for FilterValue {
    fn from(f: f32) -> Self {
        FilterValue::Number(f as f64)
    }
}

impl From<f64> for FilterValue {
    fn from(f: f64) -> Self {
        FilterValue::Number(f)
    }
}

impl From<bool> for FilterValue {
    fn from(b: bool) -> Self {
        FilterValue::Bool(b)
    }
}

impl<T: Into<FilterValue>> From<Vec<T>> for FilterValue {
    fn from(v: Vec<T>) -> Self {
        FilterValue::Array(v.into_iter().map(Into::into).collect())
    }
}

/// Single filter condition
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "operator", content = "value")]
pub enum FilterCondition {
    #[serde(rename = "eq")]
    Eq { value: FilterValue },
    #[serde(rename = "ne")]
    Ne { value: FilterValue },
    #[serde(rename = "gt")]
    Gt { value: FilterValue },
    #[serde(rename = "gte")]
    Gte { value: FilterValue },
    #[serde(rename = "lt")]
    Lt { value: FilterValue },
    #[serde(rename = "lte")]
    Lte { value: FilterValue },
    #[serde(rename = "contains")]
    Contains { value: String },
    #[serde(rename = "starts_with")]
    StartsWith { value: String },
    #[serde(rename = "ends_with")]
    EndsWith { value: String },
    #[serde(rename = "in")]
    In { value: Vec<FilterValue> },
    #[serde(rename = "not_in")]
    NotIn { value: Vec<FilterValue> },
}

/// Metadata filter with conditions and logical operator
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MetadataFilter {
    #[serde(default)]
    pub conditions: Vec<MetadataCondition>,
    #[serde(default)]
    pub logical_operator: LogicalOperator,
}

/// Individual metadata condition with field path
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetadataCondition {
    pub field: String,
    pub condition: FilterCondition,
}

impl MetadataFilter {
    /// Create a new empty filter (matches everything)
    pub fn empty() -> Self {
        Self {
            conditions: Vec::new(),
            logical_operator: LogicalOperator::And,
        }
    }

    /// Create a filter with a single equality condition
    pub fn eq<T: Into<FilterValue>>(field: impl Into<String>, value: T) -> Self {
        Self {
            conditions: vec![MetadataCondition {
                field: field.into(),
                condition: FilterCondition::Eq { value: value.into() },
            }],
            logical_operator: LogicalOperator::And,
        }
    }

    /// Add an equality condition
    pub fn with_eq<T: Into<FilterValue>>(mut self, field: impl Into<String>, value: T) -> Self {
        self.conditions.push(MetadataCondition {
            field: field.into(),
            condition: FilterCondition::Eq { value: value.into() },
        });
        self
    }

    /// Add an IN condition
    pub fn with_in<T: Into<FilterValue>>(mut self, field: impl Into<String>, values: Vec<T>) -> Self {
        self.conditions.push(MetadataCondition {
            field: field.into(),
            condition: FilterCondition::In {
                value: values.into_iter().map(Into::into).collect(),
            },
        });
        self
    }

    /// Check if filter is empty (matches everything)
    pub fn is_empty(&self) -> bool {
        self.conditions.is_empty()
    }

    /// Validate the filter
    pub fn validate(&self) -> Result<(), FilterValidationError> {
        for cond in &self.conditions {
            cond.validate()?;
        }
        Ok(())
    }

    /// Convert to JSON string
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(self)
    }

    /// Parse from JSON string
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Check if metadata matches the filter
    pub fn matches(&self, metadata: &serde_json::Value) -> bool {
        if self.is_empty() {
            return true;
        }

        match self.logical_operator {
            LogicalOperator::And => self.conditions.iter().all(|c| c.matches(metadata)),
            LogicalOperator::Or => self.conditions.iter().any(|c| c.matches(metadata)),
        }
    }
}

impl MetadataCondition {
    /// Validate a single condition
    pub fn validate(&self) -> Result<(), FilterValidationError> {
        if self.field.is_empty() {
            return Err(FilterValidationError::EmptyField);
        }

        for c in self.field.chars() {
            if !c.is_alphanumeric() && c != '_' && c != '.' && c != '-' {
                return Err(FilterValidationError::InvalidFieldName {
                    field: self.field.clone(),
                    char: c,
                });
            }
        }

        match &self.condition {
            FilterCondition::In { value }
            | FilterCondition::NotIn { value } => {
                if value.is_empty() {
                    return Err(FilterValidationError::EmptyArray);
                }
            }
            _ => {}
        }

        Ok(())
    }

    /// Check if metadata matches this condition
    pub fn matches(&self, metadata: &serde_json::Value) -> bool {
        let field_value = self.get_field_value(metadata);

        match &self.condition {
            FilterCondition::Eq { value } => self.compare_eq(&field_value, value),
            FilterCondition::Ne { value } => !self.compare_eq(&field_value, value),
            FilterCondition::Gt { value } => self.compare_num(&field_value, value, |a, b| a > b),
            FilterCondition::Gte { value } => self.compare_num(&field_value, value, |a, b| a >= b),
            FilterCondition::Lt { value } => self.compare_num(&field_value, value, |a, b| a < b),
            FilterCondition::Lte { value } => self.compare_num(&field_value, value, |a, b| a <= b),
            FilterCondition::Contains { value } => field_value
                .as_str()
                .map(|s| s.contains(value))
                .unwrap_or(false),
            FilterCondition::StartsWith { value } => field_value
                .as_str()
                .map(|s| s.starts_with(value))
                .unwrap_or(false),
            FilterCondition::EndsWith { value } => field_value
                .as_str()
                .map(|s| s.ends_with(value))
                .unwrap_or(false),
            FilterCondition::In { value } => {
                if let Some(field_str) = field_value.as_str() {
                    value.iter().any(|v| v.as_string() == Some(field_str))
                } else {
                    false
                }
            }
            FilterCondition::NotIn { value } => {
                if let Some(field_str) = field_value.as_str() {
                    !value.iter().any(|v| v.as_string() == Some(field_str))
                } else {
                    true
                }
            }
        }
    }

    /// Get value from metadata by field path
    fn get_field_value<'a>(&self, metadata: &'a serde_json::Value) -> serde_json::Value {
        let parts: Vec<&str> = self.field.split('.').collect();
        let mut current = metadata.clone();

        for part in parts {
            current = current.get(part).cloned().unwrap_or(serde_json::Value::Null);
        }

        current
    }

    /// Compare for equality
    fn compare_eq(&self, field_value: &serde_json::Value, filter_value: &FilterValue) -> bool {
        match (field_value, filter_value) {
            (serde_json::Value::Null, _) => false,
            (serde_json::Value::String(s), FilterValue::String(v)) => s == v,
            (serde_json::Value::Number(n), FilterValue::Number(v)) => {
                n.as_f64().map(|nf| (nf - v).abs() < f64::EPSILON).unwrap_or(false)
            }
            (serde_json::Value::Bool(b), FilterValue::Bool(v)) => b == v,
            _ => false,
        }
    }

    /// Compare numbers
    fn compare_num<F>(&self, field_value: &serde_json::Value, filter_value: &FilterValue, op: F) -> bool
    where
        F: Fn(f64, f64) -> bool,
    {
        match (field_value.as_f64(), filter_value.as_number()) {
            (Some(n), Some(v)) => op(n, v),
            _ => false,
        }
    }
}

/// Filter validation errors
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FilterValidationError {
    EmptyField,
    InvalidFieldName { field: String, char: char },
    EmptyArray,
}

impl std::fmt::Display for FilterValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FilterValidationError::EmptyField => write!(f, "Field name cannot be empty"),
            FilterValidationError::InvalidFieldName { field, char } => {
                write!(f, "Invalid character '{}' in field name '{}'", char, field)
            }
            FilterValidationError::EmptyArray => write!(f, "Array cannot be empty"),
        }
    }
}

impl std::error::Error for FilterValidationError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_filter() {
        let filter = MetadataFilter::empty();
        assert!(filter.conditions.is_empty());
        assert!(filter.is_empty());
    }

    #[test]
    fn test_eq_filter() {
        let filter = MetadataFilter::eq("department_id", "sales");
        assert!(filter.validate().is_ok());
    }

    #[test]
    fn test_chain_filters() {
        let filter = MetadataFilter::eq("department_id", "sales")
            .with_eq("status", "active")
            .with_in("tags", vec!["important", "urgent"]);

        assert_eq!(filter.conditions.len(), 3);
        assert!(filter.validate().is_ok());
    }

    #[test]
    fn test_invalid_field_name() {
        let condition = MetadataCondition {
            field: "field@name".to_string(),
            condition: FilterCondition::Eq {
                value: FilterValue::String("value".to_string()),
            },
        };
        assert!(condition.validate().is_err());
    }

    #[test]
    fn test_in_filter() {
        let filter = MetadataFilter::eq("document_type", "policy")
            .with_in("tags", vec!["HR", "Finance"]);

        assert!(filter.validate().is_ok());
    }

    #[test]
    fn test_json_roundtrip() {
        let filter = MetadataFilter::eq("department_id", "sales")
            .with_in("tags", vec!["important"]);

        let json = filter.to_json().unwrap();
        let parsed = MetadataFilter::from_json(&json).unwrap();

        assert_eq!(filter.conditions.len(), parsed.conditions.len());
    }

    #[test]
    fn test_condition_matching() {
        let condition = MetadataCondition {
            field: "department_id".to_string(),
            condition: FilterCondition::Eq {
                value: FilterValue::String("sales".to_string()),
            },
        };

        let metadata = serde_json::json!({
            "department_id": "sales",
            "tags": ["important"]
        });

        assert!(condition.matches(&metadata));
    }

    #[test]
    fn test_numeric_matching() {
        let condition = MetadataCondition {
            field: "score".to_string(),
            condition: FilterCondition::Gt {
                value: FilterValue::Number(0.5),
            },
        };

        let metadata = serde_json::json!({ "score": 0.8 });
        assert!(condition.matches(&metadata));

        let metadata2 = serde_json::json!({ "score": 0.3 });
        assert!(!condition.matches(&metadata2));
    }

    #[test]
    fn test_filter_matching_with_and() {
        let filter = MetadataFilter::eq("department_id", "sales")
            .with_eq("status", "active");

        let metadata = serde_json::json!({
            "department_id": "sales",
            "status": "active"
        });
        assert!(filter.matches(&metadata));

        let metadata2 = serde_json::json!({
            "department_id": "sales",
            "status": "inactive"
        });
        assert!(!filter.matches(&metadata2));
    }

    #[test]
    fn test_filter_matching_with_or() {
        let filter = MetadataFilter::eq("department_id", "sales")
            .with_eq("department_id", "hr")
            .with_or();

        let metadata = serde_json::json!({
            "department_id": "sales"
        });
        assert!(filter.matches(&metadata));
    }
}
