## ADDED Requirements

### Requirement: Search result ranking
The system SHALL rank search results based on relevance and context.

#### Scenario: Current workspace results rank higher
- **WHEN** results include resources from current workspace and other workspaces
- **THEN** resources from current workspace SHALL appear first
- **AND** resources from other workspaces appear below

#### Scenario: Recent access improves ranking
- **WHEN** results include recently accessed resources
- **THEN** recently accessed resources SHALL be boosted in ranking
- **AND** appear before less recently accessed matching resources

### Requirement: Resource type weighting
The system SHALL apply type-based weighting to search results.

#### Scenario: Type priority order
- **WHEN** results match query equally well
- **THEN** system SHALL rank by type in this order:
  1. projects (highest)
  2. documents
  3. templates
  4. knowledge entries
  5. users (lowest)

### Requirement: Match quality scoring
The system SHALL score results based on match quality.

#### Scenario: Exact match scores highest
- **WHEN** result title exactly matches query
- **THEN** result gets highest base score

#### Scenario: Prefix match scores high
- **WHEN** result title starts with query
- **THEN** result gets high base score

#### Scenario: Contains match scores medium
- **WHEN** result title contains query
- **THEN** result gets medium base score

### Requirement: Combined ranking score
The system SHALL calculate combined score using:
```
finalScore = matchScore * typeWeight * workspaceBoost * recencyBoost
```

#### Scenario: Calculate combined score
- **WHEN** result has:
  - prefix match (score: 0.9)
  - project type (weight: 1.0)
  - current workspace (boost: 2.0)
  - accessed 1 hour ago (boost: 1.5)
- **THEN** finalScore = 0.9 * 1.0 * 2.0 * 1.5 = 2.7

### Requirement: Zero-query ranking (recent items)
When search query is empty, the system SHALL display recently accessed items.

#### Scenario: Display recent items when empty
- **WHEN** user opens Quick Open with no query
- **THEN** system SHALL display up to 8 most recently accessed items
- **AND** ordered by lastAccessedAt descending

### Requirement: Stale access data handling
The system SHALL handle stale or missing access timestamps gracefully.

#### Scenario: Missing access timestamp
- **WHEN** result has no lastAccessedAt
- **THEN** system SHALL treat recencyBoost as 1.0 (no boost)
