## ADDED Requirements

### Requirement: Built-in preset initialization
The system SHALL create 4 built-in presets on first launch:
- 专注模式 (Focus Mode)
- 审批模式 (Approval Mode)
- 起草模式 (Draft Mode)
- 审计模式 (Audit Mode)

#### Scenario: Initialize built-in presets
- **WHEN** application initializes
- **THEN** system checks for built-in presets in storage
- **AND** if missing, creates them

### Requirement: Focus Mode preset
The Focus Mode preset SHALL provide distraction-free environment:
- sidebar: collapsed
- chatPanel: collapsed
- bottomPanel: collapsed
- topBar: visible
- openTabs: only current tab
- aiPanel: closed

#### Scenario: Apply Focus Mode
- **WHEN** user applies Focus Mode preset
- **THEN** all panels are hidden
- **AND** only workbench content is visible

### Requirement: Approval Mode preset
The Approval Mode preset SHALL support approval workflows:
- sidebar: visible (width: 240)
- chatPanel: visible (width: 400)
- bottomPanel: collapsed
- topBar: visible
- openTabs: [dashboard, approval-list]
- aiPanel: open

#### Scenario: Apply Approval Mode
- **WHEN** user applies Approval Mode preset
- **THEN** sidebar and chat panel are visible
- **AND** default to approval-related tabs

### Requirement: Draft Mode preset
The Draft Mode preset SHALL provide full-featured workspace:
- sidebar: visible (width: 240)
- chatPanel: visible (width: 400)
- bottomPanel: visible (height: 200)
- topBar: visible
- openTabs: [dashboard, projects, documents]
- aiPanel: open

#### Scenario: Apply Draft Mode
- **WHEN** user applies Draft Mode preset
- **AND** this is the default preset

### Requirement: Audit Mode preset
The Audit Mode preset SHALL support auditing activities:
- sidebar: collapsed
- chatPanel: collapsed
- bottomPanel: visible (height: 300)
- topBar: visible
- openTabs: [audit-log]
- aiPanel: closed

#### Scenario: Apply Audit Mode
- **WHEN** user applies Audit Mode preset
- **THEN** bottom panel is visible with audit logs
- **AND** other panels are hidden

### Requirement: Built-in preset immutability
Built-in presets SHALL NOT be deletable or directly editable.

#### Scenario: Attempt to delete built-in preset
- **WHEN** user attempts to delete a built-in preset
- **THEN** system rejects the operation
- **AND** shows message that built-in presets cannot be deleted

#### Scenario: Attempt to edit built-in preset
- **WHEN** user attempts to edit built-in preset name or config
- **THEN** system rejects the operation
- **AND** suggests duplicating the preset instead
