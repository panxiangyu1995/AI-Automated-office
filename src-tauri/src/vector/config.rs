use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum VectorMode {
    Local,
    Cloud,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SqliteVecConfig {
    pub path: PathBuf,
    pub dimension: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QdrantConfig {
    pub url: String,
    pub api_key: Option<String>,
    pub collection: String,
    pub dimension: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmbeddingConfig {
    pub provider: String,
    pub model: String,
    pub api_key: String,
    pub base_url: String,
    pub dimension: usize,
    pub batch_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HybridSearchConfig {
    pub vector_weight: f32,
    pub bm25_weight: f32,
    pub rrf_k: usize,
    pub max_results: usize,
    pub min_score: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorConfig {
    pub mode: VectorMode,
    pub sqlite: SqliteVecConfig,
    pub qdrant: QdrantConfig,
    pub embedding: EmbeddingConfig,
    pub hybrid: HybridSearchConfig,
}

impl Default for VectorMode {
    fn default() -> Self {
        Self::Local
    }
}

impl Default for SqliteVecConfig {
    fn default() -> Self {
        Self {
            path: PathBuf::from("data/vector.db"),
            dimension: 1536,
        }
    }
}

impl Default for QdrantConfig {
    fn default() -> Self {
        Self {
            url: "http://localhost:6333".to_string(),
            api_key: None,
            collection: "ai_automated_office_vectors".to_string(),
            dimension: 1536,
        }
    }
}

impl Default for EmbeddingConfig {
    fn default() -> Self {
        Self {
            provider: "openai".to_string(),
            model: "text-embedding-3-small".to_string(),
            api_key: String::new(),
            base_url: "https://api.openai.com".to_string(),
            dimension: 1536,
            batch_size: 32,
        }
    }
}

impl Default for HybridSearchConfig {
    fn default() -> Self {
        Self {
            vector_weight: 0.6,
            bm25_weight: 0.4,
            rrf_k: 60,
            max_results: 20,
            min_score: 0.0,
        }
    }
}

impl Default for VectorConfig {
    fn default() -> Self {
        Self {
            mode: VectorMode::default(),
            sqlite: SqliteVecConfig::default(),
            qdrant: QdrantConfig::default(),
            embedding: EmbeddingConfig::default(),
            hybrid: HybridSearchConfig::default(),
        }
    }
}

impl VectorConfig {
    pub fn load_from_file(path: impl AsRef<Path>) -> anyhow::Result<Self> {
        let content = fs::read_to_string(path)?;
        Ok(toml::from_str(&content)?)
    }

    pub fn load() -> Self {
        Self::load_from_file("config/vector.toml").unwrap_or_default()
    }
}
