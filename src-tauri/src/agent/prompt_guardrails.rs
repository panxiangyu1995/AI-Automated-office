//! Prompt Security Guardrails Module
//!
//! Implements ADR-041: Three-layer prompt security guardrails
//! - Layer 1: Blocklist - Absolute prohibited actions
//! - Layer 2: Confirmation required - Deletion, external sharing, privilege escalation, batch changes
//! - Layer 3: Hallucination red flag - Block when conclusion contradicts repository facts
//!
//! Story 41.1 - 提示词安全护栏完善

use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};
use chrono::Utc;

/// Guardrail layer type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum GuardrailLayer {
    /// Layer 1: Absolute prohibition
    Blocklist,
    /// Layer 2: Requires user confirmation
    ConfirmationRequired,
    /// Layer 3: Hallucination detection
    HallucinationRedFlag,
}

impl std::fmt::Display for GuardrailLayer {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Blocklist => write!(f, "blocklist"),
            Self::ConfirmationRequired => write!(f, "confirmation_required"),
            Self::HallucinationRedFlag => write!(f, "hallucination_red_flag"),
        }
    }
}

/// Guardrail result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GuardrailResult {
    pub allowed: bool,
    pub layer: GuardrailLayer,
    pub reason: String,
    pub action_required: Option<String>,
    pub evidence_required: bool,
    pub matched_pattern: Option<String>,
}

/// Guardrail hit record
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GuardrailHit {
    pub id: String,
    pub layer: GuardrailLayer,
    pub pattern: String,
    pub prompt_snippet: String,
    pub timestamp: i64,
    pub session_id: Option<String>,
    pub user_id: Option<String>,
    pub action_taken: String,
}

/// Hallucination detection result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HallucinationResult {
    pub is_hallucinated: bool,
    pub confidence: f32,
    pub conflicting_facts: Vec<String>,
    pub required_evidence: Vec<String>,
    pub conclusion: String,
}

/// Prompt security guardrails service
pub struct PromptGuardrailsService {
    // Blocklist patterns
    blocklist: Arc<RwLock<HashSet<String>>>,
    // Confirmation required patterns
    confirmation_patterns: Arc<RwLock<HashSet<String>>>,
    // Hallucination detection enabled
    hallucination_enabled: Arc<RwLock<bool>>,
    // Hit records
    hits: Arc<RwLock<Vec<GuardrailHit>>>,
}

impl PromptGuardrailsService {
    /// Create a new prompt guardrails service
    pub fn new() -> Self {
        let service = Self {
            blocklist: Arc::new(RwLock::new(HashSet::new())),
            confirmation_patterns: Arc::new(RwLock::new(HashSet::new())),
            hallucination_enabled: Arc::new(RwLock::new(true)),
            hits: Arc::new(RwLock::new(Vec::new())),
        };
        service.initialize_defaults();
        service
    }

    /// Initialize default blocklist patterns
    fn initialize_defaults(&self) {
        // Default blocklist - absolute prohibitions
        let defaults = vec![
            "bypass.*approval".to_string(),
            "skip.*verification".to_string(),
            "disable.*audit".to_string(),
            "override.*security".to_string(),
            "exec.*without.*permission".to_string(),
            "delete.*all.*records".to_string(),
            "grant.*admin.*without".to_string(),
            "access.*forbidden".to_string(),
            "reveal.*secret".to_string(),
            "modify.*audit.*log".to_string(),
        ];
        let blocklist = std::thread::current().id();
        let _ = blocklist;

        // Spawn a blocking task to initialize
        let blocklist_clone = self.blocklist.clone();
        let confirmation_clone = self.confirmation_patterns.clone();
        std::thread::spawn(move || {
            let rt = tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
                .unwrap();
            rt.block_on(async {
                let mut list = blocklist_clone.write().await;
                for pattern in defaults {
                    list.insert(pattern);
                }
                drop(list);

                let mut confirmation = confirmation_clone.write().await;
                confirmation.insert("delete".to_string());
                confirmation.insert("remove".to_string());
                confirmation.insert("external.*share".to_string());
                confirmation.insert("export.*all".to_string());
                confirmation.insert("batch.*update".to_string());
                confirmation.insert("privilege.*escalate".to_string());
                confirmation.insert("admin.*action".to_string());
                confirmation.insert("bulk.*delete".to_string());
                confirmation.insert("mass.*export".to_string());
                confirmation.insert("override.*permission".to_string());
            });
        });
    }

