## ADDED Requirements

### Requirement: Project entity structure
The system SHALL define a Project entity with the following attributes:
- `id`: UUID, unique identifier
- `workspaceId`: UUID, reference to parent workspace
- `name`: string, project display name (max 100 chars)
- `description`: string, optional description (max 500 chars)
- `status`: enum, one of [active, archived]
- `toolConfig`: JSON, project-level tool and plugin configuration
- `permissionScope`: JSON, project-level permission scope overrides
- `templateId`: UUID, optional reference to project template
- `createdBy`: UUID, user who created the project
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### Scenario: Create project in workspace
- **WHEN** user creates a new project in a workspace
- **THEN** system generates UUID, sets status to active, and links to workspace

#### Scenario: Project inherits workspace settings
- **WHEN** project is created without explicit toolConfig
- **THEN** system SHALL inherit toolConfig from parent workspace settings

### Requirement: Project CRUD operations
The system SHALL support standard CRUD operations for projects within a workspace.

#### Scenario: List projects in workspace
- **WHEN** user requests project list for a workspace
- **THEN** system returns all non-archived projects by default
- **AND** supports filter parameter to include archived projects

#### Scenario: Archive project
- **WHEN** user archives a project
- **THEN** system sets status to archived
- **AND** project is excluded from default project list
- **AND** project data is preserved

#### Scenario: Restore archived project
- **WHEN** user restores an archived project
- **THEN** system sets status to active
- **AND** project reappears in default project list

### Requirement: Project isolation
The system SHALL ensure project-level data isolation. Projects in different workspaces SHALL NOT be able to access each other's data.

#### Scenario: Cross-workspace project access denied
- **WHEN** user in Workspace A attempts to access project in Workspace B
- **THEN** system returns permission denied error
