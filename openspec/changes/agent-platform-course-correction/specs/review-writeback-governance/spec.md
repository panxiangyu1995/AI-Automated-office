## ADDED Requirements

### Requirement: Existing writeback capabilities MUST be normalized into staged review flow
The system SHALL normalize existing form, detail, workbench, and editor writeback capabilities into a unified staged review flow where AI prepares candidate changes and the user decides whether to accept or reject them.

#### Scenario: AI prepares page updates
- **WHEN** runtime logic generates writeback actions for a page, editor, form, detail view, or workbench card
- **THEN** those actions SHALL be represented as staged candidate changes
- **AND** they SHALL be eligible for user review before final save

### Requirement: Review actions MUST remain human-only controls
The system SHALL keep `accept`, `reject`, bulk review actions, rollback, and publish controls outside the AI tool set.

#### Scenario: Reviewing candidate changes
- **WHEN** the user inspects staged changes
- **THEN** the UI SHALL provide explicit human review actions separate from tool call cards
- **AND** AI runtime tools SHALL only stage or describe changes, not finalize them autonomously