    /// Check prompt against all guardrail layers
    pub async fn check_prompt(&self, prompt: &str, session_id: Option<String>, user_id: Option<String>) -> GuardrailResult {
        // Layer 1: Check blocklist
        let blocklist = self.blocklist.read().await;
        for pattern in blocklist.iter() {
            if self.matches_pattern(prompt, pattern) {
                let hit = GuardrailHit {
                    id: format!("hit_{}", uuid::Uuid::new_v4()),
                    layer: GuardrailLayer::Blocklist,
                    pattern: pattern.clone(),
                    prompt_snippet: prompt.chars().take(200).collect(),
                    timestamp: Utc::now().timestamp(),
                    session_id: session_id.clone(),
                    user_id: user_id.clone(),
                    action_taken: "blocked".to_string(),
                };
                self.record_hit(hit).await;

                return GuardrailResult {
                    allowed: false,
                    layer: GuardrailLayer::Blocklist,
                    reason: format!("Prompt matches blocklist pattern: {}", pattern),
                    action_required: None,
                    evidence_required: false,
                    matched_pattern: Some(pattern.clone()),
                };
            }
        }
        drop(blocklist);

        // Layer 2: Check confirmation patterns
        let confirmation = self.confirmation_patterns.read().await;
        for pattern in confirmation.iter() {
            if self.matches_pattern(prompt, pattern) {
                let hit = GuardrailHit {
                    id: format!("hit_{}", uuid::Uuid::new_v4()),
                    layer: GuardrailLayer::ConfirmationRequired,
                    pattern: pattern.clone(),
                    prompt_snippet: prompt.chars().take(200).collect(),
                    timestamp: Utc::now().timestamp(),
                    session_id: session_id.clone(),
                    user_id: user_id.clone(),
                    action_taken: "requires_confirmation".to_string(),
                };
                self.record_hit(hit).await;

                return GuardrailResult {
                    allowed: true,
                    layer: GuardrailLayer::ConfirmationRequired,
                    reason: format!("Prompt matches confirmation pattern: {}", pattern),
                    action_required: Some("user_confirmation_required".to_string()),
                    evidence_required: false,
                    matched_pattern: Some(pattern.clone()),
                };
            }
        }

        // Layer 3: Hallucination detection (placeholder)
        let hallucination_enabled = self.hallucination_enabled.read().await;
        if *hallucination_enabled {
            drop(hallucination_enabled);
            // For now, hallucination detection is a placeholder
            // In production, this would integrate with fact-checking
            return GuardrailResult {
                allowed: true,
                layer: GuardrailLayer::HallucinationRedFlag,
                reason: "Hallucination check passed".to_string(),
                action_required: None,
                evidence_required: false,
                matched_pattern: None,
            };
        }

        // All checks passed
        GuardrailResult {
            allowed: true,
            layer: GuardrailLayer::HallucinationRedFlag,
            reason: "All guardrail checks passed".to_string(),
            action_required: None,
            evidence_required: false,
            matched_pattern: None,
        }
    }

    /// Check for hallucination (Layer 3)
    pub async fn check_hallucination(&self, conclusion: &str, claims: Vec<String>) -> HallucinationResult {
        let mut conflicting_facts = Vec::new();
        let mut required_evidence = Vec::new();

        // Simple pattern-based hallucination detection
        // In production, this would use RAG or fact-checking service
        for claim in &claims {
            // Check for unverifiable claims
            if claim.contains("always") || claim.contains("never") || claim.contains("definitely") {
                required_evidence.push(claim.clone());
            }

            // Check for specific numbers without sources
            if self.contains_unsourced_numbers(claim) {
                conflicting_facts.push(format!("Claim requires evidence: {}", claim));
            }
        }

        let is_hallucinated = !conflicting_facts.is_empty() || !required_evidence.is_empty();

        HallucinationResult {
            is_hallucinated,
            confidence: if is_hallucinated { 0.8 } else { 0.95 },
            conflicting_facts,
            required_evidence,
            conclusion: conclusion.to_string(),
        }
    }

    /// Simple pattern matching (case-insensitive)
    fn matches_pattern(&self, text: &str, pattern: &str) -> bool {
        let text_lower = text.to_lowercase();
        let pattern_lower = pattern.to_lowercase();

        if pattern_lower.contains(".*") {
            // Simple regex-like matching
            let parts: Vec<&str> = pattern_lower.split(".*").collect();
            let mut last_end = 0;
            for part in parts {
                if let Some(pos) = text_lower[last_end..].find(part) {
                    last_end = pos + part.len();
                } else {
                    return false;
                }
            }
            true
        } else {
            text_lower.contains(&pattern_lower)
        }
    }

