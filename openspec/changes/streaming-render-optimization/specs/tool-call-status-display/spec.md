## ADDED Requirements

### Requirement: Real-time tool call status display
The system SHALL display tool call status in real-time as tools are executed, showing pending, running, success, or error states.

#### Scenario: Tool call shows pending state
- **WHEN** a tool call is initiated
- **THEN** the tool call card SHALL show status 'pending' with a clock icon

#### Scenario: Tool call shows running state
- **WHEN** tool execution begins
- **THEN** the status SHALL change to 'running' with a spinning indicator

#### Scenario: Tool call shows success with result
- **WHEN** tool execution completes successfully
- **THEN** status SHALL be 'success' with a checkmark and the result displayed

#### Scenario: Tool call shows error state
- **WHEN** tool execution fails
- **THEN** status SHALL be 'error' with an X icon and error message displayed

### Requirement: Tool call progress updates
The system SHALL support progress updates for long-running tools, showing current progress text.

#### Scenario: Progress message updates UI
- **WHEN** a tool emits progress information (e.g., "Processing 3 of 10")
- **THEN** the tool call card SHALL display the current progress text
