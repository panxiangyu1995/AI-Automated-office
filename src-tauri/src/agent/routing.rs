//! Sub-Agent Routing Module
//!
//! This module implements:
//! - Routing service for keyword, intent, and scenario matching
//! - Delegation decisions based on runtime context
//! - Routing outcomes written into main trace
//! - Standardized input for Sub-Agent execution context
//!
//! Story 52.1 - Sub-Agent routing baseline
//!
//! Agent Mode Constraints (Task 1.4.3, 1.4.4):
//! - Primary agents can be default and handle user requests
//! - Subagents cannot be default and cannot be directly selected by user
//! - Routing to subagents requires explicit delegation from primary agent

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

// Re-export AgentMode for convenience
pub use crate::agent::mode::AgentMode;

/// Routing mode
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RoutingMode {
    Manual,
    Auto,
    Hybrid,
    Yolo,
}

impl std::fmt::Display for RoutingMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RoutingMode::Manual => write!(f, "manual"),
            RoutingMode::Auto => write!(f, "auto"),
            RoutingMode::Hybrid => write!(f, "hybrid"),
            RoutingMode::Yolo => write!(f, "yolo"),
        }
    }
}

/// YOLO mode time-to-live options
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum YoloTtl {
    Once,
    OneHour,
    Today,
    Custom(u64),
}

impl YoloTtl {
    /// Get TTL in seconds
    pub fn to_seconds(&self) -> Option<u64> {
        match self {
            YoloTtl::Once => None,
            YoloTtl::OneHour => Some(3600),
            YoloTtl::Today => {
                // Calculate seconds until midnight
                let now = chrono::Utc::now();
                let midnight = now.date_naive().and_hms_opt(23, 59, 59).unwrap();
                let duration = midnight.signed_duration_since(now.naive_local());
                Some(duration.num_seconds() as u64)
            }
            YoloTtl::Custom(seconds) => Some(*seconds),
        }
    }
}

/// Match strategy
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum MatchStrategy {
    Keyword,
    Semantic,
    Combined,
    LlmGuided,
}

impl std::fmt::Display for MatchStrategy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MatchStrategy::Keyword => write!(f, "keyword"),
            MatchStrategy::Semantic => write!(f, "semantic"),
            MatchStrategy::Combined => write!(f, "combined"),
            MatchStrategy::LlmGuided => write!(f, "llm_guided"),
        }
    }
}

/// Confidence level
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ConfidenceLevel {
    High,
    Medium,
    Low,
}

impl std::fmt::Display for ConfidenceLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfidenceLevel::High => write!(f, "high"),
            ConfidenceLevel::Medium => write!(f, "medium"),
            ConfidenceLevel::Low => write!(f, "low"),
        }
    }
}

/// Sensitivity level for actions
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum SensitivityLevel {
    /// Low risk - auto-execute without confirmation
    Low,
    /// Medium risk - requires single confirmation
    Medium,
    /// High risk - requires double confirmation
    High,
    /// Critical risk - requires explicit approval each time
    Critical,
}

impl SensitivityLevel {
    /// Check if this level requires confirmation
    pub fn requires_confirmation(&self) -> bool {
        matches!(self, SensitivityLevel::Medium | SensitivityLevel::High | SensitivityLevel::Critical)
    }

    /// Check if this level requires double confirmation
    pub fn requires_double_confirmation(&self) -> bool {
        matches!(self, SensitivityLevel::High | SensitivityLevel::Critical)
    }

    /// Check if this level requires manual approval
    pub fn requires_manual_approval(&self) -> bool {
        matches!(self, SensitivityLevel::Critical)
    }

    /// Get threshold score for auto-execution based on mode
    pub fn auto_threshold(&self) -> f64 {
        match self {
            SensitivityLevel::Low => 0.0,
            SensitivityLevel::Medium => 0.3,
            SensitivityLevel::High => 0.6,
            SensitivityLevel::Critical => 0.9,
        }
    }
}

impl std::fmt::Display for SensitivityLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SensitivityLevel::Low => write!(f, "low"),
            SensitivityLevel::Medium => write!(f, "medium"),
            SensitivityLevel::High => write!(f, "high"),
            SensitivityLevel::Critical => write!(f, "critical"),
        }
    }
}

