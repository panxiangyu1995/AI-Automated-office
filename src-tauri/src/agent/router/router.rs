//! Intent Router
//!
//! Routes intents to appropriate subagents based on:
//! - Intent classification results
//! - User permissions
//! - Subagent availability
//! - Model selection

use std::sync::Arc;
use std::collections::HashMap;
use serde::{Deserialize, Serialize};

use super::{IntentResult, RoutingError, SubagentType};
use crate::agent::subagent::manager::SubagentManager;

/// Model provider types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ModelProvider {
    Haiku,    // Light/fast model
    Sonnet,   // Medium model
    Opus,     // Heavy/powerful model
}

impl ModelProvider {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelProvider::Haiku => "haiku",
            ModelProvider::Sonnet => "sonnet",
            ModelProvider::Opus => "opus",
        }
    }
}

/// Route decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteDecision {
    /// Target subagent type
    pub target: SubagentType,
    /// Target subagent name (if specific)
    pub target_name: Option<String>,
    /// Selected model
    pub model: ModelProvider,
    /// Delegation constraints
    pub constraints: DelegationConstraints,
}

impl RouteDecision {
    /// Create a new route decision
    pub fn new(target: SubagentType) -> Self {
        Self {
            target: target.clone(),
            target_name: None,
            model: ModelProvider::Sonnet,
            constraints: DelegationConstraints::default(),
        }
    }

    /// Set target name
    pub fn with_target_name(mut self, name: String) -> Self {
        self.target_name = Some(name);
        self
    }

    /// Set model
    pub fn with_model(mut self, model: ModelProvider) -> Self {
        self.model = model;
        self
    }

    /// Set constraints
    pub fn with_constraints(mut self, constraints: DelegationConstraints) -> Self {
        self.constraints = constraints;
        self
    }
}

/// Delegation constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegationConstraints {
    /// Maximum execution time in seconds
    pub timeout_seconds: u64,
    /// Maximum tool calls
    pub max_tool_calls: u32,
    /// Allowed tools (empty = all)
    pub allowed_tools: Vec<String>,
    /// Denied tools
    pub denied_tools: Vec<String>,
    /// Data scope
    pub data_scope: DataScope,
    /// Whether to include context
    pub include_context: bool,
}

impl Default for DelegationConstraints {
    fn default() -> Self {
        Self {
            timeout_seconds: 300, // 5 minutes
            max_tool_calls: 100,
            allowed_tools: vec![],
            denied_tools: vec![],
            data_scope: DataScope::Department,
            include_context: true,
        }
    }
}

/// Data scope for delegation
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DataScope {
    Personal,
    Department,
    All,
    Executive,
}

impl Default for DataScope {
    fn default() -> Self {
        Self::Department
    }
}

/// Execution context for routing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionContext {
    /// User ID
    pub user_id: String,
    /// Tenant ID
    pub tenant_id: String,
    /// User roles
    pub roles: Vec<String>,
    /// Department ID
    pub department_id: Option<String>,
    /// User permissions
    pub permissions: Vec<String>,
}

impl Default for ExecutionContext {
    fn default() -> Self {
        Self {
            user_id: "anonymous".to_string(),
            tenant_id: "default".to_string(),
            roles: vec!["guest".to_string()],
            department_id: None,
            permissions: vec![],
        }
    }
}

/// Intent router
pub struct IntentRouter {
    subagent_manager: Arc<SubagentManager>,
    routing_table: HashMap<String, RouteRule>,
}

#[derive(Clone)]
struct RouteRule {
    target: SubagentType,
    required_permissions: Vec<String>,
    model: ModelProvider,
    constraints: DelegationConstraints,
}

impl IntentRouter {
    /// Create a new intent router
    pub fn new(subagent_manager: Arc<SubagentManager>) -> Self {
        let mut router = Self {
            subagent_manager,
            routing_table: HashMap::new(),
        };
        
        // Register default routing rules
        router.register_default_rules();
        
        router
    }

    /// Register a routing rule
    pub fn register_rule(&mut self, intent: String, rule: RouteRule) {
        self.routing_table.insert(intent, rule);
    }

    /// Route an intent to appropriate subagent
    pub async fn route(
        &self,
        intent: &IntentResult,
        context: &ExecutionContext,
    ) -> Result<RouteDecision, RoutingError> {
        tracing::info!("Routing intent: {} (confidence: {})", intent.intent, intent.confidence);

        // 1. Find matching route rule
        let rule = self.routing_table.get(&intent.intent)
            .cloned()
            .ok_or_else(|| RoutingError::NoMatchingSubagent(intent.intent.clone()))?;

        // 2. Check permissions
        if !self.has_permission(context, &rule.required_permissions) {
            return Err(RoutingError::PermissionDenied(intent.intent.clone()));
        }

        // 3. Check subagent availability
        let target_name = self.find_available_subagent(&rule.target, context).await?;

        // 4. Build route decision
        let mut decision = RouteDecision::new(rule.target)
            .with_model(rule.model)
            .with_constraints(rule.constraints);

        if let Some(name) = target_name {
            decision = decision.with_target_name(name);
        }

        tracing::info!("Route decision: {:?} with model {:?}", decision.target, decision.model);

        Ok(decision)
    }

