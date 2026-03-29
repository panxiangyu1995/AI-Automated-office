## ADDED Requirements

### Requirement: Apply layout preset
The system SHALL apply a selected preset to restore layout configuration.

#### Scenario: Apply preset successfully
- **WHEN** user selects a preset to apply
- **THEN** system restores all layout configuration from preset
- **AND** sidebar width/collapsed state
- **AND** chat panel width/collapsed state
- **AND** bottom panel height/collapsed state
- **AND** top bar visibility
- **AND** open tabs and active tab
- **AND** filter state
- **AND** AI panel state

#### Scenario: Apply preset with unsaved changes
- **WHEN** user attempts to switch preset with unsaved changes
- **THEN** system shows confirmation dialog
- **AND** warns that unsaved changes will be lost
- **AND** if user confirms, applies preset
- **AND** if user cancels, remains on current preset

### Requirement: Current preset tracking
The system SHALL track which preset is currently active.

#### Scenario: Track active preset
- **WHEN** user applies a preset
- **THEN** system marks it as active in uiStore
- **AND** activePresetId is persisted

#### Scenario: Clear active preset on manual adjustment
- **WHEN** user manually adjusts layout while on a preset
- **THEN** system marks activePresetId as null (custom)
- **AND** future saves create new preset or update unnamed

### Requirement: Preset picker UI
The system SHALL provide a preset picker accessible from TopBar or StatusBar.

#### Scenario: Open preset picker
- **WHEN** user clicks preset picker
- **THEN** system shows dropdown/modal with preset list
- **AND** current preset is highlighted
- **AND** built-in presets have lock icon

#### Scenario: Quick preset switching
- **WHEN** user uses keyboard shortcut (Ctrl+Shift+P)
- **THEN** system opens preset picker

### Requirement: Reset to default layout
The system SHALL allow users to reset layout to system default.

#### Scenario: Reset layout
- **WHEN** user clicks "Reset to Default"
- **THEN** system applies built-in "Draft" preset
- **AND** clears activePresetId
