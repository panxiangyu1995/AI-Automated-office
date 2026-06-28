//! Built-in Agent Configuration Module
//!
//! Provides configuration structures for each built-in agent type,
//! including tool permissions, system prompts, and execution constraints.

use super::builtin_agent_types::BuiltinAgentType;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

/// System prompt templates for each agent type
pub const SYSTEM_PROMPTS: &[(&str, &str)] = &[
    (
        "general-purpose",
        r#"You are a helpful AI assistant with access to all available tools.
You can help users with a wide range of tasks including file operations,
search, web browsing, and business operations.
Always explain what you're going to do before doing it, especially for
potentially destructive operations."#,
    ),
    (
        "explore",
        r#"You are a read-only exploration assistant.
You have access to search tools (Glob, Grep, Read) only.
Your purpose is to help users quickly understand codebases, find patterns,
and gather information.
DO NOT make any changes to files or execute any commands that modify state.
Report findings clearly and concisely."#,
    ),
    (
        "plan",
        r#"You are a planning assistant focused on software architecture design.
You can search and analyze code to understand the current architecture.
Your goal is to create detailed execution plans WITHOUT executing them.
For each task:
1. Analyze the current state
2. Research available tools and approaches
3. Create a step-by-step execution plan
4. Explain any risks or considerations

DO NOT execute any actions - only plan and explain."#,
    ),
    (
        "verification",
        r#"You are a verification assistant for adversarial testing.
Your goal is to verify that fixes or implementations are correct and complete.

Your approach:
1. Try to break or invalidate the proposed fix
2. Test edge cases and boundary conditions
3. Look for potential bugs or security issues
4. Check for incomplete implementations

Report your findings clearly:
- If the fix appears correct: Explain why it works
- If the fix has issues: Describe what's wrong and how to improve it

DO NOT make changes - only verify and report."#,
    ),
];

/// Default allowed tool patterns for each agent type
pub const DEFAULT_ALLOWED_TOOLS: &[(&str, &[&str])] = &[
    (
        "general-purpose",
        &["*"], // All tools allowed
    ),
    (
        "explore",
        &[
            "glob", "grep", "read", "batch_get", "batch_search",
            // MCP search tools
            "mcp__filesystem__read_file",
            "mcp__filesystem__list_directory",
            "mcp__search__search",
        ],
    ),
    (
        "plan",
        &[
            "glob", "grep", "read", "batch_get", "batch_search",
            "search", "query",
        ],
    ),
    (
        "verification",
        &[
            "glob", "grep", "read", "batch_get", "batch_search",
            // No execution tools - read only
        ],
    ),
];

/// Default disallowed tool patterns for each agent type
pub const DEFAULT_DISALLOWED_TOOLS: &[(&str, &[&str])] = &[
    (
        "general-purpose",
        &[], // No restrictions
    ),
    (
        "explore",
        &[
            "write", "edit", "delete", "create", "update", "move", "copy",
            "exec", "shell", "run", "spawn", "send",
            "approve", "reject", "submit", "commit",
        ],
    ),
    (
        "plan",
        &[
            "write", "edit", "delete", "create", "update", "move", "copy",
            "exec", "shell", "run", "spawn", "send",
            "approve", "reject", "submit", "commit",
        ],
    ),
    (
        "verification",
        &[
            "write", "edit", "delete", "create", "update", "move", "copy",
            "exec", "shell", "run", "spawn", "send",
            "approve", "reject", "submit", "commit",
            // Additional restrictions for verification
            "test", "deploy", "release",
        ],
    ),
];

/// Configuration for a specific agent type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentTypeConfig {
    /// The agent type
    pub agent_type: BuiltinAgentType,
    /// Custom system prompt (overrides default if set)
    pub system_prompt: Option<String>,
    /// Allowed tool patterns (glob patterns supported)
    pub allowed_tools: Vec<String>,
    /// Disallowed tool patterns (takes precedence over allowed)
    pub disallowed_tools: Vec<String>,
    /// Maximum turns in a single session
    pub max_turns: Option<u32>,
    /// Whether this agent type supports streaming
    pub supports_streaming: bool,
    /// Whether this agent type supports tool execution
    pub supports_execution: bool,
    /// Custom metadata
    pub metadata: Option<serde_json::Value>,
}

