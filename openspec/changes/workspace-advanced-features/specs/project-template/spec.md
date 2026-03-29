## ADDED Requirements

### Requirement: ProjectTemplate structure
The system SHALL define a ProjectTemplate entity with the following attributes:
- `id`: UUID, unique identifier
- `workspaceId`: UUID | null, null means global template
- `name`: string, template display name (max 100 chars)
- `description`: string, optional description (max 500 chars)
- `icon`: string, icon identifier
- `config`: JSON containing default project configuration
- `isBuiltIn`: boolean, whether system-provided template
- `createdBy`: UUID
- `createdAt`: timestamp

#### Scenario: Create project template
- **WHEN** admin creates a project template
- **THEN** system generates UUID and sets timestamps
- **AND** template is available for project creation

### Requirement: Template list and filtering
The system SHALL provide ability to list templates by workspace.

#### Scenario: List workspace templates
- **WHEN** user opens template picker for project creation
- **THEN** system shows:
  - Built-in templates (always available)
  - Templates created in current workspace
  - Global templates from other workspaces (if permitted)

#### Scenario: Filter templates
- **WHEN** user searches templates by name
- **THEN** system filters template list

### Requirement: Create project from template
The system SHALL allow creating a new project using a template.

#### Scenario: Create project with template
- **WHEN** user selects template and creates project
- **THEN** system creates new project
- **AND** applies template's config to project
- **AND** project is created in selected workspace

#### Scenario: Template missing workspace
- **WHEN** template references deleted workspace
- **THEN** system uses platform defaults for that section

### Requirement: Template management
The system SHALL allow managing project templates.

#### Scenario: Edit template
- **WHEN** admin edits a template
- **THEN** system updates template configuration
- **AND** existing projects using this template are unaffected

#### Scenario: Delete template
- **WHEN** admin deletes a template
- **THEN** system soft-deletes template
- **AND** existing projects retain their copied configuration

#### Scenario: Duplicate template
- **WHEN** admin duplicates a template
- **THEN** system creates a new template with copied config
- **AND** new template is editable