/// Routing rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub match_strategy: MatchStrategy,
    pub keywords: Vec<String>,
    pub semantic_threshold: f64,
    pub priority: i32,
    pub enabled: bool,
    pub fallback_enabled: bool,
}

/// Routing decision
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingDecision {
    pub id: String,
    pub timestamp: i64,
    pub input_preview: String,
    pub matched_rule_id: Option<String>,
    pub matched_rule_name: Option<String>,
    pub selected_sub_agent_id: Option<String>,
    pub selected_sub_agent_name: Option<String>,
    pub routing_mode: RoutingMode,
    pub confidence: Option<ConfidenceLevel>,
    pub confidence_score: Option<f64>,
    pub reasoning: Option<String>,
    pub accepted: Option<bool>,
}

/// Routing outcome record (for trace)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingOutcome {
    pub id: String,
    pub trace_id: String,
    pub session_id: String,
    pub decision_id: String,
    pub rule_id: Option<String>,
    pub sub_agent_id: Option<String>,
    pub routing_mode: RoutingMode,
    pub confidence: Option<f64>,
    pub accepted: Option<bool>,
    pub created_at: i64,
}

/// Sub-agent execution context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentExecutionContext {
    pub sub_agent_id: String,
    pub sub_agent_name: String,
    pub session_id: String,
    pub trace_id: String,
    pub original_input: String,
    pub routing_context: HashMap<String, serde_json::Value>,
    pub constraints: SubAgentConstraints,
}

/// Sub-agent constraints
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubAgentConstraints {
    pub max_steps: i32,
    pub timeout_seconds: i32,
    pub allowed_tools: Vec<String>,
    pub denied_tools: Vec<String>,
    pub permission_scope: String,
}

/// Routing context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingContext {
    pub session_id: String,
    pub trace_id: String,
    pub user_message: String,
    pub intent: Option<String>,
    pub scenario: Option<String>,
    pub tool_name: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Routing result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingResult {
    pub decision: RoutingDecision,
    pub sub_agent_context: Option<SubAgentExecutionContext>,
    pub outcome_record: RoutingOutcome,
}

/// Approval item for Manual mode
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalItem {
    pub id: String,
    pub session_id: String,
    pub trace_id: String,
    pub action_description: String,
    pub action_type: String,
    pub sensitivity_level: SensitivityLevel,
    pub risk_score: f64,
    pub suggested_action: Option<String>,
    pub context: HashMap<String, serde_json::Value>,
    pub created_at: i64,
    pub requires_double_confirm: bool,
    pub first_confirmed: bool,
    pub first_confirmed_at: Option<i64>,
    pub status: ApprovalStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
    Expired,
    Cancelled,
}

/// Confirmation state for anti-misclick
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConfirmationState {
    pub pending_confirmation_id: Option<String>,
    pub first_click_time: Option<i64>,
    pub first_click_action: Option<String>,
    pub confirmation_window_ms: u64,
}

impl Default for ConfirmationState {
    fn default() -> Self {
        Self {
            pending_confirmation_id: None,
            first_click_time: None,
            first_click_action: None,
            confirmation_window_ms: 3000, // 3 seconds default
        }
    }
}

impl ConfirmationState {
    /// Check if a second click is within the confirmation window
    pub fn is_within_window(&self, current_time: i64) -> bool {
        if let (Some(first_time), _) = (self.first_click_time, self.first_click_action.as_ref()) {
            let elapsed = current_time - first_time;
            return elapsed < self.confirmation_window_ms as i64;
        }
        false
    }

    /// Clear the confirmation state
    pub fn clear(&mut self) {
        self.pending_confirmation_id = None;
        self.first_click_time = None;
        self.first_click_action = None;
    }
}

/// Risk evaluation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskEvaluation {
    pub risk_score: f64,
    pub sensitivity_level: SensitivityLevel,
    pub risk_factors: Vec<String>,
    pub recommendation: RiskRecommendation,
    pub can_auto_execute: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RiskRecommendation {
    /// Execute immediately without confirmation
    Execute,
    /// Execute after first confirmation
    ConfirmOnce,
    /// Execute after double confirmation
    ConfirmTwice,
    /// Require manual approval
    ManualApproval,
    /// Block execution
    Block,
}

