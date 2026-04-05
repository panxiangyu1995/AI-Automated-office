//! Model Router
//!
//! Routes tasks to appropriate models based on complexity and requirements.

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::agent::subagent::types::ModelProvider;

/// Task complexity levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskComplexity {
    /// Simple tasks: OCR, simple queries, intent classification
    Simple,
    /// Medium tasks: general queries, standard operations
    Medium,
    /// Complex tasks: report generation, multi-step reasoning, cross-department
    Complex,
    /// No-tool tasks: title generation, summarization, compression
    NoTool,
}

impl TaskComplexity {
    /// Get complexity score (0-100)
    pub fn score(&self) -> u8 {
        match self {
            TaskComplexity::Simple => 20,
            TaskComplexity::Medium => 50,
            TaskComplexity::Complex => 80,
            TaskComplexity::NoTool => 10,
        }
    }
}

/// Task context for model selection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskContext {
    /// Task name or tool being executed
    pub tool_name: Option<String>,
    /// List of tools required
    pub tools: Vec<String>,
    /// Intent type
    pub intent: String,
    /// Subagent type (if any)
    pub subagent: Option<String>,
    /// Message length in characters
    pub message_length: usize,
    /// Whether it's a system task
    pub is_system_task: bool,
    /// Priority level
    pub priority: u8,
}

impl Default for TaskContext {
    fn default() -> Self {
        Self {
            tool_name: None,
            tools: Vec::new(),
            intent: "general".to_string(),
            subagent: None,
            message_length: 0,
            is_system_task: false,
            priority: 5,
        }
    }
}

/// Model selection rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelSelectionRule {
    /// Rule name
    pub name: String,
    /// Conditions that trigger this rule
    pub conditions: Vec<SelectionCondition>,
    /// Target model type
    pub model_type: ModelType,
    /// Temperature override
    pub temperature: Option<f32>,
}

/// Selection conditions
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SelectionCondition {
    /// Match by tool name
    Tool { name: String },
    /// Match by intent
    Intent { intent: String },
    /// Match by subagent type
    Subagent { subagent: String },
    /// Match when no tools required
    NoTools,
    /// Match by message length range
    MessageLength { min: usize, max: usize },
    /// Match by system task
    SystemTask,
    /// Match by priority
    Priority { min: u8 },
}

/// Model types
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
    /// Primary model for general tasks
    Primary,
    /// Light/fast model for simple tasks
    Light,
    /// Small model for no-tool tasks
    Small,
}

impl ModelType {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelType::Primary => "primary",
            ModelType::Light => "light",
            ModelType::Small => "small",
        }
    }
}

/// Model router configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelRouterConfig {
    /// Primary model configuration
    pub primary: ModelProvider,
    /// Light model configuration
    pub light: ModelProvider,
    /// Small model configuration
    pub small: ModelProvider,
    /// Custom selection rules
    pub rules: Vec<ModelSelectionRule>,
    /// Default model type
    pub default_model: ModelType,
}

impl Default for ModelRouterConfig {
    fn default() -> Self {
        Self {
            primary: ModelProvider {
                provider: "openai".to_string(),
                model_id: "gpt-4o".to_string(),
                temperature: 0.7,
                max_tokens: 4096,
            },
            light: ModelProvider {
                provider: "anthropic".to_string(),
                model_id: "claude-haiku-4-5".to_string(),
                temperature: 0.3,
                max_tokens: 4096,
            },
            small: ModelProvider {
                provider: "anthropic".to_string(),
                model_id: "claude-haiku-4-5".to_string(),
                temperature: 0.5,
                max_tokens: 1024,
            },
            rules: Vec::new(),
            default_model: ModelType::Primary,
        }
    }
}

/// Model router
pub struct ModelRouter {
    config: ModelRouterConfig,
}

impl ModelRouter {
    /// Create a new model router
    pub fn new(config: ModelRouterConfig) -> Self {
        Self { config }
    }

    /// Create with default configuration
    pub fn default_router() -> Self {
        Self::new(ModelRouterConfig::default())
    }

    /// Select model based on task context
    pub fn select_model(&self, context: &TaskContext) -> ModelProvider {
        // 1. Check custom rules first
        if let Some(rule) = self.find_matching_rule(context) {
            let base_model = self.get_model_by_type(&rule.model_type);
            
            // Apply temperature override if specified
            if let Some(temp) = rule.temperature {
                let mut model = base_model.clone();
                model.temperature = temp;
                return model;
            }
            
            return base_model;
        }

        // 2. Evaluate complexity and select model
        let complexity = self.evaluate_complexity(context);
        let model_type = self.complexity_to_model_type(&complexity);
        
        self.get_model_by_type(&model_type)
    }

