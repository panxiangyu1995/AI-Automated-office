//! Correction Rule Module
//!
//! This module implements:
//! - Correction rule read and match capability
//! - Rule suggestions injection into planner/runtime
//! - Rule hits linking to failure and audit records
//! - Reviewable improvement suggestions output
//!
//! Story 53.3 - Controlled correction-rule baseline

use anyhow::Result;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Correction status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CorrectionStatus {
    Active,
    Inactive,
    Deprecated,
    Testing,
}

impl std::fmt::Display for CorrectionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CorrectionStatus::Active => write!(f, "active"),
            CorrectionStatus::Inactive => write!(f, "inactive"),
            CorrectionStatus::Deprecated => write!(f, "deprecated"),
            CorrectionStatus::Testing => write!(f, "testing"),
        }
    }
}

/// Rule category
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RuleCategory {
    OutputFormat,
    ContentAccuracy,
    Behavior,
    Safety,
    Performance,
}

impl std::fmt::Display for RuleCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RuleCategory::OutputFormat => write!(f, "output_format"),
            RuleCategory::ContentAccuracy => write!(f, "content_accuracy"),
            RuleCategory::Behavior => write!(f, "behavior"),
            RuleCategory::Safety => write!(f, "safety"),
            RuleCategory::Performance => write!(f, "performance"),
        }
    }
}

/// Trigger type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TriggerType {
    Keyword,
    Pattern,
    Context,
    ToolOutput,
}

impl std::fmt::Display for TriggerType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TriggerType::Keyword => write!(f, "keyword"),
            TriggerType::Pattern => write!(f, "pattern"),
            TriggerType::Context => write!(f, "context"),
            TriggerType::ToolOutput => write!(f, "tool_output"),
        }
    }
}

/// Application scope
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ApplicationScope {
    Global,
    User,
    Session,
    Tool,
}

impl std::fmt::Display for ApplicationScope {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApplicationScope::Global => write!(f, "global"),
            ApplicationScope::User => write!(f, "user"),
            ApplicationScope::Session => write!(f, "session"),
            ApplicationScope::Tool => write!(f, "tool"),
        }
    }
}

/// Correction case
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrectionCase {
    pub id: String,
    pub original_output: String,
    pub corrected_output: String,
    pub correction_reason: String,
    pub tool_name: Option<String>,
    pub session_id: String,
    pub timestamp: i64,
    pub user_id: String,
    pub extracted_rules: Vec<String>,
}

/// Learning correction rule
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningCorrectionRule {
    pub id: String,
    pub name: String,
    pub description: String,
    pub category: RuleCategory,
    pub trigger_type: TriggerType,
    pub trigger_condition: String,
    pub correction_action: String,
    pub status: CorrectionStatus,
    pub scope: ApplicationScope,
    pub priority: i32,
    pub success_rate: f64,
    pub applications_count: i64,
    pub source_case_id: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub created_by: String,
    pub tags: Vec<String>,
}

/// Rule statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleStats {
    pub total_rules: i64,
    pub active_rules: i64,
    pub total_corrections: i64,
    pub avg_success_rate: f64,
    pub by_category: HashMap<String, i64>,
    pub by_status: HashMap<String, i64>,
    pub recent_applications: i64,
    pub top_rules: Vec<RuleApplicationCount>,
}

/// Rule application count
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleApplicationCount {
    pub rule_id: String,
    pub name: String,
    pub applications: i64,
}

/// Rule match result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleMatch {
    pub rule_id: String,
    pub rule_name: String,
    pub category: RuleCategory,
    pub trigger_type: TriggerType,
    pub trigger_condition: String,
    pub correction_action: String,
    pub confidence: f64,
    pub match_context: String,
    pub priority: i32,
}

/// Rule suggestion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleSuggestion {
    pub id: String,
    pub rule_id: String,
    pub rule_name: String,
    pub category: RuleCategory,
    pub correction_action: String,
    pub priority: i32,
    pub reason: String,
    pub requires_human_review: bool,
    pub session_id: String,
    pub trace_id: String,
    pub created_at: i64,
}

