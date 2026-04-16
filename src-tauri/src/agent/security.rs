//! Backend Security Enforcement Module
//!
//! This module implements:
//! - Sensitive action detection as backend guards
//! - Confirmation flow enforcement
//! - Field, action, and datasource authorization
//! - Security event audit logging
//!
//! Story 55.4 - Backend-enforced security and confirmation

use crate::agent::security_types::*;

use anyhow::Result;
use chrono::Utc;
use sqlx::{Row, SqlitePool};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Security store for database operations
#[derive(Clone)]
pub struct SecurityStore {
    pool: SqlitePool,
}

impl SecurityStore {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Generate unique ID
    fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Record a security event
    pub async fn record_security_event(&self, event: &SecurityEvent) -> Result<()> {
        let metadata = event
            .metadata
            .as_ref()
            .map(serde_json::to_string)
            .transpose()?;

        sqlx::query(
            "INSERT INTO security_events (
                id, trace_id, session_id, event_type, severity,
                category, outcome, target, user_id, reason, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        )
        .bind(&event.id)
        .bind(&event.trace_id)
        .bind(&event.session_id)
        .bind(&event.event_type)
        .bind(&event.severity)
        .bind(&event.category)
        .bind(&event.outcome)
        .bind(&event.target)
        .bind(&event.user_id)
        .bind(&event.reason)
        .bind(&metadata)
        .bind(event.created_at)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    /// Get security events by session
    pub async fn get_security_events_by_session(
        &self,
        session_id: &str,
    ) -> Result<Vec<SecurityEvent>> {
        let rows = sqlx::query(
            "SELECT * FROM security_events
             WHERE session_id = ?
             ORDER BY created_at DESC;",
        )
        .bind(session_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_security_event).collect())
    }

    /// Get security events by trace
    pub async fn get_security_events_by_trace(
        &self,
        trace_id: &str,
    ) -> Result<Vec<SecurityEvent>> {
        let rows = sqlx::query(
            "SELECT * FROM security_events
             WHERE trace_id = ?
             ORDER BY created_at DESC;",
        )
        .bind(trace_id)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_security_event).collect())
    }

    /// Get security events by category
    pub async fn get_security_events_by_category(
        &self,
        category: &str,
        start_time: i64,
        end_time: i64,
    ) -> Result<Vec<SecurityEvent>> {
        let rows = sqlx::query(
            "SELECT * FROM security_events
             WHERE category = ? AND created_at >= ? AND created_at <= ?
             ORDER BY created_at DESC;",
        )
        .bind(category)
        .bind(start_time)
        .bind(end_time)
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(map_security_event).collect())
    }
}

fn map_security_event(row: sqlx::sqlite::SqliteRow) -> SecurityEvent {
    let metadata: Option<String> = row.try_get("metadata").unwrap_or(None);

    SecurityEvent {
        id: row.get("id"),
        trace_id: row.get("trace_id"),
        session_id: row.get("session_id"),
        event_type: row.get("event_type"),
        severity: row.get("severity"),
        category: row.get("category"),
        outcome: row.get("outcome"),
        target: row.get("target"),
        user_id: row.get("user_id"),
        reason: row.get("reason"),
        metadata: metadata.and_then(|v| serde_json::from_str(&v).ok()),
        created_at: row.get("created_at"),
    }
}