    /// Check if user has required permissions
    fn has_permission(&self, context: &ExecutionContext, required: &[String]) -> bool {
        if required.is_empty() {
            return true;
        }
        
        required.iter().all(|perm| context.permissions.contains(perm))
    }

    /// Find an available subagent of the given type
    async fn find_available_subagent(
        &self,
        target: &SubagentType,
        context: &ExecutionContext,
    ) -> Result<Option<String>, RoutingError> {
        // In a real implementation, this would query the subagent manager
        // For now, return a default name based on target type
        let default_name = format!("{}-agent", target.as_str());
        
        // Check if subagent exists and is available
        // (simplified for now)
        Ok(Some(default_name))
    }

    /// Select model based on intent and complexity
    pub fn select_model(&self, intent: &IntentResult) -> ModelProvider {
        // Use lightweight model for simple OCR tasks
        if intent.intent.contains("ocr") {
            return ModelProvider::Haiku;
        }
        
        // Use heavy model for complex cross-department tasks
        if intent.intent.contains("cross") || intent.intent.contains("report") {
            return ModelProvider::Opus;
        }
        
        // Default to medium model
        ModelProvider::Sonnet
    }

    /// Register default routing rules
    fn register_default_rules(&mut self) {
        let rules = vec![
            ("finance.ocr", RouteRule {
                target: SubagentType::Finance,
                required_permissions: vec!["finance_ocr".to_string()],
                model: ModelProvider::Haiku,
                constraints: DelegationConstraints {
                    timeout_seconds: 60,
                    max_tool_calls: 10,
                    allowed_tools: vec!["finance_ocr_scan".to_string(), "finance_document_parse".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("finance.query", RouteRule {
                target: SubagentType::Finance,
                required_permissions: vec!["finance_query".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 120,
                    max_tool_calls: 20,
                    allowed_tools: vec!["finance_query".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("finance.report", RouteRule {
                target: SubagentType::Finance,
                required_permissions: vec!["finance_aggregate".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 300,
                    max_tool_calls: 50,
                    allowed_tools: vec!["finance_aggregate".to_string(), "finance_query".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Executive,
                    include_context: true,
                },
            }),
            ("sales.order", RouteRule {
                target: SubagentType::Sales,
                required_permissions: vec!["sales_query".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 120,
                    max_tool_calls: 20,
                    allowed_tools: vec!["sales_create_order".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("sales.query", RouteRule {
                target: SubagentType::Sales,
                required_permissions: vec!["sales_query".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 120,
                    max_tool_calls: 20,
                    allowed_tools: vec!["sales_query".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("hr.onboard", RouteRule {
                target: SubagentType::Hr,
                required_permissions: vec!["hr_mutate".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 180,
                    max_tool_calls: 30,
                    allowed_tools: vec!["hr_create_employee".to_string(), "hr_setup_account".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("hr.query", RouteRule {
                target: SubagentType::Hr,
                required_permissions: vec!["hr_query".to_string()],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 120,
                    max_tool_calls: 20,
                    allowed_tools: vec!["hr_query".to_string()],
                    denied_tools: vec![],
                    data_scope: DataScope::Department,
                    include_context: true,
                },
            }),
            ("cross.department", RouteRule {
                target: SubagentType::Orchestrator,
                required_permissions: vec![],
                model: ModelProvider::Opus,
                constraints: DelegationConstraints {
                    timeout_seconds: 600,
                    max_tool_calls: 100,
                    allowed_tools: vec![],
                    denied_tools: vec![],
                    data_scope: DataScope::All,
                    include_context: true,
                },
            }),
            ("general.query", RouteRule {
                target: SubagentType::Primary,
                required_permissions: vec![],
                model: ModelProvider::Sonnet,
                constraints: DelegationConstraints {
                    timeout_seconds: 60,
                    max_tool_calls: 10,
                    allowed_tools: vec![],
                    denied_tools: vec![],
                    data_scope: DataScope::Personal,
                    include_context: true,
                },
            }),
        ];

        for (intent, rule) in rules {
            self.register_rule(intent.to_string(), rule);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_model_selection() {
        // This would need actual SubagentManager mock
    }
}
