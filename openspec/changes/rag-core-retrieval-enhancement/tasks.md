## 1. Embedding Cache System

- [x] 1.1 Define EmbeddingCache struct with SQLite backend
- [x] 1.2 Implement cache table schema (text_hash, embedding, model_name, created_at)
- [x] 1.3 Implement cache lookup by text hash
- [x] 1.4 Implement cache insert with serialization
- [x] 1.5 Implement batch cache operations for efficiency
- [x] 1.6 Add SHA-256 hash generation for text normalization
- [x] 1.7 Integrate cache into EmbeddingService
- [x] 1.8 Add cache statistics tracking (hits, misses, hit rate)
- [x] 1.9 Write unit tests for EmbeddingCache

## 2. Metadata Filter DSL

- [x] 2.1 Define MetadataFilter struct (conditions, logical_operator)
- [x] 2.2 Define FilterCondition struct (field, operator, value)
- [x] 2.3 Implement comparison operators (eq, ne, gt, gte, lt, lte)
- [x] 2.4 Implement string operators (contains, starts_with, ends_with)
- [x] 2.5 Implement array operators (in, not_in)
- [x] 2.6 Implement logical operators (and, or) combination
- [x] 2.7 Implement Qdrant filter conversion
- [x] 2.8 Add filter validation
- [x] 2.9 Write unit tests for filter DSL

## 3. BM25 Full-Text Search

- [x] 3.1 Define Bm25Store struct
- [x] 3.2 Implement document tokenization (lowercase, stop words removal)
- [x] 3.3 Implement inverted index building
- [x] 3.4 Implement BM25 scoring algorithm (k1=1.5, b=0.75)
- [x] 3.5 Implement BM25 search query execution
- [x] 3.6 Integrate BM25 with HybridSearchEngine
- [x] 3.7 Write unit tests for BM25

## 4. Hybrid Search Engine

- [x] 4.1 Define HybridSearchEngine struct
- [x] 4.2 Implement parallel search execution (vector + BM25)
- [x] 4.3 Implement Reciprocal Rank Fusion (RRF) algorithm
- [x] 4.4 Implement weighted score combination
- [x] 4.5 Implement result deduplication
- [x] 4.6 Add search configuration (top_k, score_threshold, diversity)
- [x] 4.7 Write unit tests for HybridSearchEngine

## 5. Smart Chunker

- [x] 5.1 Implement sentence boundary detection
- [x] 5.2 Implement token counting utility
- [x] 5.3 Implement sentence-based chunking with token limit
- [x] 5.4 Implement overlapping window chunks
- [x] 5.5 Implement document structure detection (headings, lists)
- [x] 5.6 Implement Chunk struct with metadata
- [x] 5.7 Add configuration options to existing ChunkingStrategyConfig
- [x] 5.8 Write unit tests for SmartChunker

## 6. Retrieval Configuration

- [x] 6.1 Define RetrievalConfig struct (search_method, top_k, weights, etc.)
- [x] 6.2 Update RetrievalOptions in knowledgeRetrieval.ts
- [x] 6.3 Add filter parameter to retrieval commands
- [x] 6.4 Update knowledge_search command to accept RetrievalConfig
- [x] 6.5 Write integration tests for retrieval configuration

## 7. System Integration

- [x] 7.1 Update DocumentPipeline to use SmartChunker
- [x] 7.2 Update knowledge_search to use HybridSearchEngine
- [x] 7.3 Add new Tauri commands for cache statistics
- [x] 7.4 Update frontend RetrievalConfig.tsx component
- [ ] 7.5 Run full integration tests (requires runtime environment)
- [ ] 7.6 Performance testing with sample documents (requires runtime environment)

## 8. Documentation & Cleanup

- [x] 8.1 Add Rust documentation comments
- [x] 8.2 Update AGENTS.md with RAG architecture changes
- [ ] 8.3 Update PRD if needed (pending integration testing)
- [x] 8.4 Code review and lint fixes
