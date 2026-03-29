## ADDED Requirements

### Requirement: Workspace plugin configuration
The system SHALL allow administrators to manage plugins per workspace.

#### Scenario: View workspace plugin config
- **WHEN** admin opens workspace plugin settings
- **THEN** system shows list of installed plugins
- **AND** indicates which are enabled for this workspace

#### Scenario: Enable plugin for workspace
- **WHEN** admin enables a plugin for workspace
- **THEN** system updates workspace pluginConfig
- **AND** plugin becomes available to workspace members

#### Scenario: Disable plugin for workspace
- **WHEN** admin disables a plugin for workspace
- **THEN** system updates workspace pluginConfig
- **AND** plugin is hidden from workspace members

### Requirement: Plugin configuration inheritance
Similar to tool config, plugins SHALL support workspace → project → user inheritance.

#### Scenario: Project sees enabled plugins
- **WHEN** project is created in workspace with plugins enabled
- **THEN** project sees those plugins in its plugin list

### Requirement: Plugin settings per workspace
Each plugin SHALL be able to store workspace-specific settings.

#### Scenario: Plugin stores workspace settings
- **WHEN** plugin has workspace-specific configuration
- **THEN** system stores it in workspace pluginConfig
- **AND** isolates it from other workspaces

### Requirement: Plugin dependency validation
The system SHALL validate plugin dependencies when enabling.

#### Scenario: Enable plugin with missing dependency
- **WHEN** admin enables plugin that depends on another disabled plugin
- **THEN** system shows error message
- **AND** lists missing dependencies
- **AND** does not enable the plugin
