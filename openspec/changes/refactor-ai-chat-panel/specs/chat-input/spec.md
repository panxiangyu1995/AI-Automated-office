## ADDED Requirements

### Requirement: Chat Input Structure
The Chat Input SHALL provide a text input area with send button.

#### Scenario: Chat input renders correctly
- **WHEN** the chat input is displayed
- **THEN** it SHALL have a text input field
- **AND** a send button SHALL be displayed
- **AND** the container SHALL have top border (1.5px solid #E2E8F0)
- **AND** padding SHALL be [16,20]

### Requirement: Input Field Styling
The input field SHALL have consistent styling with the design system.

#### Scenario: Input field styled correctly
- **WHEN** the input field is rendered
- **THEN** it SHALL have white background
- **AND** border SHALL be 1.5px solid #E2E8F0
- **AND** border radius SHALL be 20px
- **AND** padding SHALL be [12,16]
- **AND** placeholder text SHALL be "输入消息..."

#### Scenario: Input field focus state
- **WHEN** the input field is focused
- **THEN** the border color SHALL change to #3B82F6
- **AND** a focus ring SHALL be visible

### Requirement: Send Button
The send button SHALL trigger message sending.

#### Scenario: Send button renders correctly
- **WHEN** the chat input is displayed
- **THEN** the send button SHALL have #1E3A5F background
- **AND** the button SHALL display a send icon
- **AND** the button SHALL have 8px border radius
- **AND** button dimensions SHALL be 36px x 36px

#### Scenario: Send button disabled state
- **WHEN** the input field is empty
- **THEN** the send button SHALL be disabled
- **AND** the button opacity SHALL be reduced (0.5)

#### Scenario: Send button click
- **WHEN** the send button is clicked
- **THEN** the message SHALL be sent
- **AND** the input field SHALL be cleared
- **AND** focus SHALL return to the input field

### Requirement: Keyboard Support
The Chat Input SHALL support keyboard interactions.

#### Scenario: Enter key sends message
- **WHEN** the user presses Enter
- **THEN** the message SHALL be sent
- **AND** the input field SHALL be cleared

#### Scenario: Shift+Enter for new line
- **WHEN** the user presses Shift+Enter
- **THEN** a new line SHALL be inserted in the input
- **AND** the message SHALL NOT be sent

### Requirement: Input Validation
The Chat Input SHALL validate input before sending.

#### Scenario: Empty input validation
- **WHEN** the user attempts to send an empty message
- **THEN** the message SHALL NOT be sent
- **AND** the send button SHALL remain disabled

#### Scenario: Whitespace-only input
- **WHEN** the input contains only whitespace
- **THEN** it SHALL be treated as empty
- **AND** the send button SHALL be disabled

### Requirement: Input Area Position
The Chat Input SHALL be fixed at the bottom of the panel.

#### Scenario: Input area fixed position
- **WHEN** the message list scrolls
- **THEN** the input area SHALL remain visible at the bottom
- **AND** it SHALL always be accessible for user input