impl AgentTypeConfig {
    /// Create a default configuration for the given agent type
    pub fn default_for(agent_type: BuiltinAgentType) -> Self {
        let name = agent_type.name();
        let system_prompt = SYSTEM_PROMPTS
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, p)| p.to_string());

        let allowed_tools = DEFAULT_ALLOWED_TOOLS
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, tools)| tools.iter().map(|s| s.to_string()).collect())
            .unwrap_or_default();

        let disallowed_tools = DEFAULT_DISALLOWED_TOOLS
            .iter()
            .find(|(n, _)| *n == name)
            .map(|(_, tools)| tools.iter().map(|s| s.to_string()).collect())
            .unwrap_or_default();

        Self {
            agent_type,
            system_prompt,
            allowed_tools,
            disallowed_tools,
            max_turns: Some(30),
            supports_streaming: true,
            supports_execution: agent_type.allows_execution(),
            metadata: None,
        }
    }

    /// Get the effective system prompt (custom or default)
    pub fn effective_system_prompt(&self) -> String {
        self.system_prompt.clone().unwrap_or_else(|| {
            SYSTEM_PROMPTS
                .iter()
                .find(|(n, _)| *n == self.agent_type.name())
                .map(|(_, p)| p.to_string())
                .unwrap_or_default()
        })
    }

    /// Get the effective allowed tools (custom or default)
    pub fn effective_allowed_tools(&self) -> HashSet<String> {
        if self.allowed_tools.is_empty() {
            return HashSet::new();
        }
        if self.allowed_tools.contains(&"*".to_string()) {
            return HashSet::from(["*".to_string()]); // Special marker for "all"
        }
        self.allowed_tools.iter().cloned().collect()
    }

    /// Get the disallowed tools set
    pub fn disallowed_tools_set(&self) -> HashSet<String> {
        self.disallowed_tools.iter().cloned().collect()
    }

    /// Check if a tool is allowed by this configuration
    pub fn is_tool_allowed(&self, tool_name: &str) -> bool {
        // Check disallowed list first (takes precedence)
        for pattern in &self.disallowed_tools {
            if glob_match_pattern(pattern, tool_name) {
                return false;
            }
        }

        // Check allowed list
        let allowed = self.effective_allowed_tools();
        if allowed.contains("*") {
            return true; // All tools allowed
        }
        if allowed.is_empty() {
            return false; // No tools allowed
        }

        for pattern in &self.allowed_tools {
            if glob_match_pattern(pattern, tool_name) {
                return true;
            }
        }

        false
    }

    /// Check if this configuration allows any tool
    pub fn allows_any_tool(&self) -> bool {
        !self.allowed_tools.is_empty() || !self.disallowed_tools.is_empty()
    }

    /// Check if this is a read-only configuration
    pub fn is_read_only(&self) -> bool {
        !self.supports_execution
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<(), ConfigValidationError> {
        if self.allowed_tools.is_empty() && self.disallowed_tools.is_empty() {
            return Err(ConfigValidationError::EmptyPermissions {
                agent_type: self.agent_type.name().to_string(),
            });
        }

        // Check for conflicting patterns
        for allowed in &self.allowed_tools {
            for disallowed in &self.disallowed_tools {
                if allowed == disallowed {
                    return Err(ConfigValidationError::ConflictingPatterns {
                        pattern: allowed.clone(),
                    });
                }
            }
        }

        Ok(())
    }
}

/// Default implementations for AgentTypeConfig
impl Default for AgentTypeConfig {
    fn default() -> Self {
        Self::default_for(BuiltinAgentType::GeneralPurpose)
    }
}

/// Configuration validation error
#[derive(Debug, thiserror::Error)]
pub enum ConfigValidationError {
    #[error("Agent type '{agent_type}' has no permission rules")]
    EmptyPermissions { agent_type: String },
    #[error("Conflicting pattern: '{pattern}' appears in both allowed and disallowed lists")]
    ConflictingPatterns { pattern: String },
}

/// Agent configuration registry
#[derive(Debug, Clone, Default)]
pub struct AgentConfigRegistry {
    configs: std::collections::HashMap<BuiltinAgentType, AgentTypeConfig>,
}

