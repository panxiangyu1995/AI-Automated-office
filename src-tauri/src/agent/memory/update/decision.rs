//! Smart update decision engine.

use std::sync::Arc;

use crate::vector::embedding::EmbeddingService;

use super::super::types::{MemoryItem, UpdateAction, UpdateDecision};
use super::super::config::MemoryError;

/// Smart updater for memory decisions
pub struct SmartUpdater {
    embedding_service: Arc<EmbeddingService>,
    similarity_threshold: f64,
    contradiction_threshold: f64,
}

impl SmartUpdater {
    pub fn new(
        embedding_service: Arc<EmbeddingService>,
        similarity_threshold: f64,
        contradiction_threshold: f64,
    ) -> Self {
        Self {
            embedding_service,
            similarity_threshold,
            contradiction_threshold,
        }
    }

    /// Decide what action to take for a new memory item
    pub async fn decide(
        &self,
        existing: &[MemoryItem],
        new_item: &MemoryItem,
    ) -> Result<UpdateDecision, MemoryError> {
        if existing.is_empty() {
            return Ok(UpdateDecision {
                action: UpdateAction::Add,
                reason: "No existing memories, adding new".to_string(),
                confidence: 1.0,
                affected_items: Vec::new(),
            });
        }

        // Calculate similarities with existing memories
        let similarities = self.compute_similarities(existing, new_item).await?;

        // Find best match
        let best_match = similarities
            .iter()
            .enumerate()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal));

        match best_match {
            Some((idx, &sim)) if sim > self.similarity_threshold => {
                let existing_item = &existing[idx];

                // Check for contradictions
                if self.is_contradictory(existing_item, new_item) {
                    return Ok(UpdateDecision {
                        action: UpdateAction::Update,
                        reason: format!("Contradiction detected, updating (similarity: {:.2})", sim),
                        confidence: sim,
                        affected_items: vec![existing_item.id.clone()],
                    });
                }

                // Check for redundancy
                if self.is_redundant(existing_item, new_item) {
                    return Ok(UpdateDecision {
                        action: UpdateAction::None,
                        reason: format!("Redundant memory, no update needed (similarity: {:.2})", sim),
                        confidence: sim,
                        affected_items: Vec::new(),
                    });
                }

                // Default to merge
                Ok(UpdateDecision {
                    action: UpdateAction::Merge,
                    reason: format!("Merging related memories (similarity: {:.2})", sim),
                    confidence: sim,
                    affected_items: vec![existing_item.id.clone()],
                })
            }
            _ => Ok(UpdateDecision {
                action: UpdateAction::Add,
                reason: "New memory, no similar existing items".to_string(),
                confidence: 1.0,
                affected_items: Vec::new(),
            }),
        }
    }

    /// Compute similarities between new item and existing items
    async fn compute_similarities(
        &self,
        existing: &[MemoryItem],
        new_item: &MemoryItem,
    ) -> Result<Vec<f64>, MemoryError> {
        let mut similarities = Vec::new();

        // Get embedding for new item
        let new_embedding = if let Some(ref emb) = new_item.embedding {
            emb.clone()
        } else {
            self.embedding_service
                .embed_text(&new_item.value)
                .await
                .map_err(|e| MemoryError::VectorStore(e.to_string()))?
        };

        for item in existing {
            let similarity = if let Some(ref emb) = item.embedding {
                Self::cosine_similarity(&new_embedding, emb)
            } else {
                // Fallback to string similarity
                Self::string_similarity(&new_item.value, &item.value)
            };
            similarities.push(similarity);
        }

        Ok(similarities)
    }

    /// Cosine similarity between two vectors
    fn cosine_similarity(a: &[f32], b: &[f32]) -> f64 {
        if a.len() != b.len() {
            return 0.0;
        }

        let dot_product: f32 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f32 = a.iter().map(|x| x * x).sum::<f32>().sqrt();
        let norm_b: f32 = b.iter().map(|x| x * x).sum::<f32>().sqrt();

        if norm_a == 0.0 || norm_b == 0.0 {
            return 0.0;
        }

        (dot_product / (norm_a * norm_b)) as f64
    }

    /// Simple string similarity (Jaccard index on words)
    fn string_similarity(a: &str, b: &str) -> f64 {
        let words_a: std::collections::HashSet<_> = a.split_whitespace().collect();
        let words_b: std::collections::HashSet<_> = b.split_whitespace().collect();

        if words_a.is_empty() && words_b.is_empty() {
            return 1.0;
        }

        let intersection = words_a.intersection(&words_b).count();
        let union = words_a.union(&words_b).count();

        if union == 0 {
            return 0.0;
        }

        intersection as f64 / union as f64
    }

    /// Check if two memories are contradictory
    fn is_contradictory(&self, existing: &MemoryItem, new: &MemoryItem) -> bool {
        // Simple contradiction detection: same key but different value
        // and confidence is high for both
        if existing.key == new.key && existing.value != new.value {
            // Check for negation patterns
            let negations = ["not", "no", "never", "don't", "doesn't", "didn't", "won't", "wouldn't"];
            let existing_lower = existing.value.to_lowercase();
            let new_lower = new.value.to_lowercase();

            for neg in &negations {
                if existing_lower.contains(neg) != new_lower.contains(neg) {
                    return true;
                }
            }
        }
        false
    }

    /// Check if new memory is redundant with existing
    fn is_redundant(&self, existing: &MemoryItem, new: &MemoryItem) -> bool {
        // Exact or near-exact match
        let similarity = Self::string_similarity(&existing.value, &new.value);
        similarity > 0.9
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cosine_similarity() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];
        assert_eq!(SmartUpdater::cosine_similarity(&a, &b), 1.0);

        let c = vec![1.0, 0.0, 0.0];
        let d = vec![0.0, 1.0, 0.0];
        assert_eq!(SmartUpdater::cosine_similarity(&c, &d), 0.0);
    }

    #[test]
    fn test_string_similarity() {
        let a = "hello world";
        let b = "hello world";
        assert_eq!(SmartUpdater::string_similarity(a, b), 1.0);

        let c = "hello world";
        let d = "hello";
        let similarity = SmartUpdater::string_similarity(c, d);
        assert!(similarity > 0.3 && similarity < 1.0);
    }

    #[test]
    fn test_contradiction_detection() {
        let updater = SmartUpdater::new(
            Arc::new(crate::vector::embedding::EmbeddingService::new(
                crate::vector::config::EmbeddingConfig::default(),
            )),
            0.7,
            0.8,
        );

        let existing = MemoryItem {
            key: "user_pref_theme".to_string(),
            value: "User does not like dark mode".to_string(),
            confidence: 0.9,
            ..Default::default()
        };

        let new = MemoryItem {
            key: "user_pref_theme".to_string(),
            value: "User prefers dark mode".to_string(),
            confidence: 0.9,
            ..Default::default()
        };

        assert!(updater.is_contradictory(&existing, &new));
    }
}
