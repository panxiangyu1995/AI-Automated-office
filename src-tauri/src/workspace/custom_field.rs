//! Custom Field Service
//!
//! Manages custom field definitions and values per module.
//! Each department module can register custom fields that extend
//! its base schema without modifying core data structures.

use crate::workspace::types::*;
use chrono::Utc;
use std::collections::HashMap;
use std::sync::RwLock;
use tracing::info;

pub struct CustomFieldService {
    definitions: RwLock<HashMap<String, CustomFieldDefinition>>,
    values: RwLock<HashMap<String, CustomFieldValue>>,
}

impl CustomFieldService {
    pub fn new() -> Self {
        Self {
            definitions: RwLock::new(HashMap::new()),
            values: RwLock::new(HashMap::new()),
        }
    }

    /// Register a new custom field definition
    pub fn create_field(&self, req: CreateCustomFieldRequest) -> Result<CustomFieldDefinition, String> {
        let now = Utc::now().timestamp();
        let id = format!("cf_{}", uuid::Uuid::new_v4());

        let definition = CustomFieldDefinition {
            id: id.clone(),
            name: req.name,
            label: req.label,
            field_type: req.field_type,
            module: req.module,
            required: req.required.unwrap_or(false),
            default_value: req.default_value,
            options: req.options,
            validation: req.validation,
            ai_hint: req.ai_hint,
            sort_order: 0,
            created_at: now,
            updated_at: now,
        };

        let mut defs = self.definitions.write().unwrap();
        defs.insert(id, definition.clone());
        info!("Custom field created: {} ({})", definition.name, definition.id);
        Ok(definition)
    }

    /// List field definitions for a module
    pub fn list_fields(&self, module: &str) -> Vec<CustomFieldDefinition> {
        let defs = self.definitions.read().unwrap();
        let mut fields: Vec<CustomFieldDefinition> = defs
            .values()
            .filter(|d| d.module == module)
            .cloned()
            .collect();
        fields.sort_by_key(|d| d.sort_order);
        fields
    }

    /// Get a single field definition
    pub fn get_field(&self, id: &str) -> Option<CustomFieldDefinition> {
        let defs = self.definitions.read().unwrap();
        defs.get(id).cloned()
    }

    /// Delete a field definition
    pub fn delete_field(&self, id: &str) -> Result<(), String> {
        let mut defs = self.definitions.write().unwrap();
        defs.remove(id).ok_or("字段定义不存在")?;
        // Also remove all values for this field
        let mut vals = self.values.write().unwrap();
        vals.retain(|_, v| v.field_id != id);
        Ok(())
    }

    /// Set a custom field value for an entity
    pub fn set_value(
        &self,
        field_id: &str,
        entity_type: &str,
        entity_id: &str,
        value: serde_json::Value,
    ) -> Result<CustomFieldValue, String> {
        // Validate field exists
        {
            let defs = self.definitions.read().unwrap();
            let def = defs.get(field_id).ok_or("字段定义不存在")?;
            // Validate value against field type
            let result = self.validate_value(&value, def);
            if !result.valid {
                return Err(result.errors.join("; "));
            }
        }

        let now = Utc::now().timestamp();
        let key = format!("{}:{}:{}", field_id, entity_type, entity_id);

        let field_value = CustomFieldValue {
            field_id: field_id.to_string(),
            entity_type: entity_type.to_string(),
            entity_id: entity_id.to_string(),
            value,
            updated_at: now,
        };

        let mut vals = self.values.write().unwrap();
        vals.insert(key, field_value.clone());
        Ok(field_value)
    }

    /// Get custom field values for an entity
    pub fn get_entity_values(&self, entity_type: &str, entity_id: &str) -> Vec<CustomFieldValue> {
        let vals = self.values.read().unwrap();
        vals.values()
            .filter(|v| v.entity_type == entity_type && v.entity_id == entity_id)
            .cloned()
            .collect()
    }

