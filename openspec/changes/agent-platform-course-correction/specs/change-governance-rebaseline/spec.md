## ADDED Requirements

### Requirement: Legacy execution baseline MUST be reclassified before further implementation
The system SHALL establish a corrective governance baseline that classifies previously completed task batches, active OpenSpec changes, and already implemented code into `keep`, `rename/rebind`, `refactor`, or `freeze/supersede` before new feature work continues.

#### Scenario: New work is about to start
- **WHEN** a developer or agent prepares to continue implementation after the iron-law rebaseline
- **THEN** the corrective change and corrective task batch SHALL be treated as the default execution source
- **AND** legacy unarchived changes SHALL NOT be used as the default direction without explicit keep/refactor review

### Requirement: Task history MUST remain preserved while corrective work gets a new entry point
The system SHALL preserve historical task files and completed status as implementation history, while introducing a new corrective execution entry point for future refactor work.

#### Scenario: Reviewing historical progress
- **WHEN** a developer inspects archived or completed task batches
- **THEN** those files SHALL remain readable as historical records
- **AND** the corrective task batch SHALL be used for follow-up refactor execution
