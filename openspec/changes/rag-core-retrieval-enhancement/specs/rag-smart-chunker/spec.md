## ADDED Requirements

### Requirement: Sentence Boundary Detection

The system SHALL detect and split text at sentence boundaries during chunking.

#### Scenario: Basic Sentence Split
- **WHEN** chunking text "This is sentence one. This is sentence two!"
- **THEN** the system SHALL identify sentences as:
  - ["This is sentence one.", "This is sentence two!"]

#### Scenario: Sentence Boundary Characters
- **WHEN** identifying sentence boundaries
- **THEN** the system SHALL recognize `.`, `!`, `?` as sentence terminators

#### Scenario: Abbreviation Handling
- **WHEN** text contains abbreviations like "Dr." or "U.S."
- **THEN** the system SHALL NOT split on periods within abbreviations

#### Scenario: Quotation Handling
- **WHEN** sentences end with quotes
- **THEN** the system SHALL treat the entire quoted sentence as one sentence

### Requirement: Token-Based Chunk Size

The system SHALL use token-based chunk sizing for accurate memory management.

#### Scenario: Token Counting
- **WHEN** determining chunk size
- **THEN** the system SHALL count tokens using the configured tokenizer
- **AND** default tokenizer SHALL be approximately 4 characters per token

#### Scenario: Chunk Size Limit
- **WHEN** combining sentences into chunks
- **THEN** the system SHALL stop adding sentences when chunk reaches `chunk_size` tokens

#### Scenario: Minimum Chunk Size
- **WHEN** a chunk falls below `min_chunk_size`
- **THEN** the system SHALL either merge it with the previous chunk or discard it
- **AND** discard chunks smaller than `min_chunk_size / 2`

### Requirement: Overlapping Window

The system SHALL support overlapping chunks to preserve context continuity.

#### Scenario: Overlap Configuration
- **WHEN** chunking with `chunk_size: 500` and `overlap: 50`
- **THEN** consecutive chunks SHALL share 50 tokens

#### Scenario: Overlap Position
- **WHEN** creating overlapping chunks
- **THEN** the overlap SHALL be at the END of the previous chunk
- **AND** at the START of the next chunk

#### Scenario: Edge Case at Document Start
- **WHEN** creating the first chunk
- **THEN** it SHALL have no preceding overlap

#### Scenario: Edge Case at Document End
- **WHEN** the remaining text is smaller than overlap
- **THEN** it SHALL be merged with the previous chunk

### Requirement: Document Structure Preservation

The system SHALL preserve document structure metadata during chunking.

#### Scenario: Heading Detection
- **WHEN** chunking markdown or HTML documents
- **THEN** the system SHALL detect heading lines (# for markdown, h1-h6 for HTML)
- **AND** associate subsequent content with the detected heading

#### Scenario: List Preservation
- **WHEN** chunking content with lists
- **THEN** the system SHALL keep related list items together
- **AND** avoid splitting a list item across chunks

#### Scenario: Table Handling
- **WHEN** encountering a table in the document
- **THEN** the system SHALL treat the entire table as a single unit
- **AND** include table context in the chunk metadata

### Requirement: Chunk Metadata

The system SHALL attach comprehensive metadata to each chunk.

#### Scenario: Required Metadata Fields
- **WHEN** a chunk is created
- **THEN** it SHALL include:
  - `chunk_id`: Unique identifier
  - `document_id`: Source document reference
  - `chunk_index`: Position in document
  - `content`: The chunk text
  - `token_count`: Number of tokens

#### Scenario: Optional Metadata Fields
- **WHEN** additional metadata is available
- **THEN** the chunk MAY include:
  - `heading`: Parent heading in document
  - `page_number`: Page number if available
  - `section`: Section identifier
  - `tags`: User-defined tags

### Requirement: Recursive Chunking Strategy

The system SHALL provide recursive chunking that tries multiple separators in order.

#### Scenario: Separator Priority
- **WHEN** using recursive chunking
- **THEN** the system SHALL try separators in order: `["\n\n", "\n", ". ", " "]`

#### Scenario: Successful Separator Split
- **WHEN** a separator is found within the target chunk size
- **THEN** the system SHALL split at that separator
- **AND** continue with remaining text

#### Scenario: Fallback Split
- **WHEN** no separator fits within chunk size
- **THEN** the system SHALL split at the character limit
- **AND** start next chunk from the split point
