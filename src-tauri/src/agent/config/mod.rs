//! Agent Configuration Module
//!
//! Handles loading agent configurations from Markdown + YAML front matter files.
//!
//! File format:
//! ```markdown
//! ---
//! name: office-general
//! mode: primary
//! description: 通用办公助手
//! permission:
//!   department: ask
//!   document: allow
//! ---
//!
//! # Agent Prompt
//!
//! This is the agent's system prompt...
//! ```
//!
//! See spec: openspec/changes/subagent-architecture-alignment/specs/subagent-config-file/spec.md

pub mod loader;
pub mod merge;

pub use loader::{AgentConfig, AgentConfigLoader, ConfigLoadError};
pub use merge::{ConfigMerger, MergePriority, MergeResult};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_struct_creation() {
        let config = AgentConfig {
            name: "test-agent".to_string(),
            mode: "primary".to_string(),
            description: "Test agent".to_string(),
            prompt: "You are a test agent.".to_string(),
            skills: vec!["conversation".to_string()],
            tools: vec!["department_query".to_string()],
            mcp_tools: vec![],
            permissions: Default::default(),
            options: Default::default(),
        };

        assert_eq!(config.name, "test-agent");
        assert_eq!(config.mode, "primary");
    }
}