impl AgentConfigRegistry {
    /// Create a new registry with default configurations
    pub fn new() -> Self {
        let mut registry = Self {
            configs: std::collections::HashMap::new(),
        };
        for agent_type in BuiltinAgentType::all() {
            registry
                .configs
                .insert(agent_type, AgentTypeConfig::default_for(agent_type));
        }
        registry
    }

    /// Get configuration for a specific agent type
    pub fn get(&self, agent_type: &BuiltinAgentType) -> Option<&AgentTypeConfig> {
        self.configs.get(agent_type)
    }

    /// Set configuration for a specific agent type
    pub fn set(&mut self, config: AgentTypeConfig) -> Option<AgentTypeConfig> {
        self.configs.insert(config.agent_type, config)
    }

    /// Check if a tool is allowed for an agent type
    pub fn is_tool_allowed(&self, agent_type: &BuiltinAgentType, tool_name: &str) -> bool {
        self.get(agent_type)
            .map(|c| c.is_tool_allowed(tool_name))
            .unwrap_or(false)
    }

    /// Get all configured agent types
    pub fn agent_types(&self) -> Vec<BuiltinAgentType> {
        self.configs.keys().cloned().collect()
    }

    /// Validate all configurations
    pub fn validate_all(&self) -> Vec<(BuiltinAgentType, ConfigValidationError)> {
        self.configs
            .iter()
            .filter_map(|(t, c)| c.validate().err().map(|e| (*t, e)))
            .collect()
    }
}

// ============================================================================
// Glob Pattern Matching Utilities
// ============================================================================

/// Simple glob pattern matching for tool names
/// Supports: * (any chars), ? (single char), [abc] (char set)
fn glob_match_pattern(pattern: &str, name: &str) -> bool {
    glob_match_recursive(pattern.chars().peekable(), name.chars().peekable())
}

fn glob_match_recursive(
    mut pattern_chars: std::iter::Peekable<std::str::Chars>,
    mut name_chars: std::iter::Peekable<std::str::Chars>,
) -> bool {
    loop {
        match (pattern_chars.peek(), name_chars.peek()) {
            (None, None) => return true,
            (None, Some(_)) => return false,
            (Some(&'*'), None) => return true,
            (Some(&'*'), Some(_)) => {
                pattern_chars.next();
                // Save current position for backtracking
                let saved_pattern = pattern_chars.clone();
                let saved_name = name_chars.clone();
                
                // Try matching current char
                if glob_match_recursive(pattern_chars.clone(), name_chars.clone()) {
                    return true;
                }
                
                // Try skipping current char (backtrack)
                name_chars.next();
                if glob_match_recursive(saved_pattern, name_chars.clone()) {
                    return true;
                }
                return false;
            }
            (Some(&'?'), Some(_)) => {
                pattern_chars.next();
                name_chars.next();
            }
            (Some(&'['), _) => {
                let name_char = name_chars.peek().copied();
                if !match_character_class(&mut pattern_chars, name_char) {
                    return false;
                }
                name_chars.next();
            }
            (Some(p), Some(n)) if p == n => {
                pattern_chars.next();
                name_chars.next();
            }
            (Some(_), Some(_)) => return false,
            (Some(_), None) => return false,
        }
    }
}