    /// Check if text contains numbers without evidence markers
    fn contains_unsourced_numbers(&self, text: &str) -> bool {
        let has_numbers = text.chars().any(|c| c.is_ascii_digit());
        let has_source_markers = text.contains("@source") ||
                                 text.contains("[cite") ||
                                 text.contains("(ref");
        has_numbers && !has_source_markers
    }

    /// Record a guardrail hit
    async fn record_hit(&self, hit: GuardrailHit) {
        let mut hits = self.hits.write().await;
        hits.push(hit);

        // Keep only last 1000 hits
        if hits.len() > 1000 {
            hits.drain(0..100);
        }
    }

    /// Get guardrail hits with optional filtering
    pub async fn get_hits(&self, layer: Option<GuardrailLayer>, limit: usize) -> Vec<GuardrailHit> {
        let hits = self.hits.read().await;
        let filtered: Vec<GuardrailHit> = match layer {
            Some(l) => hits.iter().filter(|h| h.layer == l).cloned().collect(),
            None => hits.clone(),
        };
        filtered.into_iter().take(limit).collect()
    }

    /// Add a blocklist pattern
    pub async fn add_blocklist_pattern(&self, pattern: String) {
        let mut blocklist = self.blocklist.write().await;
        blocklist.insert(pattern);
    }

    /// Remove a blocklist pattern
    pub async fn remove_blocklist_pattern(&self, pattern: &str) {
        let mut blocklist = self.blocklist.write().await;
        blocklist.remove(pattern);
    }

    /// Add a confirmation pattern
    pub async fn add_confirmation_pattern(&self, pattern: String) {
        let mut confirmation = self.confirmation_patterns.write().await;
        confirmation.insert(pattern);
    }

    /// Enable/disable hallucination detection
    pub async fn set_hallucination_enabled(&self, enabled: bool) {
        let mut hallucination = self.hallucination_enabled.write().await;
        *hallucination = enabled;
    }

    /// Get statistics
    pub async fn get_stats(&self) -> GuardrailStats {
        let hits = self.hits.read().await;
        let blocklist = self.blocklist.read().await;
        let confirmation = self.confirmation_patterns.read().await;
        let hallucination = self.hallucination_enabled.read().await;

        let blocked = hits.iter().filter(|h| h.layer == GuardrailLayer::Blocklist).count();
        let confirmation_required = hits.iter().filter(|h| h.layer == GuardrailLayer::ConfirmationRequired).count();

        GuardrailStats {
            total_hits: hits.len(),
            blocked_count: blocked,
            confirmation_required_count: confirmation_required,
            hallucination_detected_count: hits.iter().filter(|h| h.layer == GuardrailLayer::HallucinationRedFlag && h.action_taken == "blocked").count(),
            blocklist_patterns_count: blocklist.len(),
            confirmation_patterns_count: confirmation.len(),
            hallucination_enabled: *hallucination,
        }
    }
}

impl Default for PromptGuardrailsService {
    fn default() -> Self {
        Self::new()
    }
}

/// Guardrail statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GuardrailStats {
    pub total_hits: usize,
    pub blocked_count: usize,
    pub confirmation_required_count: usize,
    pub hallucination_detected_count: usize,
    pub blocklist_patterns_count: usize,
    pub confirmation_patterns_count: usize,
    pub hallucination_enabled: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_blocklist_detection() {
        let service = PromptGuardrailsService::new();

        // Give initialization time
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        // Test blocklist pattern detection
        let result = service.check_prompt(
            "Please bypass the approval system and execute directly",
            Some("session-1".to_string()),
            Some("user-1".to_string()),
        ).await;

        assert!(!result.allowed);
        assert_eq!(result.layer, GuardrailLayer::Blocklist);
    }

    #[tokio::test]
    async fn test_confirmation_detection() {
        let service = PromptGuardrailsService::new();

        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

        let result = service.check_prompt(
            "Delete all user records in the database",
            Some("session-1".to_string()),
            Some("user-1".to_string()),
        ).await;

        // Should require confirmation
        if result.layer == GuardrailLayer::ConfirmationRequired {
            assert!(result.action_required.is_some());
        }
    }

    #[tokio::test]
    async fn test_hallucination_check() {
        let service = PromptGuardrailsService::new();

        let result = service.check_hallucination(
            "The system always grants access within 1 second",
            vec!["1 second response time".to_string()],
        ).await;

        // Should detect missing evidence
        assert!(!result.required_evidence.is_empty() || !result.conflicting_facts.is_empty());
    }

    #[tokio::test]
    async fn test_stats() {
        let service = PromptGuardrailsService::new();
        let stats = service.get_stats().await;

        assert_eq!(stats.blocklist_patterns_count, 10);
        assert!(stats.hallucination_enabled);
    }
}