    /// Evaluate task complexity
    pub fn evaluate_complexity(&self, context: &TaskContext) -> TaskComplexity {
        // Simple tasks: OCR, simple queries, intent classification
        if let Some(ref tool) = context.tool_name {
            let simple_tools = [
                "finance_ocr",
                "finance_ocr_scan",
                "title",
                "summary",
                "classification",
            ];
            
            if simple_tools.iter().any(|t| tool.contains(t)) {
                return TaskComplexity::Simple;
            }
        }

        // No-tool tasks: title generation, summarization, compression
        if context.tools.is_empty() || context.is_system_task {
            return TaskComplexity::NoTool;
        }

        // Complex tasks: reports, analysis, cross-department coordination
        let complex_intents = [
            "report",
            "analysis",
            "cross_department",
            "finance_report",
            "sales_aggregate",
        ];
        
        if complex_intents.iter().any(|i| context.intent.contains(i)) {
            return TaskComplexity::Complex;
        }

        // Check for orchestrator subagent
        if let Some(ref subagent) = context.subagent {
            if subagent == "orchestrator" {
                return TaskComplexity::Complex;
            }
        }

        // Check for multi-step tasks
        if context.tools.len() > 5 {
            return TaskComplexity::Complex;
        }

        // Default to medium
        TaskComplexity::Medium
    }

    /// Convert complexity to model type
    fn complexity_to_model_type(&self, complexity: &TaskComplexity) -> ModelType {
        match complexity {
            TaskComplexity::Simple => ModelType::Light,
            TaskComplexity::Medium => ModelType::Primary,
            TaskComplexity::Complex => ModelType::Primary,
            TaskComplexity::NoTool => ModelType::Small,
        }
    }

    /// Get model by type
    fn get_model_by_type(&self, model_type: &ModelType) -> ModelProvider {
        match model_type {
            ModelType::Primary => self.config.primary.clone(),
            ModelType::Light => self.config.light.clone(),
            ModelType::Small => self.config.small.clone(),
        }
    }

    /// Find matching rule
    fn find_matching_rule(&self, context: &TaskContext) -> Option<&ModelSelectionRule> {
        for rule in &self.config.rules {
            if self.rule_matches(rule, context) {
                return Some(rule);
            }
        }
        None
    }

    /// Check if rule matches context
    fn rule_matches(&self, rule: &ModelSelectionRule, context: &TaskContext) -> bool {
        for condition in &rule.conditions {
            if !self.condition_matches(condition, context) {
                return false;
            }
        }
        true
    }

    /// Check if single condition matches
    fn condition_matches(&self, condition: &SelectionCondition, context: &TaskContext) -> bool {
        match condition {
            SelectionCondition::Tool { name } => {
                context.tool_name.as_ref().map_or(false, |t| t.contains(name))
            }
            SelectionCondition::Intent { intent } => {
                context.intent.contains(intent)
            }
            SelectionCondition::Subagent { subagent } => {
                context.subagent.as_ref().map_or(false, |s| s.contains(subagent))
            }
            SelectionCondition::NoTools => {
                context.tools.is_empty()
            }
            SelectionCondition::MessageLength { min, max } => {
                context.message_length >= *min && context.message_length <= *max
            }
            SelectionCondition::SystemTask => {
                context.is_system_task
            }
            SelectionCondition::Priority { min } => {
                context.priority >= *min
            }
        }
    }

    /// Register a custom rule
    pub fn register_rule(&mut self, rule: ModelSelectionRule) {
        self.config.rules.push(rule);
    }

    /// Get model provider configuration
    pub fn get_config(&self) -> &ModelRouterConfig {
        &self.config
    }

    /// Update configuration
    pub fn update_config(&mut self, config: ModelRouterConfig) {
        self.config = config;
    }
}

impl Default for ModelRouter {
    fn default() -> Self {
        Self::default_router()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_task_routing() {
        let router = ModelRouter::default_router();
        
        let context = TaskContext {
            tool_name: Some("finance_ocr".to_string()),
            tools: vec!["finance_ocr_scan".to_string()],
            intent: "ocr".to_string(),
            ..Default::default()
        };
        
        let model = router.select_model(&context);
        assert_eq!(model.provider, "anthropic");
    }

    #[test]
    fn test_complex_task_routing() {
        let router = ModelRouter::default_router();
        
        let context = TaskContext {
            tool_name: None,
            tools: vec!["tool1".to_string(), "tool2".to_string(), "tool3".to_string()],
            intent: "report".to_string(),
            ..Default::default()
        };
        
        let model = router.select_model(&context);
        assert_eq!(model.provider, "openai");
    }

    #[test]
    fn test_no_tool_routing() {
        let router = ModelRouter::default_router();
        
        let context = TaskContext {
            tool_name: Some("title".to_string()),
            tools: vec![],
            intent: "title".to_string(),
            is_system_task: true,
            ..Default::default()
        };
        
        let model = router.select_model(&context);
        assert_eq!(model.max_tokens, 1024);
    }

    #[test]
    fn test_complexity_evaluation() {
        let router = ModelRouter::default_router();
        
        let simple = TaskContext {
            tool_name: Some("finance_ocr".to_string()),
            ..Default::default()
        };
        assert_eq!(router.evaluate_complexity(&simple), TaskComplexity::Simple);
        
        let complex = TaskContext {
            tools: vec!["t1".to_string(), "t2".to_string(), "t3".to_string(), "t4".to_string(), "t5".to_string(), "t6".to_string()],
            intent: "general".to_string(),
            ..Default::default()
        };
        assert_eq!(router.evaluate_complexity(&complex), TaskComplexity::Complex);
    }
}