/// Match character class [...]
fn match_character_class(
    pattern_chars: &mut std::iter::Peekable<std::str::Chars>,
    name_char: Option<char>,
) -> bool {
    pattern_chars.next(); // consume '['

    let negated = pattern_chars.peek() == Some(&'^') || pattern_chars.peek() == Some(&'!');
    if negated {
        pattern_chars.next();
    }

    let mut matched = false;
    let mut prev_char: Option<char> = None;

    while let Some(&c) = pattern_chars.peek() {
        if c == ']' && prev_char.is_some() {
            pattern_chars.next();
            break;
        }

        if let Some(nc) = name_char {
            if c == nc {
                matched = true;
            }
            if pattern_chars.peek() == Some(&'-') {
                pattern_chars.next();
                if let Some(&end) = pattern_chars.peek() {
                    if end != ']' {
                        if nc >= c && nc <= end {
                            matched = true;
                        }
                        pattern_chars.next();
                    }
                }
            }
        }
        prev_char = Some(c);
        pattern_chars.next();
    }

    if negated { !matched } else { matched }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config_general_purpose() {
        let config = AgentTypeConfig::default_for(BuiltinAgentType::GeneralPurpose);
        assert_eq!(config.agent_type, BuiltinAgentType::GeneralPurpose);
        assert!(config.supports_execution);
        assert!(config.is_tool_allowed("fs_read"));
        assert!(config.is_tool_allowed("hr_employee_create"));
    }

    #[test]
    fn test_default_config_explore() {
        let config = AgentTypeConfig::default_for(BuiltinAgentType::Explore);
        assert_eq!(config.agent_type, BuiltinAgentType::Explore);
        assert!(!config.supports_execution);
        assert!(config.is_tool_allowed("glob"));
        assert!(config.is_tool_allowed("grep"));
        assert!(!config.is_tool_allowed("fs_write"));
        assert!(!config.is_tool_allowed("fs_delete"));
    }

    #[test]
    fn test_default_config_plan() {
        let config = AgentTypeConfig::default_for(BuiltinAgentType::Plan);
        assert!(!config.supports_execution);
        assert!(config.is_tool_allowed("glob"));
        assert!(config.is_tool_allowed("grep"));
        assert!(!config.is_tool_allowed("fs_write"));
    }

    #[test]
    fn test_default_config_verification() {
        let config = AgentTypeConfig::default_for(BuiltinAgentType::Verification);
        assert!(!config.supports_execution);
        assert!(config.is_tool_allowed("glob"));
        assert!(config.is_tool_allowed("grep"));
        assert!(!config.is_tool_allowed("fs_write"));
        assert!(!config.is_tool_allowed("test"));
    }

    #[test]
    fn test_custom_config() {
        let mut config = AgentTypeConfig::default_for(BuiltinAgentType::Explore);
        config.allowed_tools = vec!["custom_tool*".to_string()];
        config.disallowed_tools = vec!["secret_*".to_string()];

        assert!(config.is_tool_allowed("custom_tool_v1"));
        assert!(!config.is_tool_allowed("custom_tool_v1_secret"));
        assert!(!config.is_tool_allowed("glob"));
    }

    #[test]
    fn test_agent_config_registry() {
        let registry = AgentConfigRegistry::new();

        assert!(registry.is_tool_allowed(&BuiltinAgentType::GeneralPurpose, "fs_write"));
        assert!(registry.is_tool_allowed(&BuiltinAgentType::Explore, "glob"));
        assert!(!registry.is_tool_allowed(&BuiltinAgentType::Explore, "fs_write"));
    }

    #[test]
    fn test_effective_system_prompt() {
        let config = AgentTypeConfig::default_for(BuiltinAgentType::Explore);
        let prompt = config.effective_system_prompt();
        assert!(prompt.contains("read-only"));
    }

    #[test]
    fn test_validation() {
        let mut config = AgentTypeConfig::default_for(BuiltinAgentType::Explore);
        assert!(config.validate().is_ok());

        config.allowed_tools.push("glob".to_string());
        config.disallowed_tools.push("glob".to_string());
        assert!(config.validate().is_err());
    }

    #[test]
    fn test_glob_pattern_star() {
        assert!(glob_match_pattern("custom_*", "custom_tool_v1"));
        assert!(glob_match_pattern("*_tool", "my_tool"));
        assert!(glob_match_pattern("hr_*", "hr_employee_create"));
        assert!(glob_match_pattern("*", "anything"));
        assert!(!glob_match_pattern("custom_*", "other_tool"));
    }

    #[test]
    fn test_glob_pattern_question() {
        assert!(glob_match_pattern("tool_?", "tool_1"));
        assert!(glob_match_pattern("tool_?", "tool_a"));
        assert!(!glob_match_pattern("tool_?", "tool_12"));
    }

    #[test]
    fn test_glob_pattern_character_class() {
        assert!(glob_match_pattern("tool_[abc]", "tool_a"));
        assert!(glob_match_pattern("tool_[abc]", "tool_b"));
        assert!(!glob_match_pattern("tool_[abc]", "tool_d"));
        assert!(glob_match_pattern("file_[!x]", "file_a"));
        assert!(!glob_match_pattern("file_[!x]", "file_x"));
    }
}
