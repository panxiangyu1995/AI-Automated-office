## ADDED Requirements

### Requirement: Manual context compression trigger
The system SHALL allow users to manually trigger context compression at any time.

#### Scenario: User clicks compress button
- **WHEN** user clicks "Compress Context" button
- **THEN** context compression SHALL be triggered immediately

#### Scenario: Keyboard shortcut triggers compression
- **WHEN** user presses Ctrl+Shift+C
- **THEN** context compression SHALL be triggered

### Requirement: Manual compression feedback
The system SHALL provide feedback to user when manual compression is triggered.

#### Scenario: Compression shows progress
- **WHEN** manual compression is in progress
- **THEN** a loading indicator SHALL be shown

#### Scenario: Compression completion notification
- **WHEN** manual compression completes
- **THEN** a toast notification SHALL inform the user that context was compressed