/// Rule hit record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleHitRecord {
    pub id: String,
    pub rule_id: String,
    pub session_id: String,
    pub trace_id: String,
    pub match_context: String,
    pub applied: bool,
    pub review_status: String,
    pub created_at: i64,
}

/// Context for rule matching
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleMatchContext {
    pub session_id: String,
    pub trace_id: String,
    pub tool_name: Option<String>,
    pub tool_output: Option<String>,
    pub user_message: Option<String>,
    pub agent_response: Option<String>,
    pub error_message: Option<String>,
    pub metadata: Option<serde_json::Value>,
}

/// Default correction rules
fn get_default_correction_rules() -> Vec<LearningCorrectionRule> {
    let now = Utc::now().timestamp();

    vec![
        LearningCorrectionRule {
            id: "rule_output_detail".to_string(),
            name: "详细输出规则".to_string(),
            description: "当提供方案建议时，必须包含具体实施步骤".to_string(),
            category: RuleCategory::OutputFormat,
            trigger_type: TriggerType::Keyword,
            trigger_condition: "建议|方案|推荐".to_string(),
            correction_action: "添加详细实施步骤和预期结果".to_string(),
            status: CorrectionStatus::Active,
            scope: ApplicationScope::Global,
            priority: 1,
            success_rate: 0.92,
            applications_count: 156,
            source_case_id: None,
            created_at: now - 86400 * 30,
            updated_at: now - 3600,
            created_by: "system".to_string(),
            tags: vec!["输出格式".to_string(), "详细性".to_string()],
        },
        LearningCorrectionRule {
            id: "rule_error_info".to_string(),
            name: "错误信息增强规则".to_string(),
            description: "错误信息应包含问题描述和解决方案建议".to_string(),
            category: RuleCategory::ContentAccuracy,
            trigger_type: TriggerType::Pattern,
            trigger_condition: "(error|错误|失败)".to_string(),
            correction_action: "添加问题分析和解决方案建议".to_string(),
            status: CorrectionStatus::Active,
            scope: ApplicationScope::Global,
            priority: 2,
            success_rate: 0.88,
            applications_count: 89,
            source_case_id: None,
            created_at: now - 86400 * 15,
            updated_at: now - 86400,
            created_by: "system".to_string(),
            tags: vec!["错误处理".to_string(), "用户体验".to_string()],
        },
        LearningCorrectionRule {
            id: "rule_exec_result".to_string(),
            name: "执行结果详情规则".to_string(),
            description: "工具执行结果应包含详细的操作记录".to_string(),
            category: RuleCategory::OutputFormat,
            trigger_type: TriggerType::ToolOutput,
            trigger_condition: "shell_execute|fs_*".to_string(),
            correction_action: "列出所有执行的操作和结果".to_string(),
            status: CorrectionStatus::Active,
            scope: ApplicationScope::Tool,
            priority: 3,
            success_rate: 0.95,
            applications_count: 234,
            source_case_id: None,
            created_at: now - 86400 * 20,
            updated_at: now - 86400 * 2,
            created_by: "system".to_string(),
            tags: vec!["工具输出".to_string(), "透明性".to_string()],
        },
    ]
}

/// Correction rule service
#[derive(Clone)]
pub struct CorrectionRuleService {
    rules: Arc<RwLock<Vec<LearningCorrectionRule>>>,
    hit_records: Arc<RwLock<Vec<RuleHitRecord>>>,
}

