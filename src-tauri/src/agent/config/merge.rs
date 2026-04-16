//! Configuration Merge Module
//!
//! Implements multi-layer config merge with priority:
//! Native Agent Config (内置默认值) → File Config → User Config → Runtime Overrides
//!
//! Merge semantics:
//! - Shallow merge for top-level fields (last wins)
//! - Deep merge for nested objects (permission, options)
//! - Array replacement (not concatenation)
//! - Null values unset existing keys
//!
//! See spec: openspec/changes/subagent-architecture-alignment/specs/subagent-config-merge/spec.md

use std::collections::HashMap;

use super::loader::AgentConfig;

/// Merge priority levels (higher = higher priority)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum MergePriority {
    /// Built-in defaults (lowest priority)
    Native = 0,
    /// File-based configuration
    File = 1,
    /// User-level overrides
    User = 2,
    /// Runtime overrides (highest priority)
    Runtime = 3,
}

impl std::fmt::Display for MergePriority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MergePriority::Native => write!(f, "native"),
            MergePriority::File => write!(f, "file"),
            MergePriority::User => write!(f, "user"),
            MergePriority::Runtime => write!(f, "runtime"),
        }
    }
}

/// Merge result containing the final config and metadata
#[derive(Debug)]
pub struct MergeResult {
    pub config: AgentConfig,
    pub merged_fields: Vec<String>,
}

/// Config merger for multi-layer merging
#[derive(Debug, Clone, Default)]
pub struct ConfigMerger;

impl ConfigMerger {
    /// Create a new merger
    pub fn new() -> Self {
        Self
    }

    /// Merge multiple configs with priority (lowest first)
    ///
    /// Higher priority configs override lower priority ones.
    pub fn merge_configs(&self, configs: &[(MergePriority, AgentConfig)]) -> MergeResult {
        if configs.is_empty() {
            return MergeResult {
                config: AgentConfig::default(),
                merged_fields: vec![],
            };
        }

        // Sort by priority (already sorted if input is sorted)
        // We'll merge in order: first = lowest priority, last = highest
        let mut result = configs[0].1.clone();
        let mut merged_fields = Vec::new();

        for &(priority, ref config) in configs.iter().skip(1) {
            let fields = self.merge_into(&mut result, config, priority);
            merged_fields.extend(fields);
        }

        MergeResult {
            config: result,
            merged_fields,
        }
    }

    /// Merge a source config into target, returning list of merged fields
    fn merge_into(
        &self,
        target: &mut AgentConfig,
        source: &AgentConfig,
        _source_priority: MergePriority,
    ) -> Vec<String> {
        let mut merged = Vec::new();

        // Name - only if not set in target or source has higher priority
        if !target.name.is_empty() {
            // Keep target name
        } else {
            target.name = source.name.clone();
            merged.push("name".to_string());
        }

        // Mode - last wins (shallow merge)
        if target.mode != source.mode {
            target.mode = source.mode.clone();
            merged.push("mode".to_string());
        }

        // Description - last wins
        if target.description != source.description {
            target.description = source.description.clone();
            merged.push("description".to_string());
        }

        // Prompt - last wins
        if target.prompt != source.prompt {
            target.prompt = source.prompt.clone();
            merged.push("prompt".to_string());
        }

        // Skills - array replacement (not concatenation)
        if target.skills != source.skills {
            target.skills = source.skills.clone();
            merged.push("skills".to_string());
        }

        // Tools - array replacement
        if target.tools != source.tools {
            target.tools = source.tools.clone();
            merged.push("tools".to_string());
        }

        // MCP tools - array replacement
        if target.mcp_tools != source.mcp_tools {
            target.mcp_tools = source.mcp_tools.clone();
            merged.push("mcp_tools".to_string());
        }

        // Permissions - deep merge
        if !source.permissions.is_empty() {
            let perms_merged = self.deep_merge_maps(&target.permissions, &source.permissions);
            if perms_merged {
                merged.push("permissions".to_string());
            }
            target.permissions = self.merge_permissions(&target.permissions, &source.permissions);
        }

        // Options - deep merge
        if !source.options.is_empty() {
            target.options = self.deep_merge_json(&target.options, &source.options);
            merged.push("options".to_string());
        }

        merged
    }

    /// Merge permissions with deep merge semantics
    ///
    /// For permissions: {op: {pattern: action}}
    /// Deep merge at the operation level, but pattern-level is replacement
    fn merge_permissions(
        &self,
        target: &HashMap<String, HashMap<String, String>>,
        source: &HashMap<String, HashMap<String, String>>,
    ) -> HashMap<String, HashMap<String, String>> {
        let mut result = target.clone();

        for (op, source_patterns) in source {
            if let Some(target_patterns) = result.get_mut(op) {
                // Deep merge at operation level - merge patterns
                for (pattern, action) in source_patterns {
                    // Pattern-level: replacement
                    target_patterns.insert(pattern.clone(), action.clone());
                }
            } else {
                // New operation - add entire entry
                result.insert(op.clone(), source_patterns.clone());
            }
        }

        result
    }

