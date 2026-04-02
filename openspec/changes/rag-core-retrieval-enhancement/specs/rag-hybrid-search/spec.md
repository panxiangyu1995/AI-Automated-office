## ADDED Requirements

### Requirement: Hybrid Search Engine

The system SHALL provide a hybrid search engine combining vector similarity and BM25 full-text search.

#### Scenario: Semantic Search Execution
- **WHEN** a search request is received with `search_method: "semantic"`
- **THEN** the system SHALL generate an embedding vector for the query
- **AND** search the vector database for top-k similar chunks
- **AND** return results ordered by cosine similarity score

#### Scenario: BM25 Full-Text Search Execution
- **WHEN** a search request is received with `search_method: "full_text"`
- **THEN** the system SHALL tokenize the query
- **AND** compute BM25 scores against the document index
- **AND** return results ordered by BM25 relevance score

#### Scenario: Parallel Hybrid Search
- **WHEN** a search request is received with `search_method: "hybrid"`
- **THEN** the system SHALL execute semantic search and full-text search in parallel
- **AND** merge results using the configured fusion method
- **AND** return unified results sorted by fused score

#### Scenario: Metadata Filtering with Hybrid Search
- **WHEN** a hybrid search request includes metadata filters
- **THEN** the system SHALL apply filters to both semantic and full-text results
- **AND** only include chunks matching all filter conditions

### Requirement: BM25 Index

The system SHALL maintain a BM25 index for full-text search.

#### Scenario: BM25 Index Building
- **WHEN** a document is indexed
- **THEN** the system SHALL extract keywords from each chunk
- **AND** build an inverted index mapping keywords to chunk IDs
- **AND** compute document frequencies for BM25 scoring

#### Scenario: BM25 Scoring
- **WHEN** a query is processed for BM25 search
- **WHEN** BM25 parameters are `k1=1.5, b=0.75`
- **THEN** the system SHALL compute BM25 scores using the standard formula
- **AND** return scores in range [0, +inf)

### Requirement: Reciprocal Rank Fusion

The system SHALL implement Reciprocal Rank Fusion (RRF) for merging search results.

#### Scenario: RRF Merge with Equal Lists
- **WHEN** two result lists are merged with RRF and k=60
- **AND** list A contains items [1, 2, 3] with ranks [1, 2, 3]
- **AND** list B contains items [2, 3, 4] with ranks [1, 2, 3]
- **THEN** the fused scores SHALL be:
  - item 1: 1/60 + 0 = 0.0167
  - item 2: 1/120 + 1/120 = 0.0167
  - item 3: 1/180 + 1/180 = 0.0111
  - item 4: 0 + 1/180 = 0.0056
- **AND** final ranking SHALL be [1, 2, 3, 4]

#### Scenario: RRF with Different List Lengths
- **WHEN** lists have different lengths
- **THEN** items not in a list SHALL receive 0 contribution for that list
- **AND** RRF SHALL still produce valid fused scores

### Requirement: Weighted Score Combination

The system SHALL support weighted combination of vector and BM25 scores.

#### Scenario: Weighted Score with 70/30 Split
- **WHEN** hybrid search uses weighted scoring with `vector_weight: 0.7, bm25_weight: 0.3`
- **AND** a chunk has `vector_score: 0.9` and `bm25_score: 0.6`
- **THEN** the combined score SHALL be `0.7 * 0.9 + 0.3 * 0.6 = 0.81`

#### Scenario: Score Normalization
- **WHEN** combining scores from different sources
- **THEN** the system SHALL normalize scores to [0, 1] range before weighting
- **AND** use min-max normalization based on observed score ranges

### Requirement: Search Result Deduplication

The system SHALL deduplicate results when merging from multiple search methods.

#### Scenario: Duplicate Removal
- **WHEN** merging results from semantic and full-text search
- **AND** the same chunk appears in both result sets
- **THEN** the system SHALL keep only one entry
- **AND** use the higher of the two scores for that chunk
