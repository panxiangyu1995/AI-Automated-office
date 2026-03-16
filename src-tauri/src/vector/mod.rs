pub mod config;
pub mod embedding;
pub mod hybrid;
pub mod qdrant;
pub mod sqlite_vec;
pub mod store;

pub use config::{
    EmbeddingConfig, HybridSearchConfig, QdrantConfig, SqliteVecConfig, VectorConfig, VectorMode,
};
pub use embedding::EmbeddingService;
pub use hybrid::{reciprocal_rank_fusion, Bm25Store, HybridSearchEngine};
pub use qdrant::QdrantStore;
pub use sqlite_vec::SqliteVecStore;
pub use store::{SearchResult, VectorItem, VectorQuery, VectorStore};
