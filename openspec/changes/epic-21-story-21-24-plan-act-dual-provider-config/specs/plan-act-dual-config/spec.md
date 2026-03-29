# Plan/Act Dual Configuration Specification

## ADDED Requirements

### Requirement: Provider supports Plan/Act dual configuration

The system SHALL support configuring separate LLM Provider settings for Plan mode and Act mode, allowing independent selection of Provider, Model, and API Key for each mode.

#### Scenario: User configures Plan mode provider
- **GIVEN** user is on the LLM Provider configuration page
- **WHEN** user expands the Plan mode configuration section
- **THEN** user can select a Provider (e.g., Anthropic, DeepSeek)
- **AND** user can select a Model (e.g., claude-haiku, gpt-3.5-turbo)
- **AND** user can enter an API Key for Plan mode
- **AND** configuration is saved encrypted

#### Scenario: User configures Act mode provider
- **GIVEN** user is on the LLM Provider configuration page
- **WHEN** user expands the Act mode configuration section
- **THEN** user can select a Provider (e.g., Anthropic, DeepSeek)
- **AND** user can select a Model (e.g., claude-sonnet, gpt-4o)
- **AND** user can enter an API Key for Act mode
- **AND** configuration is saved encrypted

#### Scenario: System uses Plan mode configuration during planning
- **GIVEN** user submits a task to the Agent
- **WHEN** Agent enters Plan phase (generating plan)
- **THEN** Agent SHALL use the Plan mode Provider configuration
- **AND** Agent SHALL use the Plan mode Model

#### Scenario: System uses Act mode configuration during execution
- **GIVEN** Agent has generated and approved a plan
- **WHEN** Agent enters Act phase (executing tools)
- **THEN** Agent SHALL use the Act mode Provider configuration
- **AND** Agent SHALL use the Act mode Model

#### Scenario: System falls back to Act mode config when Plan mode not configured
- **GIVEN** Plan mode Provider is not configured
- **WHEN** Agent enters Plan phase
- **THEN** Agent SHALL fall back to using Act mode Provider configuration
- **AND** system SHALL display a warning notification

### Requirement: Plan mode restricts tool access to read-only

The system SHALL restrict Plan mode to only allow read-only tools. Tools that modify state, execute commands, or have side effects SHALL be blocked in Plan mode.

#### Scenario: Plan mode blocks write tools
- **GIVEN** Agent is in Plan mode
- **WHEN** Agent attempts to call a tool with `is_read_only = false`
- **THEN** system SHALL block the tool call
- **AND** system SHALL return an error message indicating the tool is not available in Plan mode

#### Scenario: Plan mode allows read-only tools
- **GIVEN** Agent is in Plan mode
- **WHEN** Agent attempts to call a tool with `is_read_only = true`
- **THEN** system SHALL allow the tool call to execute normally

#### Scenario: Read-only tools include file read, search, list
- **GIVEN** Agent is in Plan mode
- **WHEN** Agent attempts to use `read_file`, `search_files`, or `list_files` tools
- **THEN** system SHALL allow these tools (they are read-only)

#### Scenario: Write tools are blocked in Plan mode
- **GIVEN** Agent is in Plan mode
- **WHEN** Agent attempts to use `write_to_file`, `execute_command`, or `delete_file` tools
- **THEN** system SHALL block these tools (they are not read-only)

### Requirement: Act mode allows all tools with sensitivity evaluation

The system SHALL allow Act mode to use all tools. The system SHALL evaluate tool sensitivity and require confirmation for high-risk operations.

#### Scenario: Act mode allows read-only tools
- **GIVEN** Agent is in Act mode
- **WHEN** Agent calls a read-only tool
- **THEN** system SHALL execute the tool without confirmation

#### Scenario: Act mode requires confirmation for sensitive tools
- **GIVEN** Agent is in Act mode
- **WHEN** Agent calls a tool with `requires_confirmation = true`
- **THEN** system SHALL return `Pending` status
- **AND** system SHALL request user confirmation before executing

#### Scenario: Act mode blocks critical tools
- **GIVEN** Agent is in Act mode
- **WHEN** Agent calls a tool with `risk_level = Critical`
- **THEN** system SHALL block the tool call
- **AND** system SHALL return an error message

### Requirement: UI displays current mode indicator

The system SHALL display the current mode (Plan or Act) in the Agent UI so users can understand what phase the Agent is in.

#### Scenario: UI shows Plan mode indicator
- **GIVEN** Agent is in Plan phase
- **WHEN** user views the chat interface
- **THEN** system SHALL display "Plan 模式" indicator
- **AND** indicator SHALL be visually distinct (e.g., blue color)

#### Scenario: UI shows Act mode indicator
- **GIVEN** Agent is in Act phase
- **WHEN** user views the chat interface
- **THEN** system SHALL display "Act 模式" indicator
- **AND** indicator SHALL be visually distinct (e.g., green color)

#### Scenario: UI shows mode transition
- **GIVEN** Agent transitions from Plan to Act phase
- **WHEN** the transition occurs
- **THEN** system SHALL animate the indicator change
- **AND** system SHALL briefly display "切换到 Act 模式..." message

### Requirement: Configuration supports API key encryption

The system SHALL encrypt all API keys before storing. API keys SHALL NOT be displayed in plain text in the UI or logs.

#### Scenario: API key is encrypted on save
- **GIVEN** user enters an API key
- **WHEN** user saves the configuration
- **THEN** system SHALL encrypt the API key using AES-256
- **AND** system SHALL store only the encrypted value

#### Scenario: API key is masked in UI
- **GIVEN** an API key is configured
- **WHEN** user views the configuration page
- **THEN** system SHALL display the API key as masked (e.g., "••••••••abcd")
- **AND** user can click to reveal the full key (with confirmation)