/// Default routing rules
fn get_default_routing_rules() -> Vec<RoutingRule> {
    vec![
        RoutingRule {
            id: "rule_c1".to_string(),
            name: "文档起草路由".to_string(),
            description: "处理标书、方案、合同和报告起草类请求".to_string(),
            sub_agent_id: "subagent_001".to_string(),
            sub_agent_name: "文档起草助手".to_string(),
            match_strategy: MatchStrategy::Combined,
            keywords: vec![
                "标书".to_string(),
                "方案".to_string(),
                "草案".to_string(),
                "起草".to_string(),
                "模板".to_string(),
            ],
            semantic_threshold: 0.72,
            priority: 10,
            enabled: true,
            fallback_enabled: true,
        },
        RoutingRule {
            id: "rule_c2".to_string(),
            name: "资料整理路由".to_string(),
            description: "处理资料上传、归档、抽取和整理类请求".to_string(),
            sub_agent_id: "subagent_002".to_string(),
            sub_agent_name: "资料整理助手".to_string(),
            match_strategy: MatchStrategy::Keyword,
            keywords: vec![
                "上传".to_string(),
                "归档".to_string(),
                "整理".to_string(),
                "抽取".to_string(),
                "资料".to_string(),
            ],
            semantic_threshold: 0.65,
            priority: 9,
            enabled: true,
            fallback_enabled: true,
        },
        RoutingRule {
            id: "rule_c3".to_string(),
            name: "数据查询路由".to_string(),
            description: "处理数据查询、分析和报表类请求".to_string(),
            sub_agent_id: "subagent_003".to_string(),
            sub_agent_name: "数据分析助手".to_string(),
            match_strategy: MatchStrategy::Combined,
            keywords: vec![
                "查询".to_string(),
                "分析".to_string(),
                "报表".to_string(),
                "统计".to_string(),
                "数据".to_string(),
            ],
            semantic_threshold: 0.70,
            priority: 8,
            enabled: true,
            fallback_enabled: true,
        },
    ]
}

/// Sub-agent routing service
#[derive(Clone)]
pub struct SubAgentRoutingService {
    rules: Arc<RwLock<Vec<RoutingRule>>>,
    outcomes: Arc<RwLock<Vec<RoutingOutcome>>>,
    routing_mode: RoutingMode,
    /// Approval queue for Manual mode
    approval_queue: Arc<RwLock<Vec<ApprovalItem>>>,
    /// Confirmation state for double confirmation anti-misclick
    confirmation_state: Arc<RwLock<ConfirmationState>>,
}

