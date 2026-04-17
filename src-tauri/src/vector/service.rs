//! Vector Service Module
//!
//! Provides a global vector service with lazy initialization.

use std::sync::Arc;
use anyhow::Result;
use tokio::sync::RwLock;

use crate::vector::{
    VectorConfig, VectorMode, QdrantStore, SqliteVecStore, 
    EmbeddingService, Bm25Store, reciprocal_rank_fusion,
    store::{VectorStore, VectorQuery, SearchResult},
};

/// Vector service that wraps the hybrid search engine
pub struct VectorService {
    config: VectorConfig,
    vector_store: Option<Arc<dyn VectorStore>>,
    embedding_service: Arc<RwLock<Option<EmbeddingService>>>,
    bm25_store: Arc<RwLock<Option<Arc<dyn Bm25Store>>>>,
}

impl VectorService {
    /// Create a new vector service with the given configuration
    pub fn new(config: VectorConfig) -> Self {
        Self {
            config: config.clone(),
            vector_store: None,
            embedding_service: Arc::new(RwLock::new(None)),
            bm25_store: Arc::new(RwLock::new(None)),
        }
    }

    /// Initialize the vector store based on configuration
    pub async fn initialize(&mut self) -> Result<()> {
        match self.config.mode {
            VectorMode::Cloud => {
                let store = QdrantStore::new(self.config.qdrant.clone())?;
                self.vector_store = Some(Arc::new(store));
            }
            VectorMode::Local => {
                let store = SqliteVecStore::new(
                    &self.config.sqlite.path,
                    self.config.sqlite.dimension,
                )?;
                self.vector_store = Some(Arc::new(store.clone()));
                // For local mode, use SqliteVecStore as BM25 backend
                let store_clone: Arc<dyn Bm25Store> = Arc::new(store);
                *self.bm25_store.write().await = Some(store_clone);
            }
        }

        // Initialize embedding service
        let embedding = EmbeddingService::new(self.config.embedding.clone())?;
        *self.embedding_service.write().await = Some(embedding);

        tracing::info!(
            "[VectorService] Initialized in {:?} mode",
            self.config.mode
        );

        Ok(())
    }

    /// Get the vector store
    pub fn vector_store(&self) -> Option<&Arc<dyn VectorStore>> {
        self.vector_store.as_ref()
    }

    /// Get embedding service
    pub async fn embedding_service(&self) -> Option<EmbeddingService> {
        self.embedding_service.read().await.clone()
    }

    /// Get BM25 store
    pub async fn bm25_store(&self) -> Option<Arc<dyn Bm25Store>> {
        self.bm25_store.read().await.clone()
    }

    /// Generate embedding for text
    pub async fn embed(&self, texts: Vec<String>) -> Result<Vec<Vec<f32>>> {
        let service = self.embedding_service.read().await;
        match &*service {
            Some(svc) => svc.embed_texts(texts).await,
            None => Err(anyhow::anyhow!("Embedding service not initialized")),
        }
    }

    /// Perform hybrid search (vector + BM25 + RRF)
    pub async fn hybrid_search(
        &self,
        query: &str,
        k: usize,
        filter: Option<String>,
    ) -> Result<Vec<SearchResult>> {
        let vector_store = self.vector_store.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Vector store not initialized"))?;
        
        // Generate query embedding
        let embeddings = self.embed(vec![query.to_string()]).await?;
        let query_vector = &embeddings[0];

        // Vector search
        let vector_results = vector_store.search(VectorQuery {
            vector: query_vector.clone(),
            k: k * 2, // Fetch more for fusion
            filter: filter.clone(),
            include_metadata: true,
        }).await?;

        // BM25 search
        let bm25_store = self.bm25_store.read().await;
        let bm25_results = if let Some(store) = &*bm25_store {
            store.bm25_search(query, k * 2).await?
        } else {
            Vec::new()
        };

        // RRF fusion using hybrid module
        let fused = reciprocal_rank_fusion(
            vector_results,
            bm25_results,
            self.config.hybrid.vector_weight,
            self.config.hybrid.bm25_weight,
            self.config.hybrid.rrf_k,
        );

        // Filter by min score and limit results
        let results: Vec<_> = fused
            .into_iter()
            .filter(|r| r.score >= self.config.hybrid.min_score)
            .take(k)
            .collect();

        Ok(results)
    }

    /// Index a document chunk
    pub async fn index_chunk(
        &self,
        id: &str,
        content: &str,
        metadata: serde_json::Value,
    ) -> Result<()> {
        let vector_store = self.vector_store.as_ref()
            .ok_or_else(|| anyhow::anyhow!("Vector store not initialized"))?;

        // Generate embedding
        let embeddings = self.embed(vec![content.to_string()]).await?;
        let vector = &embeddings[0];

        // Insert into vector store
        vector_store.insert(id, vector, &metadata).await?;

        Ok(())
    }
}

/// Global vector service state
pub type VectorServiceState = Arc<RwLock<Option<VectorService>>>;
