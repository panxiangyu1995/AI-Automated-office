## ADDED Requirements

### Requirement: Panel Layout Structure
The AI Chat Panel SHALL have a fixed width of 420px and vertical flex layout with header, message list, and input area.

#### Scenario: Panel renders with correct structure
- **WHEN** the AI Chat Panel is rendered
- **THEN** it SHALL display a header section (60px height)
- **AND** a message list area (flex: 1, scrollable)
- **AND** an input area at the bottom

#### Scenario: Panel handles overflow correctly
- **WHEN** the message content exceeds the available height
- **THEN** the message list SHALL be scrollable
- **AND** the input area SHALL remain fixed at the bottom

### Requirement: Header Section
The panel header SHALL display the AI assistant name and optional action buttons.

#### Scenario: Header displays AI assistant info
- **WHEN** the panel is loaded
- **THEN** the header SHALL display "AI 助手" as the title
- **AND** optionally display a settings or close button

### Requirement: Message List
The message list SHALL support rendering different message types in chronological order.

#### Scenario: Message list renders mixed content
- **WHEN** messages of different types (user, AI, tool, feedback) exist
- **THEN** the message list SHALL render them in order
- **AND** apply appropriate spacing (24px gap) between messages

#### Scenario: Empty message state
- **WHEN** no messages exist
- **THEN** the message list SHALL display a welcome message with quick actions

### Requirement: Key Facts Section
The panel SHALL optionally display a key facts section above the message list.

#### Scenario: Key facts section visible
- **WHEN** key facts are provided
- **THEN** a facts section SHALL be displayed with light blue background (#F0F9FF)
- **AND** it SHALL be collapsible

### Requirement: Color Scheme
The panel SHALL use the project's light color scheme.

#### Scenario: Light theme applied
- **WHEN** the panel is rendered
- **THEN** the background SHALL be white (#FFFFFF)
- **AND** borders SHALL use #E2E8F0
- **AND** text SHALL use #1E293B for primary content
