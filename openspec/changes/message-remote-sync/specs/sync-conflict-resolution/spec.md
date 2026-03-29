## ADDED Requirements

### Requirement: Last-write-wins conflict resolution
The system SHALL resolve conflicts using last-write-wins strategy based on updated_at timestamp.

#### Scenario: Local and remote have different content
- **WHEN** a message exists locally with updated_at=T1 and remotely with updated_at=T2 (T2 > T1)
- **THEN** the remote version SHALL overwrite the local version

#### Scenario: Conflict flagged for manual resolution
- **WHEN** last-write-wins cannot be applied (e.g., user edited both versions)
- **THEN** the message SHALL be flagged with conflict status and require manual resolution

### Requirement: Conflict UI for manual resolution
The system SHALL provide a UI for users to manually resolve conflicts when auto-resolution is not possible.

#### Scenario: User views conflict details
- **WHEN** user clicks on a conflicted message
- **THEN** a dialog SHALL show both local and remote versions

#### Scenario: User selects resolution
- **WHEN** user selects "Keep Local" or "Keep Remote"
- **THEN** the chosen version SHALL be applied and conflict status cleared
