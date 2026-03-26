## ADDED Requirements

### Requirement: AI panel defaults to a chat-first primary surface
The system SHALL keep the fixed AI Chat Panel focused on staged review, active conversation, and message input by default, and SHALL NOT permanently occupy panel width with session or history browsing chrome.

#### Scenario: Opening the AI panel shows the chat-first surface
- **WHEN** the user opens the AI panel from layout controls, the View menu, or the global AI shortcut
- **THEN** the panel SHALL render the active chat header, staged review area, message list, and input as the primary surface
- **AND** session or history browsing SHALL remain hidden until explicitly requested

#### Scenario: Closing a secondary surface returns to the same conversation
- **GIVEN** a session or history secondary surface is open inside the AI panel
- **WHEN** the user closes that surface
- **THEN** the panel SHALL return to the current chat-first surface
- **AND** the active session, staged review list, and message input SHALL remain available

### Requirement: Session and history browsing are explicit secondary surfaces
The system SHALL expose session management and history browsing as explicit, on-demand secondary surfaces inside the fixed AI panel, rather than as a permanently visible nested sidebar.

#### Scenario: Opening the session surface
- **WHEN** the user triggers the session list from the AI panel header or an equivalent shell entry
- **THEN** the system SHALL open a session secondary surface inside the AI panel
- **AND** it SHALL allow creating, selecting, renaming, and deleting sessions without changing the overall shell layout

#### Scenario: Opening the history surface
- **WHEN** the user triggers history browsing from the AI panel header or an equivalent shell entry
- **THEN** the system SHALL open a history secondary surface inside the AI panel
- **AND** it SHALL preserve keyword search, time filtering, archived session restore, and archived deletion behavior

#### Scenario: Selecting a target dismisses the secondary surface
- **GIVEN** a session or history secondary surface is open
- **WHEN** the user selects a session or restores an archived conversation
- **THEN** the selected session SHALL become active
- **AND** the secondary surface SHALL close so the user returns to the chat-first surface

#### Scenario: Secondary surfaces support explicit dismissal
- **GIVEN** a session or history secondary surface is open
- **WHEN** the user clicks the close control, clicks the overlay backdrop, or presses `Escape`
- **THEN** the secondary surface SHALL close
- **AND** the AI panel SHALL remain open unless the user explicitly requested the whole panel to collapse

### Requirement: Shell entry points and default shortcut remain consistent
The system SHALL route TopBar Agent actions, View actions, layout controls, settings defaults, and AI panel shortcut copy through the same AI panel state contract.

#### Scenario: New chat from TopBar uses the same panel contract
- **WHEN** the user invokes `助手 -> 新对话`
- **THEN** the system SHALL ensure the AI panel is visible
- **AND** it SHALL create and focus a new session through the shared chat runtime

#### Scenario: History from TopBar uses the same panel contract
- **WHEN** the user invokes `助手 -> 历史记录`
- **THEN** the system SHALL ensure the AI panel is visible
- **AND** it SHALL open the history secondary surface through the shared shell UI state

#### Scenario: View and layout controls toggle the same panel state
- **WHEN** the user toggles the AI panel from the View menu or the TopBar layout control button
- **THEN** both entry points SHALL read and update the same collapsed / expanded panel state
- **AND** they SHALL NOT create a parallel AI panel visibility flag

#### Scenario: Default AI panel shortcut and displayed copy stay aligned
- **WHEN** the system resolves the default shortcut for opening the AI panel on a fresh state or reset-to-default flow
- **THEN** it SHALL use `Ctrl+Shift+I` / `CmdOrCtrl+Shift+I` as the default binding
- **AND** the TopBar tooltip, onboarding hint, and settings default placeholder SHALL display the same default value
