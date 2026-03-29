# Routing Mode Specification

## ADDED Requirements

### Requirement: System supports four routing modes

The system SHALL support four routing modes: Manual, Auto, Yolo, and Hybrid. Each mode determines how tool execution approval is handled.

#### Scenario: User selects Manual mode
- **GIVEN** user has configured routing mode as Manual
- **WHEN** Agent calls any tool
- **THEN** system SHALL request user confirmation before executing
- **AND** system SHALL display the tool name and parameters to user

#### Scenario: User selects Auto mode
- **GIVEN** user has configured routing mode as Auto
- **WHEN** Agent calls a tool with Low or Medium sensitivity
- **THEN** system SHALL execute the tool automatically without confirmation
- **AND** system SHALL execute the tool
- **WHEN** Agent calls a tool with High or Critical sensitivity
- **THEN** system SHALL request user confirmation before executing

#### Scenario: User selects Hybrid mode
- **GIVEN** user has configured routing mode as Hybrid
- **WHEN** Agent calls a read-only tool (is_read_only = true)
- **THEN** system SHALL execute the tool automatically without confirmation
- **WHEN** Agent calls a write tool (is_read_only = false)
- **THEN** system SHALL request user confirmation before executing

### Requirement: System displays current routing mode

The system SHALL display the current routing mode in the Agent UI so users can understand the current automation level.

#### Scenario: UI displays current routing mode
- **GIVEN** user has configured routing mode
- **WHEN** user views the chat interface
- **THEN** system SHALL display the current routing mode name (e.g., "Manual", "Auto", "Yolo", "Hybrid")
- **AND** system SHALL display a distinct icon for each mode

#### Scenario: UI allows quick mode switch
- **GIVEN** user is on the chat interface
- **WHEN** user clicks the routing mode indicator
- **THEN** system SHALL display a dropdown to quickly switch modes
- **AND** user can select a new mode from the dropdown

### Requirement: System persists routing mode preference

The system SHALL persist the user's routing mode preference so it is maintained across sessions.

#### Scenario: Routing mode persists after restart
- **GIVEN** user has configured routing mode as Yolo
- **WHEN** user restarts the application
- **THEN** system SHALL maintain the Yolo routing mode setting
- **AND** next session SHALL start with Yolo mode

#### Scenario: Routing mode can be changed per session
- **GIVEN** user has configured routing mode as Manual (default)
- **WHEN** user starts a new session and selects Auto mode
- **THEN** system SHALL use Auto mode for this session only
- **AND** default setting remains Manual for future sessions
