//! Sub-Agent Routing - Type Definitions and Rules

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
                // 计算到午夜剩余秒数
                let now = chrono::Utc::now();
                let midnight = now.date_naive().and_hms_opt(23, 59, 59)?;
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
pub fn get_default_routing_rules() -> Vec<RoutingRule> {
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