/// Default sensitive action rules
fn get_default_sensitive_rules() -> Vec<SensitiveActionRule> {
    vec![
        SensitiveActionRule {
            id: "rule_delete_data".to_string(),
            name: "Data Deletion".to_string(),
            description: "Any operation that deletes data".to_string(),
            category: SensitivityCategory::DataDeletion,
            risk_level: RiskLevel::High,
            conditions: vec![
                RuleCondition {
                    condition_type: "action_type".to_string(),
                    operator: "contains".to_string(),
                    value: serde_json::json!("delete"),
                },
                RuleCondition {
                    condition_type: "action_type".to_string(),
                    operator: "contains".to_string(),
                    value: serde_json::json!("remove"),
                },
            ],
            requires_confirmation: true,
            requires_approval: false,
            approval_workflow: None,
            audit_level: "enhanced".to_string(),
        },
        SensitiveActionRule {
            id: "rule_bulk_operation".to_string(),
            name: "Bulk Operation".to_string(),
            description: "Operations affecting multiple records".to_string(),
            category: SensitivityCategory::BulkOperation,
            risk_level: RiskLevel::Medium,
            conditions: vec![RuleCondition {
                condition_type: "field_name".to_string(),
                operator: "in".to_string(),
                value: serde_json::json!(["batch", "bulk", "ids", "all"]),
            }],
            requires_confirmation: true,
            requires_approval: false,
            approval_workflow: None,
            audit_level: "enhanced".to_string(),
        },
        SensitiveActionRule {
            id: "rule_permission_change".to_string(),
            name: "Permission Change".to_string(),
            description: "Operations that modify permissions".to_string(),
            category: SensitivityCategory::PermissionChange,
            risk_level: RiskLevel::Critical,
            conditions: vec![
                RuleCondition {
                    condition_type: "resource_type".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["permission", "role", "access"]),
                },
                RuleCondition {
                    condition_type: "action_type".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["assign", "revoke", "grant"]),
                },
            ],
            requires_confirmation: true,
            requires_approval: true,
            approval_workflow: Some("permission_change".to_string()),
            audit_level: "full".to_string(),
        },
        SensitiveActionRule {
            id: "rule_financial".to_string(),
            name: "Financial Operation".to_string(),
            description: "Financial transactions and reports".to_string(),
            category: SensitivityCategory::Financial,
            risk_level: RiskLevel::High,
            conditions: vec![
                RuleCondition {
                    condition_type: "tool_category".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["finance", "billing", "payment"]),
                },
                RuleCondition {
                    condition_type: "resource_type".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["invoice", "payment", "transaction"]),
                },
            ],
            requires_confirmation: true,
            requires_approval: true,
            approval_workflow: Some("financial".to_string()),
            audit_level: "full".to_string(),
        },
        SensitiveActionRule {
            id: "rule_auth_operation".to_string(),
            name: "Authentication Operation".to_string(),
            description: "Authentication related operations".to_string(),
            category: SensitivityCategory::Authentication,
            risk_level: RiskLevel::Critical,
            conditions: vec![
                RuleCondition {
                    condition_type: "tool_id".to_string(),
                    operator: "contains".to_string(),
                    value: serde_json::json!("auth_"),
                },
                RuleCondition {
                    condition_type: "action_type".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["login", "logout", "reset_password", "mfa"]),
                },
            ],
            requires_confirmation: true,
            requires_approval: false,
            approval_workflow: None,
            audit_level: "full".to_string(),
        },
        SensitiveActionRule {
            id: "rule_system_config".to_string(),
            name: "System Configuration".to_string(),
            description: "System-level configuration changes".to_string(),
            category: SensitivityCategory::SystemConfig,
            risk_level: RiskLevel::High,
            conditions: vec![RuleCondition {
                condition_type: "resource_type".to_string(),
                operator: "in".to_string(),
                value: serde_json::json!(["config", "setting", "system"]),
            }],
            requires_confirmation: true,
            requires_approval: true,
            approval_workflow: Some("admin_approval".to_string()),
            audit_level: "full".to_string(),
        },
        SensitiveActionRule {
            id: "rule_pii_access".to_string(),
            name: "PII Access".to_string(),
            description: "Access to personally identifiable information".to_string(),
            category: SensitivityCategory::PiiAccess,
            risk_level: RiskLevel::High,
            conditions: vec![
                RuleCondition {
                    condition_type: "field_name".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["ssn", "id_card", "passport", "bank_account", "credit_card"]),
                },
                RuleCondition {
                    condition_type: "resource_type".to_string(),
                    operator: "in".to_string(),
                    value: serde_json::json!(["employee", "user", "customer"]),
                },
            ],
            requires_confirmation: false,
            requires_approval: false,
            approval_workflow: None,
            audit_level: "full".to_string(),
        },
        SensitiveActionRule {
            id: "rule_data_export".to_string(),
            name: "Data Export".to_string(),
            description: "Export of data to external systems".to_string(),
            category: SensitivityCategory::DataExport,
            risk_level: RiskLevel::Medium,
            conditions: vec![RuleCondition {
                condition_type: "action_type".to_string(),
                operator: "in".to_string(),
                value: serde_json::json!(["export", "download", "extract"]),
            }],
            requires_confirmation: true,
            requires_approval: false,
            approval_workflow: None,
            audit_level: "enhanced".to_string(),
        },
    ]
}

