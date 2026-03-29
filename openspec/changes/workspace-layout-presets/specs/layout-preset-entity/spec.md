## ADDED Requirements

### Requirement: LayoutPreset structure
The system SHALL define a LayoutPreset entity with the following attributes:
- `id`: UUID, unique identifier
- `name`: string, preset display name (max 50 chars)
- `description`: string, optional description (max 200 chars)
- `icon`: string, icon identifier (e.g., "Focus", "Approval", "Draft", "Audit")
- `isBuiltIn`: boolean, whether this is a system-provided preset
- `workspaceId`: UUID | null, null means global preset
- `config`: JSON object containing layout configuration
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### Scenario: Create custom preset structure
- **WHEN** user creates a new layout preset
- **THEN** system generates UUID and sets timestamps
- **AND** isBuiltIn is false
- **AND** config contains all required layout fields

#### Scenario: Built-in preset structure
- **WHEN** system initializes built-in presets
- **THEN** each preset has isBuiltIn = true
- **AND** workspaceId is null (global)
- **AND** cannot be deleted or renamed

### Requirement: Layout config structure
The layout config SHALL contain:
- `sidebar`: { width: number, collapsed: boolean }
- `chatPanel`: { width: number, collapsed: boolean }
- `bottomPanel`: { height: number, collapsed: boolean }
- `topBar`: { visible: boolean }
- `openTabs`: string[], list of open tab identifiers
- `activeTab`: string, currently active tab
- `filters`: Record<string, any>, workspace-specific filter state
- `aiPanel`: { open: boolean, sessionId?: string }

#### Scenario: Complete layout config
- **WHEN** preset is saved with full layout
- **THEN** all config fields are persisted
- **AND** can be restored exactly

#### Scenario: Partial layout config
- **WHEN** preset has only partial config
- **THEN** missing fields use default values on restore
