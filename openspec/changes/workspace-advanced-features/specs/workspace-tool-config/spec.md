## ADDED Requirements

### Requirement: Workspace tool configuration
The system SHALL allow administrators to configure enabled tools per workspace.

#### Scenario: View workspace tool config
- **WHEN** admin opens workspace settings
- **THEN** system shows list of all available tools
- **AND** indicates which are enabled for this workspace

#### Scenario: Enable tool for workspace
- **WHEN** admin enables a tool for workspace
- **THEN** system updates workspace toolConfig
- **AND** tool becomes available to all workspace members

#### Scenario: Disable tool for workspace
- **WHEN** admin disables a tool for workspace
- **AND** project is using that tool
- **THEN** system warns admin
- **AND** existing projects retain their own config

### Requirement: Tool configuration inheritance
The system SHALL support configuration inheritance: workspace → project → user.

#### Scenario: Project inherits workspace tool config
- **WHEN** project is created without explicit tool config
- **THEN** project inherits workspace toolConfig

#### Scenario: Project overrides workspace config
- **WHEN** project specifies own tool config
- **THEN** project config takes precedence over workspace

### Requirement: Tool config UI
The system SHALL provide a UI for managing workspace tool configuration.

#### Scenario: Display tool config UI
- **WHEN** admin navigates to workspace tool settings
- **THEN** system shows categorized list of tools
- **AND** each tool has enable/disable toggle
- **AND** some tools have additional configuration options

### Requirement: Tool permission validation
The system SHALL validate that enabled tools don't conflict.

#### Scenario: Detect conflicting tools
- **WHEN** admin enables conflicting tools
- **THEN** system shows warning message
- **AND** suggests which to disable
