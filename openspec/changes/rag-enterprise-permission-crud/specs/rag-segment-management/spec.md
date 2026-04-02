## ADDED Requirements

### Requirement: Segment List

The system SHALL provide paginated listing of segments within a document.

#### Scenario: List Segments
- **WHEN** a user with read permission requests segments for a document
- **THEN** the system SHALL return paginated segment list
- **AND** include segment metadata (position, content preview, token count)

#### Scenario: Filter by Position
- **WHEN** a list request includes `position_start` and `position_end`
- **THEN** the system SHALL return segments within that range

### Requirement: Segment Update

The system SHALL allow updating segment content with automatic re-indexing.

#### Scenario: Update Segment Content
- **WHEN** a user with write permission updates a segment's content
- **THEN** the system SHALL update the segment record
- **AND** recalculate token count
- **AND** regenerate embedding vector
- **AND** update vector store

#### Scenario: Update Segment Metadata
- **WHEN** a user updates segment metadata (e.g., tags)
- **THEN** the system SHALL update the metadata
- **AND** NOT trigger re-indexing

### Requirement: Segment Delete

The system SHALL allow deleting segments from a document.

#### Scenario: Delete Segment
- **WHEN** a user with write permission deletes a segment
- **THEN** the system SHALL remove the segment record
- **AND** delete the vector entry from vector store
- **AND** update document chunk count

#### Scenario: Reorder After Delete
- **WHEN** a segment is deleted
- **THEN** subsequent segments SHALL NOT be renumbered
- **AND** position SHALL remain stable

### Requirement: Segment Batch Update

The system SHALL support batch updates for segments.

#### Scenario: Batch Update Segments
- **WHEN** a user requests batch update with segment IDs and new content
- **THEN** the system SHALL update all specified segments
- **AND** regenerate embeddings in batch
- **AND** update vector store

### Requirement: Segment Search

The system SHALL allow searching within segments.

#### Scenario: Search Segments by Content
- **WHEN** a search request includes `query: "keyword"`
- **THEN** the system SHALL return segments containing "keyword"
- **AND** highlight matching positions
