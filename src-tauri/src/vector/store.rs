use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorItem {
    pub id: String,
    pub vector: Vec<f32>,
    pub content: Option<String>,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorQuery {
    pub vector: Vec<f32>,
    pub k: usize,
    pub filter: Option<String>,
    pub include_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub score: f32,
    pub metadata: serde_json::Value,
}

#[async_trait]
pub trait VectorStore: Send + Sync {
    async fn insert(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()>;
    async fn insert_batch(&self, items: Vec<VectorItem>) -> Result<()>;
    async fn search(&self, query: VectorQuery) -> Result<Vec<SearchResult>>;
    async fn delete(&self, id: &str) -> Result<()>;
    async fn update(&self, id: &str, vector: &[f32], metadata: &serde_json::Value) -> Result<()>;
    async fn count(&self) -> Result<usize>;
}
