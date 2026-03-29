## ADDED Requirements

### Requirement: Current workspace context
The system SHALL maintain a `currentWorkspaceId` in the global state (Zustand store).

#### Scenario: Workspace context is accessible globally
- **WHEN** any component reads currentWorkspaceId from workspaceStore
- **THEN** system returns the currently active workspace ID

### Requirement: Workspace switching
The system SHALL allow users to switch between workspaces they have access to.

#### Scenario: Switch to different workspace
- **WHEN** user selects a different workspace from workspace switcher
- **THEN** system updates currentWorkspaceId in workspaceStore
- **AND** system updates currentProjectId to null
- **AND** system persists the selection to localStorage

#### Scenario: Switch workspace with unsaved changes
- **WHEN** user attempts to switch workspace with unsaved changes
- **THEN** system shows confirmation dialog
- **AND** if user confirms, proceeds with switch
- **AND** if user cancels, remains in current workspace

### Requirement: Workspace switcher UI
The system SHALL provide a workspace switcher component accessible from the TopBar or ActivityBar.

#### Scenario: Open workspace switcher
- **WHEN** user clicks workspace switcher
- **THEN** system displays list of accessible workspaces
- **AND** current workspace is highlighted

#### Scenario: Search workspaces in switcher
- **WHEN** user types in workspace switcher search
- **THEN** system filters workspace list by name