/// Security service for high-level operations
#[derive(Clone)]
pub struct SecurityService {
    store: SecurityStore,
    rules: Arc<RwLock<Vec<SensitiveActionRule>>>,
    block_critical: bool,
}

impl SecurityService {
    pub fn new(pool: SqlitePool) -> Self {
        Self {
            store: SecurityStore::new(pool),
            rules: Arc::new(RwLock::new(get_default_sensitive_rules())),
            block_critical: true,
        }
    }

    /// Generate unique ID
    pub fn generate_id(prefix: &str) -> String {
        format!("{}_{}", prefix, uuid::Uuid::new_v4())
    }

    /// Check tool execution for security concerns
    pub async fn check_tool_execution(
        &self,
        context: &ToolExecutionContext,
    ) -> Result<SecurityCheckResult> {
        // Analyze the tool context for sensitive actions
        let detections = self.analyze_context(context).await;

        // Calculate overall risk
        let overall_risk = self.calculate_overall_risk(&detections);

        // Determine if confirmation or approval required
        let requires_confirmation = detections.iter().any(|d| d.requires_confirmation);
        let requires_approval = detections.iter().any(|d| d.requires_approval);

        // Determine if blocked
        let blocked = self.block_critical && overall_risk == RiskLevel::Critical;
        let denial_reason = if blocked {
            Some("Critical risk action requires approval workflow".to_string())
        } else {
            None
        };

        Ok(SecurityCheckResult {
            allowed: !blocked,
            requires_confirmation,
            requires_approval,
            blocked,
            risk_level: overall_risk,
            sensitive_actions: detections,
            denial_reason,
            confirmation_id: None,
        })
    }

    /// Analyze context for sensitive actions
    async fn analyze_context(&self, context: &ToolExecutionContext) -> Vec<DetectedSensitiveAction> {
        let rules = self.rules.read().await;
        let mut detections = Vec::new();

        for rule in rules.iter() {
            if let Some(matched) = self.match_rule(rule, context) {
                detections.push(matched);
            }
        }

        detections
    }

    /// Match a rule against the execution context
    fn match_rule(
        &self,
        rule: &SensitiveActionRule,
        context: &ToolExecutionContext,
    ) -> Option<DetectedSensitiveAction> {
        let mut matched_conditions = Vec::new();

        for condition in &rule.conditions {
            if self.evaluate_condition(condition, context) {
                matched_conditions.push(condition.clone());
            }
        }

        if matched_conditions.is_empty() {
            return None;
        }

        Some(DetectedSensitiveAction {
            id: Self::generate_id("sens"),
            step_id: context.tool_id.clone(),
            rule_id: rule.id.clone(),
            rule_name: rule.name.clone(),
            category: rule.category.clone(),
            risk_level: rule.risk_level.clone(),
            requires_confirmation: rule.requires_confirmation,
            requires_approval: rule.requires_approval,
            approval_workflow: rule.approval_workflow.clone(),
            matched_conditions,
            metadata: None,
            timestamp: Utc::now().timestamp(),
        })
    }

