## ADDED Requirements

### Requirement: Tool Call Card Structure
The Tool Call Card SHALL display tool execution information with header and body sections.

#### Scenario: Tool card renders with basic structure
- **WHEN** a tool call card is displayed
- **THEN** it SHALL have a header section with tool name and status
- **AND** a body section with tool parameters or results
- **AND** border radius SHALL be 10px
- **AND** padding SHALL be 14px

### Requirement: Running State Display
The Tool Call Card SHALL visually indicate when a tool is executing.

#### Scenario: Tool in running state
- **WHEN** a tool is executing
- **THEN** the card SHALL have a 2px solid blue border (#3B82F6)
- **AND** the header SHALL have light blue background (#EFF6FF)
- **AND** the status label SHALL display "运行中..."
- **AND** the status badge SHALL have blue styling

#### Scenario: Running state shows progress
- **WHEN** tool execution progress is available
- **THEN** a progress indicator SHALL be displayed
- **AND** current step information SHALL be shown

### Requirement: Success State Display
The Tool Call Card SHALL visually indicate successful tool execution.

#### Scenario: Tool execution successful
- **WHEN** a tool completes successfully
- **THEN** the card SHALL have a 2px solid green border (#22C55E)
- **AND** the header SHALL have light green background (#F0FDF4)
- **AND** the status label SHALL display "已完成"
- **AND** the status badge SHALL have green styling

#### Scenario: Success state shows results
- **WHEN** tool execution results are available
- **THEN** the output section SHALL display the results
- **AND** action buttons (如"查看详情") SHALL be available

### Requirement: Tool Information Display
The Tool Call Card SHALL display tool name and description.

#### Scenario: Tool name and icon displayed
- **WHEN** a tool card is rendered
- **THEN** the tool name SHALL be displayed in the header
- **AND** an appropriate icon SHALL be shown (based on tool type)
- **AND** the tool description MAY be displayed

### Requirement: Input Parameters Display
The Tool Call Card SHALL display tool input parameters when available.

#### Scenario: Input parameters visible
- **WHEN** a tool has input parameters
- **THEN** the input section SHALL display parameter names and values
- **AND** sensitive data SHALL be masked appropriately

### Requirement: Action Buttons
The Tool Call Card SHALL provide action buttons for user interaction.

#### Scenario: Action buttons rendered
- **WHEN** a tool execution completes
- **THEN** action buttons SHALL be displayed (e.g., "查看生成的台账")
- **AND** buttons SHALL have proper styling (white background, green border)
- **AND** clicking a button SHALL trigger the corresponding action
