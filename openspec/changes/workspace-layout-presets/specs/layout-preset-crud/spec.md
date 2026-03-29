## ADDED Requirements

### Requirement: Create layout preset
The system SHALL allow users to create new layout presets.

#### Scenario: Create preset from current layout
- **WHEN** user clicks "Save as Preset" and enters name
- **THEN** system captures current layout state
- **AND** creates new preset with captured config
- **AND** preset is stored in localStorage

#### Scenario: Create preset with missing name
- **WHEN** user attempts to create preset without name
- **THEN** system shows validation error
- **AND** does not create preset

#### Scenario: Workspace preset count limit
- **WHEN** user has 10 custom presets in a workspace
- **THEN** system shows warning that limit is reached
- **AND** user must delete existing preset to create new one

### Requirement: Read layout presets
The system SHALL provide ability to list presets.

#### Scenario: List all accessible presets
- **WHEN** user opens preset picker
- **THEN** system shows all built-in presets
- **AND** all custom presets for current workspace
- **AND** global custom presets

#### Scenario: Filter presets by workspace
- **WHEN** user is in a specific workspace
- **THEN** presets shown include:
  - All built-in presets (always available)
  - Custom presets for this workspace
  - Global custom presets

### Requirement: Update layout preset
The system SHALL allow users to update custom presets.

#### Scenario: Update preset config
- **WHEN** user modifies layout and saves to existing preset
- **THEN** system updates preset config
- **AND** updates updatedAt timestamp

#### Scenario: Update built-in preset attempt
- **WHEN** user attempts to modify built-in preset
- **THEN** system rejects the operation
- **AND** shows error message

### Requirement: Delete layout preset
The system SHALL allow users to delete custom presets.

#### Scenario: Delete custom preset
- **WHEN** user deletes a custom preset
- **THEN** system removes preset from storage
- **AND** if it was active, falls back to default layout

#### Scenario: Delete built-in preset attempt
- **WHEN** user attempts to delete built-in preset
- **THEN** system rejects the operation
- **AND** shows error message

### Requirement: Duplicate preset
The system SHALL allow users to duplicate an existing preset as a starting point.

#### Scenario: Duplicate preset
- **WHEN** user duplicates a preset
- **THEN** system creates new preset with "Copy of" prefix
- **AND** new preset has isBuiltIn = false
