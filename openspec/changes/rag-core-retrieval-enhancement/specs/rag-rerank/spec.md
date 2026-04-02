## ADDED Requirements

### Requirement: Retrieval Result Reranking

The system SHALL provide reranking capabilities to improve retrieval result quality.

#### Scenario: Weighted Score Reranking
- **WHEN** reranking mode is `"weighted_score"`
- **THEN** the system SHALL compute combined scores using configured weights
- **AND** sort results by the combined score

#### Scenario: Reranking with Vector Weight 0.7
- **WHEN** vector_weight is 0.7 and bm25_weight is 0.3
- **AND** vector_score is 0.85 and bm25_score is 0.45
- **THEN** the combined score SHALL be `0.7 * 0.85 + 0.3 * 0.45 = 0.73`

#### Scenario: Score Threshold Filtering
- **WHEN** reranking config specifies `score_threshold: 0.5`
- **THEN** the system SHALL filter out results with scores below 0.5

### Requirement: Rerank Configuration

The system SHALL support configurable reranking parameters.

#### Scenario: Enable/Disable Reranking
- **WHEN** `reranking_enabled` is false
- **THEN** the system SHALL skip reranking and use original scores

#### Scenario: Reranking Model Configuration
- **WHEN** reranking model is configured
- **THEN** the system SHALL use the model for reranking
- **AND** fall back to weighted scoring if model is unavailable

### Requirement: Diversity in Results

The system SHALL support result diversity to avoid redundant information.

#### Scenario: Diversity Penalty
- **WHEN** `diversity` parameter is set to 0.5
- **AND** multiple results are from the same document
- **THEN** the system SHALL apply a penalty to later results from that document

#### Scenario: Maximum Results Per Document
- **WHEN** `max_results_per_doc` is set to 3
- **THEN** the system SHALL return at most 3 chunks from any single document
