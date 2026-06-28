# Specification: layered-memory

## ADDED Requirements

### Requirement: Three-Layer Memory Architecture
The system SHALL implement a three-layer memory architecture that supports different scopes of memory persistence and access:
- `User`: User-private memories accessible only by the current user
- `Project`: Project-level memories accessible by all project members
- `Local`: Session-level memories that are not persisted to VCS

#### Scenario: Memory layers with different scopes
- **WHEN** agent needs to access memory
- **THEN** the system SHALL check layers in priority order: Local > Project > User
- **AND** the first layer with matching content SHALL be returned

### Requirement: MemoryScope Enumeration
The system SHALL define a `MemoryScope` enumeration with values:
- `User`: Cross-project user memories stored in `~/.ai-office/agent-memory/`
- `Project`: Project-level memories stored in `.ai-office/agent-memory/`
- `Local`: Session-level memories stored in `.ai-office/agent-memory-local/`

#### Scenario: Memory files stored in correct locations
- **WHEN** memory is saved with scope User
- **THEN** the file SHALL be stored in `~/.ai-office/agent-memory/`
- **WHEN** memory is saved with scope Project
- **THEN** the file SHALL be stored in `.ai-office/agent-memory/`
- **WHEN** memory is saved with scope Local
- **THEN** the file SHALL be stored in `.ai-office/agent-memory-local/`

### Requirement: LayeredMemory Structure
The system SHALL implement a `LayeredMemory` structure that manages all three memory layers with methods:
- `load_for_agent`: Load memory content for a specific agent type and scope
- `build_memory_prompt`: Build a memory prompt from all applicable layers
- `save`: Save memory to a specific layer

#### Scenario: Build memory prompt from all layers
- **WHEN** `build_memory_prompt` is called
- **THEN** the system SHALL load content from Local, then Project, then User layers
- **AND** the content SHALL be concatenated with appropriate separators
- **AND** the final prompt SHALL prioritize Local content

### Requirement: Memory File Truncation
The system SHALL enforce limits on memory files to prevent excessive context growth:
- Maximum 200 lines per memory file
- Maximum 25KB per memory file

#### Scenario: Memory file truncation
- **WHEN** a memory file exceeds 200 lines or 25KB
- **THEN** the system SHALL truncate the file
- **AND** older content SHALL be removed first
- **AND** the system SHALL log a warning

### Requirement: Memory Search Across Layers
The system SHALL support searching across all memory layers with relevance ranking based on scope.

#### Scenario: Search returns results from all layers
- **WHEN** user searches for a memory
- **THEN** the system SHALL search all applicable layers
- **AND** results SHALL be ranked by relevance and scope
- **AND** Local results SHALL be prioritized over Project and User results

### Requirement: Memory Access Control
The system SHALL enforce access control based on memory scope:
- User memories are only accessible by the owning user
- Project memories are accessible by all project members
- Local memories are session-specific and not shared

#### Scenario: User cannot access another user's memories
- **WHEN** User A attempts to access User B's User-scope memories
- **THEN** the system SHALL deny access
- **AND** an error SHALL be logged

### Requirement: Memory Persistence
The system SHALL persist memories according to their scope:
- User memories: Persisted across sessions and machines
- Project memories: Persisted in project directory (VCS-compatible)
- Local memories: Not persisted (session-only)

#### Scenario: Memory persistence by scope
- **WHEN** application restarts
- **THEN** User memories SHALL be restored
- **AND** Project memories SHALL be restored
- **AND** Local memories SHALL NOT be restored (intentionally)

### Requirement: Memory Automatic Cleanup
The system SHALL automatically clean up old memories based on configurable retention policies.

#### Scenario: Automatic cleanup of old memories
- **WHEN** memories exceed retention limits
- **THEN** the system SHALL remove oldest entries
- **AND** cleanup SHALL respect scope boundaries
- **AND** cleanup SHALL not remove pinned memories
