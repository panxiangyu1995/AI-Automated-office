## ADDED Requirements

### Requirement: Embedding Cache System

The system SHALL provide an embedding vector cache to avoid redundant API calls for identical text embeddings.

#### Scenario: Cache Hit
- **WHEN** a user requests an embedding for text that was previously embedded
- **THEN** the system SHALL return the cached vector immediately without calling the embedding API
- **AND** the response time SHALL be less than 10ms

#### Scenario: Cache Miss
- **WHEN** a user requests an embedding for new text
- **THEN** the system SHALL call the embedding API to generate the vector
- **AND** store the result in the cache for future use

#### Scenario: Batch Embedding with Cache
- **WHEN** a batch of texts is submitted for embedding
- **THEN** the system SHALL check cache for each text in parallel
- **AND** only call the embedding API for texts not in cache
- **AND** return results maintaining original order

#### Scenario: Cache Key Generation
- **WHEN** generating a cache key for text
- **THEN** the system SHALL use SHA-256 hash of the normalized text
- **AND** include the embedding model name in the cache key

### Requirement: Metadata Filter DSL

The system SHALL provide a structured metadata filtering language for precise retrieval control.

#### Scenario: Equality Filter
- **WHEN** a retrieval request includes filter `{ "field": "department_id", "operator": "eq", "value": "sales" }`
- **THEN** the system SHALL only return chunks where `department_id` equals "sales"

#### Scenario: Comparison Filter
- **WHEN** a retrieval request includes filter `{ "field": "created_at", "operator": "gt", "value": "2024-01-01" }`
- **THEN** the system SHALL only return chunks created after the specified date

#### Scenario: Contains Filter
- **WHEN** a retrieval request includes filter `{ "field": "tags", "operator": "contains", "value": "important" }`
- **THEN** the system SHALL return chunks where the tags array contains "important"

#### Scenario: IN Filter
- **WHEN** a retrieval request includes filter `{ "field": "document_type", "operator": "in", "value": ["policy", "procedure"] }`
- **THEN** the system SHALL return chunks where document_type is either "policy" or "procedure"

#### Scenario: Logical AND Combination
- **WHEN** a retrieval request includes multiple filter conditions with `logical_operator: "and"`
- **THEN** the system SHALL return chunks matching ALL conditions

#### Scenario: Logical OR Combination
- **WHEN** a retrieval request includes multiple filter conditions with `logical_operator: "or"`
- **THEN** the system SHALL return chunks matching ANY condition

### Requirement: Hybrid Search with RRF

The system SHALL support hybrid search combining vector similarity and BM25 full-text search.

#### Scenario: Semantic Search Only
- **WHEN** retrieval config specifies `search_method: "semantic"`
- **THEN** the system SHALL only use vector similarity search
- **AND** return results ordered by cosine similarity score

#### Scenario: Full-Text Search Only
- **WHEN** retrieval config specifies `search_method: "full_text"`
- **THEN** the system SHALL only use BM25 keyword search
- **AND** return results ordered by BM25 relevance score

#### Scenario: Hybrid Search
- **WHEN** retrieval config specifies `search_method: "hybrid"`
- **THEN** the system SHALL execute both semantic and full-text searches in parallel
- **AND** merge results using Reciprocal Rank Fusion (RRF) with k=60
- **AND** return unified results sorted by fused score

#### Scenario: Weighted Scoring
- **WHEN** hybrid search uses weighted scoring mode
- **THEN** the system SHALL compute final score as `vector_weight * vector_score + bm25_weight * bm25_score`
- **AND** default weights SHALL be vector_weight=0.7, bm25_weight=0.3

### Requirement: Retrieval Result Reranking

The system SHALL support reranking of retrieval results to improve relevance.

#### Scenario: Weighted Score Reranking
- **WHEN** reranking is enabled with `reranking_mode: "weighted_score"`
- **THEN** the system SHALL apply the configured weights to combine different relevance signals
- **AND** return results sorted by the weighted score

#### Scenario: Score Threshold
- **WHEN** retrieval config specifies `score_threshold: 0.5`
- **THEN** the system SHALL filter out results with scores below 0.5

### Requirement: Smart Chunking

The system SHALL provide intelligent document chunking that preserves semantic boundaries.

#### Scenario: Sentence Boundary Chunks
- **WHEN** chunking with `strategy: "sentence"`
- **THEN** the system SHALL split at sentence boundaries (`.`, `!`, `?`)
- **AND** combine sentences until reaching chunk_size token limit
- **AND** discard chunks below min_chunk_size

#### Scenario: Overlapping Window
- **WHEN** chunking with `overlap: 50` tokens
- **THEN** consecutive chunks SHALL share 50 tokens of overlap
- **AND** this preserves context continuity between chunks

#### Scenario: Chunk Metadata Preservation
- **WHEN** creating chunks from a document
- **THEN** each chunk SHALL preserve metadata including:
  - `document_id`: Source document identifier
  - `heading`: Parent heading if within a heading section
  - `page_number`: Original page number if available
  - `section`: Section identifier

### Requirement: Retrieval Configuration

The system SHALL support configurable retrieval parameters.

#### Scenario: Custom Top-K
- **WHEN** retrieval request specifies `top_k: 20`
- **THEN** the system SHALL return at most 20 most relevant chunks

#### Scenario: Top-K with Diversity
- **WHEN** retrieval request specifies `diversity: 0.5`
- **THEN** the system SHALL consider diversity among results
- **AND** penalize results from the same document

### Requirement: Cache Statistics

The system SHALL provide cache statistics for monitoring and debugging.

#### Scenario: Cache Hit Rate Query
- **WHEN** calling the cache statistics API
- **THEN** the system SHALL return:
  - Total cache entries count
  - Cache hit count
  - Cache miss count
  - Hit rate percentage
  - Most accessed cache keys