impl SubAgentRoutingService {
    pub fn new() -> Self {
        Self {
            rules: Arc::new(RwLock::new(get_default_routing_rules())),
            outcomes: Arc::new(RwLock::new(Vec::new())),
            routing_mode: RoutingMode::Hybrid,
            approval_queue: Arc::new(RwLock::new(Vec::new())),
            confirmation_state: Arc::new(RwLock::new(ConfirmationState::default())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Set routing mode
    pub fn set_routing_mode(&self, mode: RoutingMode) {
        // Note: In a real implementation, this would modify state
        // For now we just track it in the service
        let _ = mode;
    }

    /// Get all routing rules
    pub async fn get_rules(&self) -> Vec<RoutingRule> {
        self.rules.read().await.clone()
    }

    /// Get enabled routing rules
    pub async fn get_enabled_rules(&self) -> Vec<RoutingRule> {
        self.rules
            .read()
            .await
            .iter()
            .filter(|r| r.enabled)
            .cloned()
            .collect()
    }

    /// Match routing rules against context
    pub async fn match_rules(&self, context: &RoutingContext) -> Vec<RoutingRule> {
        let rules = self.rules.read().await;
        let mut matches: Vec<(RoutingRule, f64)> = Vec::new();

        for rule in rules.iter() {
            if !rule.enabled {
                continue;
            }

            let score = Self::calculate_match_score(&rule, context);

            if score > 0.0 {
                matches.push((rule.clone(), score));
            }
        }

        // Sort by priority then score
        matches.sort_by(|a, b| {
            let priority_cmp = b.0.priority.cmp(&a.0.priority);
            if priority_cmp == std::cmp::Ordering::Equal {
                b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                priority_cmp
            }
        });

        matches.into_iter().map(|(r, _)| r).collect()
    }

    /// Calculate match score for a rule
    fn calculate_match_score(rule: &RoutingRule, context: &RoutingContext) -> f64 {
        match rule.match_strategy {
            MatchStrategy::Keyword => Self::keyword_match(rule, context),
            MatchStrategy::Semantic => {
                // For semantic, we would use embeddings - here we use a simplified scoring
                // In production, this would call an embedding service
                Self::keyword_match(rule, context) * 0.8
            }
            MatchStrategy::Combined => {
                let keyword_score = Self::keyword_match(rule, context);
                let semantic_score = Self::keyword_match(rule, context) * 0.8;
                (keyword_score + semantic_score) / 2.0
            }
            MatchStrategy::LlmGuided => {
                // LLM-guided would call the LLM to determine routing
                // For now, fall back to keyword matching
                Self::keyword_match(rule, context) * 0.6
            }
        }
    }

    /// Keyword-based matching
    fn keyword_match(rule: &RoutingRule, context: &RoutingContext) -> f64 {
        let text = context.user_message.to_lowercase();
        let mut match_count = 0;

        for keyword in &rule.keywords {
            if text.contains(&keyword.to_lowercase()) {
                match_count += 1;
            }
        }

        if match_count == 0 {
            0.0
        } else {
            // Score based on keyword match ratio
            let ratio = match_count as f64 / rule.keywords.len() as f64;
            // Boost by semantic threshold if ratio meets it
            if ratio >= rule.semantic_threshold {
                ratio
            } else {
                ratio * 0.5
            }
        }
    }

    /// Make routing decision
    pub async fn make_decision(&self, context: &RoutingContext) -> RoutingResult {
        let matched_rules = self.match_rules(context).await;

        let decision = if matched_rules.is_empty() {
            // No match - use fallback or main agent
            RoutingDecision {
                id: Self::generate_id("rout"),
                timestamp: Utc::now().timestamp(),
                input_preview: context.user_message.chars().take(50).collect(),
                matched_rule_id: None,
                matched_rule_name: None,
                selected_sub_agent_id: None,
                selected_sub_agent_name: None,
                routing_mode: self.routing_mode.clone(),
                confidence: Some(ConfidenceLevel::Low),
                confidence_score: Some(0.0),
                reasoning: Some("No matching rule found, fallback to main agent".to_string()),
                accepted: None,
            }
        } else {
            // Use highest priority match
            let best_rule = &matched_rules[0];
            let score = Self::calculate_match_score(best_rule, context);

            RoutingDecision {
                id: Self::generate_id("rout"),
                timestamp: Utc::now().timestamp(),
                input_preview: context.user_message.chars().take(50).collect(),
                matched_rule_id: Some(best_rule.id.clone()),
                matched_rule_name: Some(best_rule.name.clone()),
                selected_sub_agent_id: Some(best_rule.sub_agent_id.clone()),
                selected_sub_agent_name: Some(best_rule.sub_agent_name.clone()),
                routing_mode: self.routing_mode.clone(),
                confidence: Some(Self::score_to_confidence(score)),
                confidence_score: Some(score),
                reasoning: Some(format!(
                    "Matched rule '{}' with confidence {:.2}",
                    best_rule.name, score
                )),
                accepted: None,
            }
        };

        // Create sub-agent context if we have a match
        let sub_agent_context = if decision.selected_sub_agent_id.is_some() {
            Some(self.create_sub_agent_context(&decision, context))
        } else {
            None
        };

        // Create outcome record
        let outcome_record = RoutingOutcome {
            id: Self::generate_id("out"),
            trace_id: context.trace_id.clone(),
            session_id: context.session_id.clone(),
            decision_id: decision.id.clone(),
            rule_id: decision.matched_rule_id.clone(),
            sub_agent_id: decision.selected_sub_agent_id.clone(),
            routing_mode: decision.routing_mode.clone(),
            confidence: decision.confidence_score,
            accepted: decision.accepted,
            created_at: Utc::now().timestamp(),
        };

        // Store outcome
        {
            let mut outcomes = self.outcomes.write().await;
            outcomes.push(outcome_record.clone());
        }

        RoutingResult {
            decision,
            sub_agent_context,
            outcome_record,
        }
    }

    /// Create sub-agent execution context
    fn create_sub_agent_context(
        &self,
        decision: &RoutingDecision,
        routing_context: &RoutingContext,
    ) -> SubAgentExecutionContext {
        let sub_agent_id = decision.selected_sub_agent_id.clone().unwrap_or_default();
        let sub_agent_name = decision.selected_sub_agent_name.clone().unwrap_or_default();

        SubAgentExecutionContext {
            sub_agent_id: sub_agent_id.clone(),
            sub_agent_name: sub_agent_name.clone(),
            session_id: routing_context.session_id.clone(),
            trace_id: routing_context.trace_id.clone(),
            original_input: routing_context.user_message.clone(),
            routing_context: HashMap::new(),
            constraints: SubAgentConstraints {
                max_steps: 10,
                timeout_seconds: 300,
                allowed_tools: Vec::new(),
                denied_tools: Vec::new(),
                permission_scope: "limited".to_string(),
            },
        }
    }

    /// Convert score to confidence level
    fn score_to_confidence(score: f64) -> ConfidenceLevel {
        if score >= 0.8 {
            ConfidenceLevel::High
        } else if score >= 0.5 {
            ConfidenceLevel::Medium
        } else {
            ConfidenceLevel::Low
        }
    }

    /// Record routing decision acceptance
    pub async fn record_acceptance(
        &self,
        decision_id: &str,
        accepted: bool,
    ) -> Result<()> {
        let mut outcomes = self.outcomes.write().await;
        if let Some(outcome) = outcomes.iter_mut().find(|o| o.decision_id == decision_id) {
            outcome.accepted = Some(accepted);
        }
        Ok(())
    }

    /// Get routing outcomes by trace
    pub async fn get_outcomes_by_trace(&self, trace_id: &str) -> Vec<RoutingOutcome> {
        self.outcomes
            .read()
            .await
            .iter()
            .filter(|o| o.trace_id == trace_id)
            .cloned()
            .collect()
    }

    /// Get routing outcomes by session
    pub async fn get_outcomes_by_session(&self, session_id: &str) -> Vec<RoutingOutcome> {
        self.outcomes
            .read()
            .await
            .iter()
            .filter(|o| o.session_id == session_id)
            .cloned()
            .collect()
    }

    /// Add a routing rule
    pub async fn add_rule(&self, rule: RoutingRule) -> Result<()> {
        let mut rules = self.rules.write().await;
        rules.push(rule);
        Ok(())
    }

    /// Update a routing rule
    pub async fn update_rule(&self, rule: RoutingRule) -> Result<()> {
        let mut rules = self.rules.write().await;
        if let Some(existing) = rules.iter_mut().find(|r| r.id == rule.id) {
            *existing = rule;
        }
        Ok(())
    }

    /// Delete a routing rule
    pub async fn delete_rule(&self, rule_id: &str) -> Result<()> {
        let mut rules = self.rules.write().await;
        rules.retain(|r| r.id != rule_id);
        Ok(())
    }

    /// Check if main agent path is complete (cannot bypass)
    pub async fn verify_main_agent_path(&self, _session_id: &str) -> bool {
        // In a real implementation, this would check:
        // 1. If the main agent has completed initialization
        // 2. If required context is established
        // 3. If security constraints are satisfied
        // For now, we always return true
        true
    }

    /// Check if routing to a specific subagent is allowed
    ///
    /// Subagents have the following constraints:
    /// - Cannot be set as default agent
    /// - Cannot be directly selected by user
    /// - Can only be routed via explicit delegation from primary agent
    ///
    /// This method checks if a subagent can be used for routing based on context.
    pub fn can_route_to_subagent(&self, _subagent_id: &str, _context: &RoutingContext) -> bool {
        // For now, allow routing to subagents only in Auto and Hybrid modes
        // In Manual mode, user explicitly chooses
        matches!(
            self.routing_mode,
            RoutingMode::Auto | RoutingMode::Hybrid
        )
    }

    /// Get routing constraints for a subagent
    ///
    /// Returns the constraints that should be applied when routing to a subagent.
    pub fn get_routing_constraints(&self, subagent_id: &str) -> SubAgentConstraints {
        // Default constraints for subagent routing
        SubAgentConstraints {
            max_steps: 10,
            timeout_seconds: 300,
            allowed_tools: Vec::new(),
            denied_tools: Vec::new(),
            permission_scope: "limited".to_string(),
        }
    }

    /// Validate routing decision respects mode constraints
    ///
    /// This ensures that:
    /// - Primary agents can be routed to freely
    /// - Subagents can only be routed to via explicit delegation
    pub fn validate_routing_decision(
        &self,
        decision: &RoutingDecision,
        context: &RoutingContext,
    ) -> bool {
        // If no subagent selected, it's always valid (staying with primary)
        if decision.selected_sub_agent_id.is_none() {
            return true;
        }

        // If subagent is selected, verify routing is allowed
        let subagent_id = decision.selected_sub_agent_id.as_ref().unwrap();
        self.can_route_to_subagent(subagent_id, context)
    }

    // =========================================================================
    // Manual Mode: Approval Queue
    // =========================================================================

    /// Add an item to the approval queue (Manual mode)
    pub async fn add_approval_item(&self, item: ApprovalItem) -> Result<()> {
        let mut queue = self.approval_queue.write().await;
        queue.push(item);
        Ok(())
    }

    /// Get all pending approval items
    pub async fn get_pending_approvals(&self) -> Vec<ApprovalItem> {
        self.approval_queue
            .read()
            .await
            .iter()
            .filter(|item| item.status == ApprovalStatus::Pending)
            .cloned()
            .collect()
    }

    /// Approve an item
    pub async fn approve_item(&self, item_id: &str) -> Result<ApprovalItem> {
        let mut queue = self.approval_queue.write().await;
        if let Some(item) = queue.iter_mut().find(|i| i.id == item_id) {
            if item.requires_double_confirm && !item.first_confirmed {
                // First confirmation for double-confirm items
                item.first_confirmed = true;
                item.first_confirmed_at = Some(chrono::Utc::now().timestamp());
                return Ok(item.clone());
            }
            item.status = ApprovalStatus::Approved;
            return Ok(item.clone());
        }
        anyhow::bail!("Approval item not found: {}", item_id)
    }

    /// Reject an item
    pub async fn reject_item(&self, item_id: &str) -> Result<ApprovalItem> {
        let mut queue = self.approval_queue.write().await;
        if let Some(item) = queue.iter_mut().find(|i| i.id == item_id) {
            item.status = ApprovalStatus::Rejected;
            return Ok(item.clone());
        }
        anyhow::bail!("Approval item not found: {}", item_id)
    }

    /// Cancel an approval item
    pub async fn cancel_approval(&self, item_id: &str) -> Result<()> {
        let mut queue = self.approval_queue.write().await;
        if let Some(item) = queue.iter_mut().find(|i| i.id == item_id) {
            item.status = ApprovalStatus::Cancelled;
        }
        Ok(())
    }

    /// Expire old pending items
    pub async fn expire_pending_items(&self, max_age_seconds: i64) -> usize {
        let now = chrono::Utc::now().timestamp();
        let mut queue = self.approval_queue.write().await;
        let before = queue.len();
        queue.retain(|item| {
            if item.status != ApprovalStatus::Pending {
                return true;
            }
            now - item.created_at < max_age_seconds
        });
        before - queue.len()
    }

    // =========================================================================
    // Double Confirmation: Anti-misclick
    // =========================================================================

    /// Start double confirmation for an action
    pub async fn start_confirmation(&self, action_id: String, action_desc: String) -> ConfirmationState {
        let mut state = self.confirmation_state.write().await;
        state.pending_confirmation_id = Some(action_id);
        state.first_click_time = Some(chrono::Utc::now().timestamp());
        state.first_click_action = Some(action_desc);
        state.clone()
    }

    /// Check if confirmation is needed and process second click
    pub async fn confirm_action(&self, action_id: &str) -> Result<bool> {
        let now = chrono::Utc::now().timestamp();
        let mut state = self.confirmation_state.write().await;

        // Check if there's a pending confirmation
        if let Some(pending_id) = &state.pending_confirmation_id {
            if pending_id != action_id {
                // Different action - clear state and require new confirmation
                state.clear();
                return Ok(false);
            }

            // Check if within confirmation window
            if state.is_within_window(now) {
                // Valid second click within window
                state.clear();
                return Ok(true);
            }

            // Outside confirmation window - clear and require re-confirmation
            state.clear();
            return Ok(false);
        }

        Ok(false)
    }

    /// Cancel pending confirmation
    pub async fn cancel_confirmation(&self) {
        let mut state = self.confirmation_state.write().await;
        state.clear();
    }

    /// Get current confirmation state
    pub async fn get_confirmation_state(&self) -> ConfirmationState {
        self.confirmation_state.read().await.clone()
    }

    // =========================================================================
    // Risk Evaluation
    // =========================================================================

    /// Evaluate risk for an action based on context
    pub fn evaluate_risk(&self, action_type: &str, context: &RoutingContext) -> RiskEvaluation {
        let sensitivity = self.classify_action_sensitivity(action_type);
        let risk_score = self.calculate_risk_score(action_type, context);
        let risk_factors = self.identify_risk_factors(action_type, context);
        let recommendation = self.determine_recommendation(&sensitivity, risk_score);
        let can_auto = matches!(recommendation, RiskRecommendation::Execute);

        RiskEvaluation {
            risk_score,
            sensitivity_level: sensitivity,
            risk_factors,
            recommendation,
            can_auto_execute: can_auto,
        }
    }

    /// Classify action sensitivity based on action type
    fn classify_action_sensitivity(&self, action_type: &str) -> SensitivityLevel {
        let critical_keywords = ["delete", "remove", "drop", "destroy", "terminate", "cancel"];
        let high_keywords = ["create", "update", "modify", "edit", "write", "send", "execute"];
        let medium_keywords = ["read", "query", "search", "get", "list", "fetch"];

        let lower_action = action_type.to_lowercase();

        if critical_keywords.iter().any(|k| lower_action.contains(k)) {
            SensitivityLevel::Critical
        } else if high_keywords.iter().any(|k| lower_action.contains(k)) {
            SensitivityLevel::High
        } else if medium_keywords.iter().any(|k| lower_action.contains(k)) {
            SensitivityLevel::Medium
        } else {
            SensitivityLevel::Low
        }
    }

    /// Calculate risk score based on action and context
    fn calculate_risk_score(&self, action_type: &str, context: &RoutingContext) -> f64 {
        let mut score: f64 = 0.0;

        // Base score from action type
        let sensitivity = self.classify_action_sensitivity(action_type);
        match sensitivity {
            SensitivityLevel::Critical => score += 0.9,
            SensitivityLevel::High => score += 0.6,
            SensitivityLevel::Medium => score += 0.3,
            SensitivityLevel::Low => score += 0.1,
        }

        // Increase score for certain keywords in user message
        let msg_lower = context.user_message.to_lowercase();
        let high_risk_patterns = ["all", "批量", "删除", "全部", "every", "批量处理"];
        for pattern in high_risk_patterns {
            if msg_lower.contains(pattern) {
                score = (score + 0.2).min(1.0);
            }
        }

        score
    }

    /// Identify risk factors for the action
    fn identify_risk_factors(&self, action_type: &str, context: &RoutingContext) -> Vec<String> {
        let mut factors = Vec::new();
        let sensitivity = self.classify_action_sensitivity(action_type);

        match sensitivity {
            SensitivityLevel::Critical => factors.push("Critical action - requires explicit approval".to_string()),
            SensitivityLevel::High => factors.push("High-risk action - confirmation required".to_string()),
            SensitivityLevel::Medium => factors.push("Medium-risk action - standard monitoring".to_string()),
            SensitivityLevel::Low => factors.push("Low-risk action - auto-execution allowed".to_string()),
        }

        // Check for batch operations
        let msg_lower = context.user_message.to_lowercase();
        if msg_lower.contains("批量") || msg_lower.contains("batch") || msg_lower.contains("all") {
            factors.push("Batch operation detected - elevated risk".to_string());
        }

        factors
    }

    /// Determine recommendation based on sensitivity and risk score
    fn determine_recommendation(&self, sensitivity: &SensitivityLevel, risk_score: f64) -> RiskRecommendation {
        match sensitivity {
            SensitivityLevel::Critical => RiskRecommendation::ManualApproval,
            SensitivityLevel::High => {
                if risk_score > 0.7 {
                    RiskRecommendation::ManualApproval
                } else if risk_score > 0.5 {
                    RiskRecommendation::ConfirmTwice
                } else {
                    RiskRecommendation::ConfirmOnce
                }
            }
            SensitivityLevel::Medium => {
                if risk_score > 0.5 {
                    RiskRecommendation::ConfirmOnce
                } else {
                    RiskRecommendation::Execute
                }
            }
            SensitivityLevel::Low => RiskRecommendation::Execute,
        }
    }

    // =========================================================================
    // Mode-based Execution Decision
    // =========================================================================

    /// Determine if an action requires confirmation based on current mode
    pub async fn requires_confirmation(&self, action_type: &str, context: &RoutingContext) -> bool {
        let evaluation = self.evaluate_risk(action_type, context);

        match self.routing_mode {
            RoutingMode::Manual => true, // Always require approval in Manual mode
            RoutingMode::Auto => {
                // Auto mode: only confirm for high/critical sensitivity
                evaluation.sensitivity_level.requires_confirmation()
            }
            RoutingMode::Hybrid => {
                // Hybrid mode: confirm based on risk evaluation
                evaluation.recommendation != RiskRecommendation::Execute
            }
            RoutingMode::Yolo => false, // YOLO mode never confirms
        }
    }

    /// Get the routing mode
    #[allow(dead_code)]
    pub fn get_routing_mode(&self) -> RoutingMode {
        self.routing_mode.clone()
    }
}

impl Default for SubAgentRoutingService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_routing_mode_display() {
        assert_eq!(RoutingMode::Manual.to_string(), "manual");
        assert_eq!(RoutingMode::Auto.to_string(), "auto");
        assert_eq!(RoutingMode::Hybrid.to_string(), "hybrid");
    }

    #[test]
    fn test_match_strategy_display() {
        assert_eq!(MatchStrategy::Keyword.to_string(), "keyword");
        assert_eq!(MatchStrategy::Semantic.to_string(), "semantic");
        assert_eq!(MatchStrategy::Combined.to_string(), "combined");
        assert_eq!(MatchStrategy::LlmGuided.to_string(), "llm_guided");
    }

    #[test]
    fn test_confidence_level_display() {
        assert_eq!(ConfidenceLevel::High.to_string(), "high");
        assert_eq!(ConfidenceLevel::Medium.to_string(), "medium");
        assert_eq!(ConfidenceLevel::Low.to_string(), "low");
    }

    #[tokio::test]
    async fn test_default_rules_loaded() {
        let service = SubAgentRoutingService::new();
        let rules = service.get_rules().await;
        assert!(!rules.is_empty());
    }

    #[tokio::test]
    async fn test_keyword_matching() {
        let service = SubAgentRoutingService::new();
        let context = RoutingContext {
            session_id: "test_session".to_string(),
            trace_id: "test_trace".to_string(),
            user_message: "请帮我起草一份标书".to_string(),
            intent: None,
            scenario: None,
            tool_name: None,
            metadata: None,
        };

        let matches = service.match_rules(&context).await;
        assert!(!matches.is_empty());
        assert_eq!(matches[0].id, "rule_c1"); // 文档起草路由
    }

    #[tokio::test]
    async fn test_no_match_fallback() {
        let service = SubAgentRoutingService::new();
        let context = RoutingContext {
            session_id: "test_session".to_string(),
            trace_id: "test_trace".to_string(),
            user_message: "普通聊天消息".to_string(),
            intent: None,
            scenario: None,
            tool_name: None,
            metadata: None,
        };

        let result = service.make_decision(&context).await;
        assert!(result.decision.matched_rule_id.is_none());
        assert!(result.decision.selected_sub_agent_id.is_none());
    }

    #[tokio::test]
    async fn test_score_to_confidence() {
        assert_eq!(
            SubAgentRoutingService::score_to_confidence(0.9),
            ConfidenceLevel::High
        );
        assert_eq!(
            SubAgentRoutingService::score_to_confidence(0.6),
            ConfidenceLevel::Medium
        );
        assert_eq!(
            SubAgentRoutingService::score_to_confidence(0.3),
            ConfidenceLevel::Low
        );
    }
}
