//! Cognitive state management for memory.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Cognitive domain state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CognitiveState {
    /// Domain identifier
    pub domain_id: String,
    /// Domain name
    pub name: String,
    /// Active context items
    pub active_contexts: Vec<ContextItem>,
    /// Domain statistics
    pub stats: DomainStats,
    /// Last updated timestamp
    pub updated_at: i64,
}

/// Context item within a domain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextItem {
    pub id: String,
    pub memory_id: String,
    pub key: String,
    pub summary: String,
    pub relevance_score: f64,
    pub created_at: i64,
}

/// Domain statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainStats {
    pub total_memories: usize,
    pub total_accesses: i64,
    pub avg_confidence: f64,
    pub last_accessed_at: Option<i64>,
}

impl Default for DomainStats {
    fn default() -> Self {
        Self {
            total_memories: 0,
            total_accesses: 0,
            avg_confidence: 0.0,
            last_accessed_at: None,
        }
    }
}

/// Cognitive state manager
pub struct CognitiveStateManager {
    /// Domain states indexed by domain_id
    domains: HashMap<String, CognitiveState>,
}

impl CognitiveStateManager {
    pub fn new() -> Self {
        Self {
            domains: HashMap::new(),
        }
    }

    /// Get or create a domain state
    pub fn get_or_create_domain(&mut self, domain_id: &str, name: &str) -> &mut CognitiveState {
        self.domains
            .entry(domain_id.to_string())
            .or_insert_with(|| CognitiveState {
                domain_id: domain_id.to_string(),
                name: name.to_string(),
                active_contexts: Vec::new(),
                stats: DomainStats::default(),
                updated_at: chrono::Utc::now().timestamp(),
            })
    }

    /// Add context to a domain
    pub fn add_context(&mut self, domain_id: &str, item: ContextItem) {
        if let Some(domain) = self.domains.get_mut(domain_id) {
            // Update or add context
            if let Some(existing) = domain.active_contexts.iter_mut().find(|c| c.id == item.id) {
                *existing = item;
            } else {
                domain.active_contexts.push(item);
            }
            domain.updated_at = chrono::Utc::now().timestamp();
        }
    }

    /// Remove context from a domain
    pub fn remove_context(&mut self, domain_id: &str, context_id: &str) {
        if let Some(domain) = self.domains.get_mut(domain_id) {
            domain.active_contexts.retain(|c| c.id != context_id);
            domain.updated_at = chrono::Utc::now().timestamp();
        }
    }

    /// Update domain statistics
    pub fn update_stats(&mut self, domain_id: &str, stats: DomainStats) {
        if let Some(domain) = self.domains.get_mut(domain_id) {
            domain.stats = stats;
            domain.updated_at = chrono::Utc::now().timestamp();
        }
    }

    /// Get all domains
    pub fn get_all_domains(&self) -> Vec<&CognitiveState> {
        self.domains.values().collect()
    }

    /// Get domain by ID
    pub fn get_domain(&self, domain_id: &str) -> Option<&CognitiveState> {
        self.domains.get(domain_id)
    }
}

impl Default for CognitiveStateManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cognitive_state_manager() {
        let mut manager = CognitiveStateManager::new();

        // Create domain
        let domain = manager.get_or_create_domain("finance", "Finance Department");
        assert_eq!(domain.name, "Finance Department");

        // Add context
        manager.add_context("finance", ContextItem {
            id: "ctx-1".to_string(),
            memory_id: "mem-1".to_string(),
            key: "quarterly_report".to_string(),
            summary: "Q4 financial summary".to_string(),
            relevance_score: 0.9,
            created_at: chrono::Utc::now().timestamp(),
        });

        // Verify context was added
        let domain = manager.get_domain("finance").unwrap();
        assert_eq!(domain.active_contexts.len(), 1);

        // Remove context
        manager.remove_context("finance", "ctx-1");
        let domain = manager.get_domain("finance").unwrap();
        assert_eq!(domain.active_contexts.len(), 0);
    }
}
