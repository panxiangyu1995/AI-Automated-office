# Enterprise Tools - Workspace

## ADDED Requirements

### Requirement: workspace_stage_change tool
The system SHALL provide a `workspace_stage_change` tool for staging candidate changes.

#### Scenario: Stage change to page
- **WHEN** Agent calls `workspace_stage_change` with page_id and changes
- **THEN** system SHALL stage changes for specified page

#### Scenario: Stage change to editor
- **WHEN** Agent calls `workspace_stage_change` with editor_id and changes
- **THEN** system SHALL stage changes for specified editor

#### Scenario: Query staged changes
- **WHEN** Agent calls `workspace_stage_change` with action=query
- **THEN** system SHALL return all staged changes for session

#### Scenario: Discard staged changes
- **WHEN** Agent calls `workspace_stage_change` with action=discard
- **THEN** system SHALL discard specified staged changes

## Change Format Requirements

### Requirement: Change representation
All changes SHALL be represented as structured diffs (before/after JSON).

### Requirement: Change metadata
Each staged change SHALL include: author, timestamp, related_resources.

### Requirement: Change conflict detection
The workspace_stage_change tool SHALL detect conflicts with existing changes.
