## ADDED Requirements

### Requirement: Suggestion Card Structure
The Suggestion Card SHALL display AI-recommended actions in a contained area.

#### Scenario: Suggestion card renders correctly
- **WHEN** a suggestion card is displayed
- **THEN** it SHALL have a light green background (#F0FDF4)
- **AND** border SHALL be 1px solid #86EFAC
- **AND** border radius SHALL be 8px
- **AND** padding SHALL be 12px

### Requirement: Suggestion Header
The Suggestion Card SHALL display a header indicating these are suggested actions.

#### Scenario: Suggestion header displayed
- **WHEN** a suggestion card is rendered
- **THEN** it SHALL display "建议操作" as the header
- **AND** the header SHALL have a wand-2 icon
- **AND** icon and text color SHALL be #166534 (dark green)
- **AND** font weight SHALL be bold

### Requirement: Suggestion Actions
The Suggestion Card SHALL display actionable buttons.

#### Scenario: Suggestion buttons rendered
- **WHEN** suggestion actions are provided
- **THEN** each action SHALL be displayed as a button
- **AND** buttons SHALL have white background
- **AND** buttons SHALL have 1px solid #BBF7D0 border
- **AND** buttons SHALL have 6px border radius
- **AND** buttons SHALL fill the container width
- **AND** button padding SHALL be [8,12]

#### Scenario: Multiple suggestion actions
- **WHEN** multiple suggestions exist
- **THEN** they SHALL be stacked vertically with 6px gap
- **AND** each button SHALL have its own action text
- **AND** action text color SHALL be #166534

#### Scenario: Suggestion action clicked
- **WHEN** a user clicks a suggestion button
- **THEN** the corresponding action SHALL be triggered
- **AND** the action MAY send a message or open a dialog

### Requirement: Suggestion Card Container
The Suggestion Card SHALL be contained within an AI message bubble.

#### Scenario: Suggestion card in message context
- **WHEN** a suggestion card is part of an AI message
- **THEN** it SHALL be nested within the message bubble
- **AND** it SHALL have 12px top padding from the message text
- **AND** it SHALL not overflow the parent bubble

### Requirement: Suggestion Icons
Suggestion actions MAY include icons.

#### Scenario: Suggestion with icons
- **WHEN** suggestion actions include icons
- **THEN** the icon SHALL be displayed before the text
- **AND** the icon SHALL be appropriate for the action type
- **AND** icon size SHALL be 14px