impl CorrectionRuleService {
    pub fn new() -> Self {
        Self {
            rules: Arc::new(RwLock::new(get_default_correction_rules())),
            hit_records: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Get all rules
    pub async fn get_rules(&self) -> Vec<LearningCorrectionRule> {
        self.rules.read().await.clone()
    }

    /// Get active rules
    pub async fn get_active_rules(&self) -> Vec<LearningCorrectionRule> {
        self.rules
            .read()
            .await
            .iter()
            .filter(|r| r.status == CorrectionStatus::Active)
            .cloned()
            .collect()
    }

    /// Get rules by category
    pub async fn get_rules_by_category(&self, category: &RuleCategory) -> Vec<LearningCorrectionRule> {
        self.rules
            .read()
            .await
            .iter()
            .filter(|r| r.category == *category)
            .cloned()
            .collect()
    }

    /// Get rules by scope
    pub async fn get_rules_by_scope(&self, scope: &ApplicationScope) -> Vec<LearningCorrectionRule> {
        self.rules
            .read()
            .await
            .iter()
            .filter(|r| r.scope == *scope || r.scope == ApplicationScope::Global)
            .cloned()
            .collect()
    }

    /// Match rules against context
    pub async fn match_rules(&self, context: &RuleMatchContext) -> Vec<RuleMatch> {
        let rules = self.rules.read().await;
        let mut matches = Vec::new();

        for rule in rules.iter() {
            if rule.status != CorrectionStatus::Active {
                continue;
            }

            // Check scope
            if rule.scope != ApplicationScope::Global {
                match rule.scope {
                    ApplicationScope::Session => {
                        // Rule only applies to specific session
                        continue;
                    }
                    ApplicationScope::User => {
                        // Rule only applies to specific user
                        continue;
                    }
                    ApplicationScope::Tool => {
                        // Rule only applies to specific tool
                        if let Some(ref tool_name) = context.tool_name {
                            if !Self::matches_tool_pattern(&rule.trigger_condition, tool_name) {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    }
                    _ => {}
                }
            }

            // Check trigger
            let (matched, match_context) = Self::check_trigger(
                &rule.trigger_type,
                &rule.trigger_condition,
                context,
            );

            if matched {
                let confidence = Self::calculate_confidence(&rule, &match_context);

                matches.push(RuleMatch {
                    rule_id: rule.id.clone(),
                    rule_name: rule.name.clone(),
                    category: rule.category.clone(),
                    trigger_type: rule.trigger_type.clone(),
                    trigger_condition: rule.trigger_condition.clone(),
                    correction_action: rule.correction_action.clone(),
                    confidence,
                    match_context,
                    priority: rule.priority,
                });

                // Record hit
                self.record_hit(&rule.id, context).await;
            }
        }

        // Sort by priority then confidence
        matches.sort_by(|a, b| {
            let priority_cmp = b.priority.cmp(&a.priority);
            if priority_cmp == std::cmp::Ordering::Equal {
                b.confidence.partial_cmp(&a.confidence).unwrap_or(std::cmp::Ordering::Equal)
            } else {
                priority_cmp
            }
        });

        matches
    }

    /// Check if trigger matches
    fn check_trigger(
        trigger_type: &TriggerType,
        trigger_condition: &str,
        context: &RuleMatchContext,
    ) -> (bool, String) {
        match trigger_type {
            TriggerType::Keyword => {
                let text = context
                    .tool_output
                    .as_ref()
                    .or(context.user_message.as_ref())
                    .or(context.agent_response.as_ref())
                    .or(context.error_message.as_ref());

                if let Some(text) = text {
                    let keywords: Vec<&str> = trigger_condition.split('|').collect();
                    for keyword in keywords {
                        if text.contains(keyword) {
                            return (true, format!("Keyword '{}' found", keyword));
                        }
                    }
                }
                (false, String::new())
            }
            TriggerType::Pattern => {
                let text = context
                    .tool_output
                    .as_ref()
                    .or(context.error_message.as_ref())
                    .or(context.agent_response.as_ref());

                if let Some(text) = text {
                    // Simple regex-like matching (supports basic patterns)
                    if Self::regex_matches(trigger_condition, text) {
                        return (true, format!("Pattern '{}' matched", trigger_condition));
                    }
                }
                (false, String::new())
            }
            TriggerType::ToolOutput => {
                if let Some(ref tool_name) = context.tool_name {
                    if Self::matches_tool_pattern(trigger_condition, tool_name) {
                        return (true, format!("Tool '{}' output", tool_name));
                    }
                }
                (false, String::new())
            }
            TriggerType::Context => {
                // Context-based triggers use metadata
                if let Some(ref metadata) = context.metadata {
                    let condition_json: serde_json::Value =
                        serde_json::from_str(trigger_condition).unwrap_or(serde_json::Value::Null);
                    if let Some(obj) = metadata.as_object() {
                        for (key, value) in obj {
                            if let Some(expected) = condition_json.get(key) {
                                if value == expected {
                                    return (true, format!("Context '{}' matched", key));
                                }
                            }
                        }
                    }
                }
                (false, String::new())
            }
        }
    }

    /// Simple regex matching for patterns
    fn regex_matches(pattern: &str, text: &str) -> bool {
        // Handle common regex patterns
        if pattern.starts_with('(') && pattern.ends_with(')') {
            // Group pattern like (error|错误|失败)
            let inner = &pattern[1..pattern.len() - 1];
            let alternatives: Vec<&str> = inner.split('|').collect();
            for alt in alternatives {
                if text.contains(alt) {
                    return true;
                }
            }
        } else if pattern.contains('*') {
            // Glob pattern
            let prefix = pattern.trim_end_matches('*');
            if text.starts_with(prefix) || text.contains(prefix) {
                return true;
            }
        } else if text.contains(pattern) {
            return true;
        }
        false
    }

    /// Check if tool matches pattern
    fn matches_tool_pattern(pattern: &str, tool_name: &str) -> bool {
        Self::regex_matches(pattern, tool_name)
    }

    /// Calculate match confidence
    fn calculate_confidence(rule: &LearningCorrectionRule, _match_context: &str) -> f64 {
        // Base confidence from rule's historical success rate
        // Could be enhanced with contextual factors
        rule.success_rate * 0.8 + 0.1_f64.min(rule.applications_count as f64 / 100.0)
    }

    /// Record rule hit
    async fn record_hit(&self, rule_id: &str, context: &RuleMatchContext) {
        let mut records = self.hit_records.write().await;
        records.push(RuleHitRecord {
            id: Self::generate_id("hit"),
            rule_id: rule_id.to_string(),
            session_id: context.session_id.clone(),
            trace_id: context.trace_id.clone(),
            match_context: context
                .tool_output
                .clone()
                .or_else(|| context.error_message.clone())
                .unwrap_or_default(),
            applied: false,
            review_status: "pending".to_string(),
            created_at: Utc::now().timestamp(),
        });

        // Update rule application count
        let mut rules = self.rules.write().await;
        if let Some(rule) = rules.iter_mut().find(|r| r.id == rule_id) {
            rule.applications_count += 1;
        }
    }

    /// Generate suggestions for planner/runtime
    pub async fn generate_suggestions(
        &self,
        context: &RuleMatchContext,
    ) -> Vec<RuleSuggestion> {
        let matches = self.match_rules(context).await;

        matches
            .into_iter()
            .map(|m| RuleSuggestion {
                id: Self::generate_id("sug"),
                rule_id: m.rule_id,
                rule_name: m.rule_name,
                category: m.category,
                correction_action: m.correction_action,
                priority: 0, // Will be set based on rule priority
                reason: m.match_context,
                requires_human_review: true, // Always require human review per spec
                session_id: context.session_id.clone(),
                trace_id: context.trace_id.clone(),
                created_at: Utc::now().timestamp(),
            })
            .collect()
    }

    /// Link rule hits to failure records
    pub async fn link_to_failure(
        &self,
        trace_id: &str,
        session_id: &str,
        error_context: &str,
    ) -> Vec<RuleSuggestion> {
        let context = RuleMatchContext {
            session_id: session_id.to_string(),
            trace_id: trace_id.to_string(),
            tool_name: None,
            tool_output: None,
            user_message: None,
            agent_response: None,
            error_message: Some(error_context.to_string()),
            metadata: None,
        };

        self.generate_suggestions(&context).await
    }

    /// Add a new rule
    pub async fn add_rule(&self, rule: LearningCorrectionRule) -> Result<()> {
        let mut rules = self.rules.write().await;
        rules.push(rule);
        Ok(())
    }

    /// Update rule status
    pub async fn update_rule_status(
        &self,
        rule_id: &str,
        status: CorrectionStatus,
    ) -> Result<()> {
        let mut rules = self.rules.write().await;
        if let Some(rule) = rules.iter_mut().find(|r| r.id == rule_id) {
            rule.status = status;
            rule.updated_at = Utc::now().timestamp();
        }
        Ok(())
    }

    /// Get rule statistics
    pub async fn get_stats(&self) -> RuleStats {
        let rules = self.rules.read().await;

        let total_rules = rules.len() as i64;
        let active_rules = rules.iter().filter(|r| r.status == CorrectionStatus::Active).count() as i64;

        let mut by_category: HashMap<String, i64> = HashMap::new();
        let mut by_status: HashMap<String, i64> = HashMap::new();

        for rule in rules.iter() {
            *by_category.entry(rule.category.to_string()).or_insert(0) += 1;
            *by_status.entry(rule.status.to_string()).or_insert(0) += 1;
        }

        let avg_success_rate = if rules.is_empty() {
            0.0
        } else {
            rules.iter().map(|r| r.success_rate).sum::<f64>() / rules.len() as f64
        };

        let recent_applications: i64 = rules.iter().map(|r| r.applications_count).sum();

        let mut top_rules: Vec<RuleApplicationCount> = rules
            .iter()
            .map(|r| RuleApplicationCount {
                rule_id: r.id.clone(),
                name: r.name.clone(),
                applications: r.applications_count,
            })
            .collect();
        top_rules.sort_by(|a, b| b.applications.cmp(&a.applications));
        top_rules.truncate(5);

        RuleStats {
            total_rules,
            active_rules,
            total_corrections: recent_applications,
            avg_success_rate,
            by_category,
            by_status,
            recent_applications,
            top_rules,
        }
    }

    /// Get hit records for a session
    pub async fn get_hits_by_session(&self, session_id: &str) -> Vec<RuleHitRecord> {
        self.hit_records
            .read()
            .await
            .iter()
            .filter(|r| r.session_id == session_id)
            .cloned()
            .collect()
    }

    /// Get hit records for a trace
    pub async fn get_hits_by_trace(&self, trace_id: &str) -> Vec<RuleHitRecord> {
        self.hit_records
            .read()
            .await
            .iter()
            .filter(|r| r.trace_id == trace_id)
            .cloned()
            .collect()
    }
}

impl Default for CorrectionRuleService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_correction_status_display() {
        assert_eq!(CorrectionStatus::Active.to_string(), "active");
        assert_eq!(CorrectionStatus::Inactive.to_string(), "inactive");
        assert_eq!(CorrectionStatus::Deprecated.to_string(), "deprecated");
        assert_eq!(CorrectionStatus::Testing.to_string(), "testing");
    }

    #[test]
    fn test_rule_category_display() {
        assert_eq!(RuleCategory::OutputFormat.to_string(), "output_format");
        assert_eq!(RuleCategory::ContentAccuracy.to_string(), "content_accuracy");
    }

    #[test]
    fn test_trigger_type_display() {
        assert_eq!(TriggerType::Keyword.to_string(), "keyword");
        assert_eq!(TriggerType::Pattern.to_string(), "pattern");
    }

    #[tokio::test]
    async fn test_default_rules_loaded() {
        let service = CorrectionRuleService::new();
        let rules = service.get_rules().await;
        assert!(!rules.is_empty());
    }

    #[tokio::test]
    async fn test_match_keyword_trigger() {
        let service = CorrectionRuleService::new();
        let context = RuleMatchContext {
            session_id: "test_session".to_string(),
            trace_id: "test_trace".to_string(),
            tool_name: None,
            tool_output: None,
            user_message: Some("我建议使用A方案".to_string()),
            agent_response: None,
            error_message: None,
            metadata: None,
        };

        let matches = service.match_rules(&context).await;
        assert!(!matches.is_empty());
    }

    #[tokio::test]
    async fn test_regex_matches() {
        assert!(CorrectionRuleService::regex_matches("(error|错误)", "这是一个错误"));
        assert!(CorrectionRuleService::regex_matches("(error|错误)", "这是一个error"));
        assert!(!CorrectionRuleService::regex_matches("(error|错误)", "这是一个正确的文本"));
    }
}