    /// Evaluate a condition against the context
    fn evaluate_condition(&self, condition: &RuleCondition, context: &ToolExecutionContext) -> bool {
        let value = match condition.condition_type.as_str() {
            "tool_id" => Some(context.tool_id.clone()),
            "tool_category" => context.tool_category.clone(),
            "action_type" => {
                // Extract action type from tool name
                Some(context.tool_name.clone())
            }
            "field_name" => {
                // Check if any parameter key matches
                let keys: Vec<String> = context.parameters.keys().cloned().collect();
                if keys.is_empty() {
                    None
                } else {
                    Some(keys.join(","))
                }
            }
            "resource_type" => context.parameters.get("resource_type")
                .and_then(|v| v.as_str().map(String::from)),
            _ => None,
        };

        let Some(val) = value else {
            return false;
        };

        match condition.operator.as_str() {
            "equals" => {
                if let Some(target) = condition.value.as_str() {
                    val == target
                } else if let Some(arr) = condition.value.as_array() {
                    arr.iter().any(|v| v.as_str() == Some(&val))
                } else {
                    false
                }
            }
            "contains" => {
                if let Some(target) = condition.value.as_str() {
                    val.contains(target)
                } else {
                    false
                }
            }
            "in" => {
                if let Some(arr) = condition.value.as_array() {
                    arr.iter().any(|v| v.as_str() == Some(&val))
                } else if let Some(target) = condition.value.as_str() {
                    val == target
                } else {
                    false
                }
            }
            _ => false,
        }
    }

    /// Calculate overall risk from detections
    fn calculate_overall_risk(&self, detections: &[DetectedSensitiveAction]) -> RiskLevel {
        if detections.is_empty() {
            return RiskLevel::Low;
        }

        let risk_levels = [RiskLevel::Low, RiskLevel::Medium, RiskLevel::High, RiskLevel::Critical];
        let mut max_risk_idx = 0;

        for detection in detections {
            let idx = risk_levels.iter().position(|r| r == &detection.risk_level);
            if let Some(i) = idx {
                if i > max_risk_idx {
                    max_risk_idx = i;
                }
            }
        }

        risk_levels[max_risk_idx].clone()
    }

