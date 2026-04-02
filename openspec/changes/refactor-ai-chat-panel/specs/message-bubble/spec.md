## ADDED Requirements

### Requirement: User Message Bubble
The User Message Bubble SHALL have a distinct style with dark background and right-aligned layout.

#### Scenario: User message renders correctly
- **WHEN** a user message is displayed
- **THEN** the bubble SHALL have background color #1E3A5F
- **AND** text color SHALL be white (#FFFFFF)
- **AND** border radius SHALL be [12,12,0,12] (rounded except bottom-right)
- **AND** it SHALL be aligned to the right
- **AND** padding SHALL be [12,16]

#### Scenario: User message supports text content
- **WHEN** user message text is provided
- **THEN** the text SHALL be displayed with font size 14px
- **AND** font weight SHALL be normal
- **AND** text SHALL wrap correctly within the bubble

### Requirement: AI Message Bubble
The AI Message Bubble SHALL have a light background with avatar and name display.

#### Scenario: AI message renders with avatar
- **WHEN** an AI message is displayed
- **THEN** the bubble SHALL have background color #F8FAFC
- **AND** text color SHALL be #334155
- **AND** border radius SHALL be [4,16,16,16] (rounded except top-left)
- **AND** it SHALL display an avatar (36px, #1E3A5F background with sparkles icon)
- **AND** it SHALL display "AI 助手" as the sender name
- **AND** padding SHALL be [14,18]

#### Scenario: AI message supports rich content
- **WHEN** AI message contains text content
- **THEN** the text SHALL be displayed with font size 14px
- **AND** the bubble SHALL support nested components (tool cards, suggestions)

### Requirement: Message Spacing
Messages SHALL have consistent spacing within the message list.

#### Scenario: Message spacing applied
- **WHEN** multiple messages are rendered
- **THEN** each message SHALL have 24px gap between them
- **AND** message content SHALL have 10px gap between avatar and bubble

### Requirement: Message Width
Message bubbles SHALL have appropriate width constraints.

#### Scenario: User message width
- **WHEN** a user message is rendered
- **THEN** the bubble width SHALL be based on content (max 280px)
- **AND** it SHALL not exceed the container width

#### Scenario: AI message width
- **WHEN** an AI message is rendered
- **THEN** the bubble SHALL fill the available width (width: 100%)
- **AND** nested content SHALL not overflow
