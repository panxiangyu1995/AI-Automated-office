//! Progressive disclosure for memory retrieval.

use crate::agent::memory::types::HybridSearchResult;

/// Progressive disclosure strategy
#[derive(Debug, Clone)]
pub struct ProgressiveStrategy {
    /// Token budget for disclosed content
    pub token_budget: usize,
    /// Maximum items to disclose at once
    pub max_items: usize,
    /// Minimum score threshold
    pub min_score: f64,
}

impl Default for ProgressiveStrategy {
    fn default() -> Self {
        Self {
            token_budget: 2000,
            max_items: 10,
            min_score: 0.3,
        }
    }
}

impl ProgressiveStrategy {
    pub fn new(token_budget: usize) -> Self {
        Self {
            token_budget,
            ..Default::default()
        }
    }

    /// Apply progressive disclosure to filter results
    pub fn apply(
        &self,
        results: HybridSearchResult,
    ) -> HybridSearchResult {
        let mut disclosed_items = Vec::new();
        let mut total_tokens = 0;

        for result in results.items {
            // Skip low score items
            if result.score < self.min_score {
                continue;
            }

            // Estimate token count (rough approximation: 1 token ≈ 4 chars)
            let item_tokens = result.item.value.len() / 4;

            // Check budget
            if total_tokens + item_tokens > self.token_budget {
                break;
            }

            // Check max items
            if disclosed_items.len() >= self.max_items {
                break;
            }

            total_tokens += item_tokens;
            disclosed_items.push(result);
        }

        HybridSearchResult {
            items: disclosed_items,
            total: results.total,
            vector_time_ms: results.vector_time_ms,
            bm25_time_ms: results.bm25_time_ms,
            fusion_time_ms: results.fusion_time_ms,
        }
    }

    /// Calculate disclosure level based on context
    pub fn calculate_level(
        &self,
        context_size: usize,
        _total_results: usize,
    ) -> DisclosureLevel {
        let usage_ratio = context_size as f64 / self.token_budget as f64;

        if usage_ratio < 0.3 {
            DisclosureLevel::Full
        } else if usage_ratio < 0.7 {
            DisclosureLevel::Summary
        } else {
            DisclosureLevel::Minimal
        }
    }
}

/// Disclosure level
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DisclosureLevel {
    /// Full content disclosure
    Full,
    /// Summary only
    Summary,
    /// Minimal info (titles/keys only)
    Minimal,
}

/// Progressive disclosure result with metadata
#[derive(Debug, Clone)]
pub struct ProgressiveResult {
    pub results: HybridSearchResult,
    pub disclosure_level: DisclosureLevel,
    pub total_available: usize,
    pub hidden_count: usize,
}

impl ProgressiveResult {
    pub fn new(
        results: HybridSearchResult,
        strategy: &ProgressiveStrategy,
    ) -> Self {
        let total = results.total;
        let items_len = results.items.len();

        let disclosure_level = strategy.calculate_level(
            results.items.iter().map(|r| r.item.value.len() / 4).sum(),
            total,
        );

        let hidden_count = total.saturating_sub(items_len);

        Self {
            results,
            disclosure_level,
            total_available: total,
            hidden_count,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::types::MemoryItem;

    #[test]
    fn test_progressive_strategy_default() {
        let strategy = ProgressiveStrategy::default();
        assert_eq!(strategy.token_budget, 2000);
        assert_eq!(strategy.max_items, 10);
    }

    #[test]
    fn test_disclosure_level() {
        let strategy = ProgressiveStrategy::default();

        assert_eq!(
            strategy.calculate_level(500, 100),
            DisclosureLevel::Full
        );
        assert_eq!(
            strategy.calculate_level(1500, 100),
            DisclosureLevel::Summary
        );
        assert_eq!(
            strategy.calculate_level(2000, 100),
            DisclosureLevel::Minimal
        );
    }
}