    /// Validate a value against its field definition
    pub fn validate_value(&self, value: &serde_json::Value, def: &CustomFieldDefinition) -> FieldValidationResult {
        let mut errors = Vec::new();

        // Type check
        let type_valid = match def.field_type {
            CustomFieldType::Text | CustomFieldType::RichText => value.is_string(),
            CustomFieldType::Number => value.is_number(),
            CustomFieldType::Boolean => value.is_boolean(),
            CustomFieldType::Date => value.is_string(),
            CustomFieldType::Select => value.is_string(),
            CustomFieldType::MultiSelect => value.is_array(),
            CustomFieldType::File => value.is_string(),
            CustomFieldType::Reference => value.is_string(),
        };

        if !type_valid {
            errors.push(format!(
                "值类型不匹配，期望 {:?} 类型",
                def.field_type
            ));
        }

        // Validation rules
        if let Some(ref validation) = def.validation {
            if let (Some(min), Some(s)) = (validation.min_length, value.as_str()) {
                if (s.len() as i32) < min {
                    errors.push(format!("长度不能小于 {}", min));
                }
            }
            if let (Some(max), Some(s)) = (validation.max_length, value.as_str()) {
                if (s.len() as i32) > max {
                    errors.push(format!("长度不能超过 {}", max));
                }
            }
            if let (Some(min), Some(n)) = (validation.min_value, value.as_f64()) {
                if n < min {
                    errors.push(format!("值不能小于 {}", min));
                }
            }
            if let (Some(max), Some(n)) = (validation.max_value, value.as_f64()) {
                if n > max {
                    errors.push(format!("值不能超过 {}", max));
                }
            }
            if let (Some(ref pattern), Some(s)) = (&validation.pattern, value.as_str()) {
                if let Ok(re) = regex::Regex::new(pattern) {
                    if !re.is_match(s) {
                        errors.push(format!("值不匹配正则 {}", pattern));
                    }
                }
            }
        }

        // Select options check
        if def.field_type == CustomFieldType::Select {
            if let (Some(ref options), Some(s)) = (&def.options, value.as_str()) {
                if !options.iter().any(|o| o.value == s) {
                    errors.push(format!("'{}' 不是有效选项", s));
                }
            }
        }

        FieldValidationResult {
            valid: errors.is_empty(),
            errors,
        }
    }
}

impl Default for CustomFieldService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_and_list_fields() {
        let service = CustomFieldService::new();

        let req = CreateCustomFieldRequest {
            name: "priority".to_string(),
            label: "优先级".to_string(),
            field_type: CustomFieldType::Select,
            module: "hr".to_string(),
            required: false,
            default_value: None,
            options: Some(vec![
                SelectOption {
                    value: "high".to_string(),
                    label: "高".to_string(),
                    color: Some("red".to_string()),
                },
                SelectOption {
                    value: "low".to_string(),
                    label: "低".to_string(),
                    color: Some("green".to_string()),
                },
            ]),
            validation: None,
            ai_hint: None,
        };

        let field = service.create_field(req).unwrap();
        assert_eq!(field.name, "priority");

        let fields = service.list_fields("hr");
        assert_eq!(fields.len(), 1);
    }

    #[test]
    fn test_set_and_get_value() {
        let service = CustomFieldService::new();

        let req = CreateCustomFieldRequest {
            name: "notes".to_string(),
            label: "备注".to_string(),
            field_type: CustomFieldType::Text,
            module: "sales".to_string(),
            required: false,
            default_value: None,
            options: None,
            validation: None,
            ai_hint: None,
        };

        let field = service.create_field(req).unwrap();

        let val = service
            .set_value(&field.id, "customer", "c-001", serde_json::json!("重要客户"))
            .unwrap();
        assert_eq!(val.value, serde_json::json!("重要客户"));

        let values = service.get_entity_values("customer", "c-001");
        assert_eq!(values.len(), 1);
    }

    #[test]
    fn test_validate_select_field() {
        let service = CustomFieldService::new();

        let def = CustomFieldDefinition {
            id: "cf_test".to_string(),
            name: "status".to_string(),
            label: "状态".to_string(),
            field_type: CustomFieldType::Select,
            module: "hr".to_string(),
            required: true,
            default_value: None,
            options: Some(vec![
                SelectOption {
                    value: "active".to_string(),
                    label: "在职".to_string(),
                    color: None,
                },
            ]),
            validation: None,
            ai_hint: None,
            sort_order: 0,
            created_at: 0,
            updated_at: 0,
        };

        let valid = service.validate_value(&serde_json::json!("active"), &def);
        assert!(valid.valid);

        let invalid = service.validate_value(&serde_json::json!("unknown"), &def);
        assert!(!invalid.valid);
    }
}