    /// Deep merge two JSON value maps
    fn deep_merge_json(
        &self,
        target: &HashMap<String, serde_json::Value>,
        source: &HashMap<String, serde_json::Value>,
    ) -> HashMap<String, serde_json::Value> {
        let mut result = target.clone();

        for (key, source_value) in source {
            if let Some(target_value) = result.get(key) {
                // Both have this key - try to merge
                if let (Some(target_obj), Some(source_obj)) =
                    (target_value.as_object(), source_value.as_object())
                {
                    // Both are objects - deep merge
                    let merged = self.deep_merge_json(
                        &target_obj
                            .iter()
                            .map(|(k, v)| (k.clone(), v.clone()))
                            .collect(),
                        &source_obj
                            .iter()
                            .map(|(k, v)| (k.clone(), v.clone()))
                            .collect(),
                    );
                    result.insert(key.clone(), serde_json::json!(merged));
                } else if source_value.is_null() {
                    // Null in source - remove key from target
                    result.remove(key);
                } else {
                    // Source wins
                    result.insert(key.clone(), source_value.clone());
                }
            } else {
                // Key only in source - add
                result.insert(key.clone(), source_value.clone());
            }
        }

        result
    }

    /// Check if two maps would result in a merge (helper)
    fn deep_merge_maps<K, V>(
        &self,
        target: &HashMap<K, V>,
        source: &HashMap<K, V>,
    ) -> bool
    where
        K: std::hash::Hash + Eq + Clone,
        V: Clone + PartialEq,
    {
        // Simple check - if source has any keys not in target, or different values
        source.keys().any(|k| {
            target.get(k).map(|v| v != source.get(k).unwrap()).unwrap_or(true)
        })
    }
}

// Implement Default for AgentConfig for the merge result
impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            name: String::new(),
            mode: "primary".to_string(),
            description: String::new(),
            prompt: String::new(),
            skills: Vec::new(),
            tools: Vec::new(),
            mcp_tools: Vec::new(),
            permissions: Default::default(),
            options: Default::default(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_config(name: &str, mode: &str, skills: Vec<&str>) -> AgentConfig {
        AgentConfig {
            name: name.to_string(),
            mode: mode.to_string(),
            description: format!("Description for {}", name),
            prompt: format!("Prompt for {}", name),
            skills: skills.into_iter().map(|s| s.to_string()).collect(),
            tools: vec![],
            mcp_tools: vec![],
            permissions: Default::default(),
            options: Default::default(),
        }
    }

    #[test]
    fn test_shallow_merge_name() {
        let merger = ConfigMerger::new();

        let native = make_config("native-agent", "primary", vec!["skill1"]);
        let user = make_config("user-agent", "subagent", vec!["skill2"]);

        let result = merger.merge_configs(&[
            (MergePriority::Native, native),
            (MergePriority::User, user),
        ]);

        // User (higher priority) wins for name
        assert_eq!(result.config.name, "user-agent");
    }

    #[test]
    fn test_array_replacement_not_concat() {
        let merger = ConfigMerger::new();

        let native = make_config("agent", "primary", vec!["skill1", "skill2"]);
        let user = make_config("agent", "primary", vec!["skill3"]);

        let result = merger.merge_configs(&[
            (MergePriority::Native, native),
            (MergePriority::User, user),
        ]);

        // Array is replaced, not concatenated
        assert_eq!(result.config.skills, vec!["skill3"]);
        assert_ne!(result.config.skills, vec!["skill1", "skill2", "skill3"]);
    }

    #[test]
    fn test_deep_merge_permissions() {
        let merger = ConfigMerger::new();

        let mut native = make_config("agent", "primary", vec![]);
        native.permissions = [
            ("department".to_string(), [("*".to_string(), "ask".to_string())].into()),
        ]
        .into();

        let mut user = make_config("agent", "primary", vec![]);
        user.permissions = [
            (
                "department".to_string(),
                [("public_*".to_string(), "allow".to_string())].into(),
            ),
            (
                "document".to_string(),
                [("read_*".to_string(), "allow".to_string())].into(),
            ),
        ]
        .into();

        let result = merger.merge_configs(&[
            (MergePriority::Native, native),
            (MergePriority::User, user),
        ]);

        // department: merged patterns
        // document: added
        assert!(result.config.permissions.contains_key("department"));
        assert!(result.config.permissions.contains_key("document"));
    }

    #[test]
    fn test_null_removes_key() {
        let merger = ConfigMerger::new();

        let mut target = make_config("agent", "primary", vec![]);
        target.options = [("key1".to_string(), serde_json::json!("value1"))]
            .into_iter()
            .collect();

        let mut source = make_config("agent", "primary", vec![]);
        source.options = [("key1".to_string(), serde_json::Value::Null)]
            .into_iter()
            .collect();

        let result = merger.merge_configs(&[
            (MergePriority::Native, target),
            (MergePriority::User, source),
        ]);

        // Null in source should remove the key
        assert!(!result.config.options.contains_key("key1"));
    }
}
