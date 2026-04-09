//! Cache warming functionality
//!
//! Provides utilities for preloading frequently used data into cache
//! during application startup to improve initial performance.

use serde::{Deserialize, Serialize};

/// Statistics from a cache warming operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WarmupStats {
    /// Number of entries loaded during warmup
    pub entries_loaded: usize,
    /// Time taken for warmup in milliseconds
    pub duration_ms: u64,
    /// Whether warmup was successful
    pub success: bool,
    /// Error message if warmup failed
    pub error: Option<String>,
}

impl WarmupStats {
    /// Create a successful warmup result
    pub fn success(entries_loaded: usize, duration_ms: u64) -> Self {
        Self {
            entries_loaded,
            duration_ms,
            success: true,
            error: None,
        }
    }

    /// Create a failed warmup result
    pub fn failure(error: String, duration_ms: u64) -> Self {
        Self {
            entries_loaded: 0,
            duration_ms,
            success: false,
            error: Some(error),
        }
    }
}

/// Simple warmer that loads a predefined set of key-value pairs
pub struct SimpleWarmer {
    data: Vec<(String, Vec<f32>)>,
    load_fn: Box<dyn Fn(&str, &[f32]) -> bool + Send>,
    priority: i32,
    name: String,
}

impl SimpleWarmer {
    /// Create a new simple warmer
    pub fn new<F>(name: &str, data: Vec<(String, Vec<f32>)>, load_fn: F) -> Self
    where
        F: Fn(&str, &[f32]) -> bool + Send + 'static,
    {
        Self {
            data,
            load_fn: Box::new(load_fn),
            priority: 0,
            name: name.to_string(),
        }
    }

    /// Set the priority of this warmer
    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    /// Get the warmer name
    pub fn name(&self) -> &str {
        &self.name
    }

    /// Get the priority
    pub fn priority(&self) -> i32 {
        self.priority
    }

    /// Check if warming is enabled
    pub fn is_enabled(&self) -> bool {
        true
    }

    /// Perform cache warming
    pub async fn warm(&self) -> WarmupStats {
        let start = std::time::Instant::now();
        let mut loaded = 0;

        for (key, value) in &self.data {
            if (self.load_fn)(key, value) {
                loaded += 1;
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;
        WarmupStats::success(loaded, duration_ms)
    }
}

/// Warmer that loads recent embeddings from a data source
pub struct EmbeddingWarmer {
    data: Vec<(String, Vec<f32>)>,
    priority: i32,
}

impl EmbeddingWarmer {
    /// Create a new embedding warmer
    pub fn new(data: Vec<(String, Vec<f32>)>) -> Self {
        Self { data, priority: 0 }
    }

    /// Set priority
    pub fn with_priority(mut self, priority: i32) -> Self {
        self.priority = priority;
        self
    }

    /// Get name
    pub fn name(&self) -> &'static str {
        "embedding"
    }

    /// Get priority
    pub fn priority(&self) -> i32 {
        self.priority
    }

    /// Check if enabled
    pub fn is_enabled(&self) -> bool {
        true
    }

    /// Perform warming
    pub async fn warm<F>(&self, load_fn: F) -> WarmupStats
    where
        F: Fn(&str, &[f32]) -> bool + Send,
    {
        let start = std::time::Instant::now();
        let mut loaded = 0;

        for (key, value) in &self.data {
            if load_fn(key, value) {
                loaded += 1;
            }
        }

        let duration_ms = start.elapsed().as_millis() as u64;
        WarmupStats::success(loaded, duration_ms)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_simple_warmer() {
        let data = vec![
            ("key1".to_string(), vec![0.1, 0.2]),
            ("key2".to_string(), vec![0.3, 0.4]),
        ];

        let warmer = SimpleWarmer::new("test", data, |k, v| {
            println!("Loading {} -> {:?}", k, v);
            true
        });

        let result = warmer.warm().await;
        assert!(result.success);
        assert_eq!(result.entries_loaded, 2);
    }

    #[tokio::test]
    async fn test_embedding_warmer() {
        let data = vec![
            ("emb1".to_string(), vec![0.1, 0.2, 0.3]),
            ("emb2".to_string(), vec![0.4, 0.5, 0.6]),
        ];

        let warmer = EmbeddingWarmer::new(data);

        let result = warmer.warm(|k, v| {
            println!("Loading embedding {} -> {:?}", k, v);
            true
        }).await;

        assert!(result.success);
        assert_eq!(result.entries_loaded, 2);
    }
}
