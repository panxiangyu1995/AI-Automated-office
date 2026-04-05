//! Orchestrator Configuration
//!
//! Provides configuration for the Orchestrator Agent.

use serde::{Deserialize, Serialize};

use crate::agent::subagent::types::{ModelConfig, ModelProvider};

/// Orchestrator configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorConfig {
    /// Agent name
    pub name: String,
    /// Display name
    pub display_name: String,
    /// Model configuration
    pub models: ModelConfig,
    /// Maximum parallel delegations
    pub max_parallel: u32,
    /// Maximum orchestration depth
    pub max_depth: u32,
    /// Default timeout in seconds
    pub default_timeout_seconds: u64,
}

impl Default for OrchestratorConfig {
    fn default() -> Self {
        Self {
            name: "orchestrator".to_string(),
            display_name: "编排助手".to_string(),
            models: ModelConfig {
                primary: ModelProvider {
                    provider: "anthropic".to_string(),
                    model_id: "claude-sonnet-4-5".to_string(),
                    temperature: 0.7,
                    max_tokens: 8192,
                },
                light: None,
                small: None,
            },
            max_parallel: 5,
            max_depth: 3,
            default_timeout_seconds: 300,
        }
    }
}

/// Orchestrator permission configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrchestratorPermissions {
    /// Allowed tools (read and delegate only)
    pub allowed_tools: Vec<String>,
    /// Denied tools (write operations)
    pub denied_tools: Vec<String>,
}

impl Default for OrchestratorPermissions {
    fn default() -> Self {
        Self {
            allowed_tools: vec![
                "read".to_string(),
                "grep".to_string(),
                "glob".to_string(),
                "list".to_string(),
                "web_search".to_string(),
                "web_fetch".to_string(),
                "question".to_string(),
                "task".to_string(),
                "delegate".to_string(),
            ],
            denied_tools: vec![
                "write".to_string(),
                "edit".to_string(),
                "bash".to_string(),
                "hr_mutate".to_string(),
                "sales_mutate".to_string(),
                "finance_mutate".to_string(),
                "warehouse_mutate".to_string(),
                "delete".to_string(),
                "create".to_string(),
            ],
        }
    }
}

impl OrchestratorConfig {
    /// Create a new config with custom settings
    pub fn new(
        name: String,
        display_name: String,
        max_parallel: u32,
        max_depth: u32,
    ) -> Self {
        Self {
            name,
            display_name,
            models: ModelConfig::default(),
            max_parallel,
            max_depth,
            default_timeout_seconds: 300,
        }
    }

    /// Set model configuration
    pub fn with_model(mut self, provider: String, model_id: String) -> Self {
        self.models.primary = ModelProvider {
            provider,
            model_id,
            temperature: 0.7,
            max_tokens: 8192,
        };
        self
    }

    /// Set timeout
    pub fn with_timeout(mut self, seconds: u64) -> Self {
        self.default_timeout_seconds = seconds;
        self
    }
}