    /// Record a security event
    pub async fn record_security_event(
        &self,
        trace_id: &str,
        session_id: &str,
        event_type: &str,
        severity: &str,
        category: &str,
        outcome: &str,
        target: &str,
        user_id: Option<&str>,
        reason: Option<&str>,
    ) -> Result<()> {
        let event = SecurityEvent {
            id: Self::generate_id("sec"),
            trace_id: trace_id.to_string(),
            session_id: session_id.to_string(),
            event_type: event_type.to_string(),
            severity: severity.to_string(),
            category: category.to_string(),
            outcome: outcome.to_string(),
            target: target.to_string(),
            user_id: user_id.map(String::from),
            reason: reason.map(String::from),
            metadata: None,
            created_at: Utc::now().timestamp(),
        };

        self.store.record_security_event(&event).await?;

        // Emit to tracing
        match severity {
            "critical" | "error" => {
                tracing::error!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    event_type = %event_type,
                    category = %category,
                    target = %target,
                    "security event"
                );
            }
            "warning" => {
                tracing::warn!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    event_type = %event_type,
                    category = %category,
                    target = %target,
                    "security event"
                );
            }
            _ => {
                tracing::info!(
                    trace_id = %trace_id,
                    session_id = %session_id,
                    event_type = %event_type,
                    category = %category,
                    target = %target,
                    "security event"
                );
            }
        }

        Ok(())
    }

    /// Record confirmation request
    pub async fn record_confirmation_request(
        &self,
        trace_id: &str,
        session_id: &str,
        step_id: &str,
        risk_level: &RiskLevel,
        sensitive_actions: &[DetectedSensitiveAction],
    ) -> Result<String> {
        let confirmation_id = Self::generate_id("conf");

        // Record the confirmation request as a security event
        let categories: Vec<String> = sensitive_actions
            .iter()
            .map(|a| a.category.to_string())
            .collect();

        self.record_security_event(
            trace_id,
            session_id,
            "confirmation_request",
            &risk_level.to_string(),
            &categories.join(","),
            "pending",
            step_id,
            None,
            Some(&format!(
                "Requires confirmation for: {}",
                sensitive_actions
                    .iter()
                    .map(|a| a.rule_name.clone())
                    .collect::<Vec<_>>()
                    .join(", ")
            )),
        )
        .await?;

        Ok(confirmation_id)
    }

    /// Record confirmation decision
    pub async fn record_confirmation_decision(
        &self,
        trace_id: &str,
        session_id: &str,
        step_id: &str,
        outcome: &ConfirmationOutcome,
        risk_level: &RiskLevel,
    ) -> Result<()> {
        let outcome_str = outcome.to_string();
        let severity = match outcome {
            ConfirmationOutcome::Approved => "info",
            ConfirmationOutcome::Rejected => "warning",
            ConfirmationOutcome::Cancelled => "info",
            ConfirmationOutcome::Timeout => "warning",
        };

        self.record_security_event(
            trace_id,
            session_id,
            "confirmation_decision",
            severity,
            &risk_level.to_string(),
            &outcome_str,
            step_id,
            None,
            Some(&format!("Confirmation {} for risk level {}", outcome_str, risk_level)),
        )
        .await?;

        Ok(())
    }

    /// Record authorization decision
    pub async fn record_authorization_decision(
        &self,
        trace_id: &str,
        session_id: &str,
        target: &str,
        outcome: &AuthorizationOutcome,
        scope: &AuthorizationScope,
        reason: Option<&str>,
    ) -> Result<()> {
        let severity = match outcome {
            AuthorizationOutcome::Allowed => "info",
            AuthorizationOutcome::Denied => "error",
            AuthorizationOutcome::Restricted => "warning",
            AuthorizationOutcome::RequiresApproval => "warning",
        };

        self.record_security_event(
            trace_id,
            session_id,
            "authorization_decision",
            severity,
            &scope.to_string(),
            &outcome.to_string(),
            target,
            None,
            reason,
        )
        .await?;

        Ok(())
    }

    /// Add a custom sensitive action rule
    pub async fn add_rule(&self, rule: SensitiveActionRule) -> Result<()> {
        let mut rules = self.rules.write().await;
        rules.push(rule);
        Ok(())
    }

    /// Get all current rules
    pub async fn get_rules(&self) -> Vec<SensitiveActionRule> {
        self.rules.read().await.clone()
    }

    /// Clear all custom rules and reset to defaults
    pub async fn reset_rules(&self) -> Result<()> {
        let mut rules = self.rules.write().await;
        *rules = get_default_sensitive_rules();
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_risk_level_display() {
        assert_eq!(RiskLevel::Low.to_string(), "low");
        assert_eq!(RiskLevel::Medium.to_string(), "medium");
        assert_eq!(RiskLevel::High.to_string(), "high");
        assert_eq!(RiskLevel::Critical.to_string(), "critical");
    }

    #[test]
    fn test_authorization_outcome_display() {
        assert_eq!(AuthorizationOutcome::Allowed.to_string(), "allowed");
        assert_eq!(AuthorizationOutcome::Denied.to_string(), "denied");
        assert_eq!(AuthorizationOutcome::Restricted.to_string(), "restricted");
        assert_eq!(AuthorizationOutcome::RequiresApproval.to_string(), "requires_approval");
    }

    #[test]
    fn test_confirmation_outcome_display() {
        assert_eq!(ConfirmationOutcome::Approved.to_string(), "approved");
        assert_eq!(ConfirmationOutcome::Rejected.to_string(), "rejected");
        assert_eq!(ConfirmationOutcome::Cancelled.to_string(), "cancelled");
        assert_eq!(ConfirmationOutcome::Timeout.to_string(), "timeout");
    }

    #[tokio::test]
    async fn test_default_rules_loaded() {
        // Test that default rules are created
        let rules = get_default_sensitive_rules();
        assert!(!rules.is_empty());

        // Verify rule structure
        for rule in &rules {
            assert!(!rule.id.is_empty());
            assert!(!rule.name.is_empty());
            assert!(!rule.conditions.is_empty() || rule.category == SensitivityCategory::DataModification);
        }
    }
}
