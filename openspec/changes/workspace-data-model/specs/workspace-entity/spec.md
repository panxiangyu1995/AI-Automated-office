## ADDED Requirements

### Requirement: Workspace entity structure
The system SHALL define a Workspace entity with the following attributes:
- `id`: UUID, unique identifier
- `tenantId`: UUID, reference to tenant
- `name`: string, workspace display name (max 100 chars)
- `description`: string, optional description (max 500 chars)
- `icon`: string, optional icon identifier
- `settings`: JSON, workspace-level configuration (tools, plugins, etc.)
- `createdBy`: UUID, user who created the workspace
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `isDefault`: boolean, whether this is the default workspace for the tenant

#### Scenario: Create workspace with required fields
- **WHEN** user creates a new workspace with name and tenantId
- **THEN** system generates a unique UUID and sets creation timestamps

#### Scenario: Workspace settings store JSON configuration
- **WHEN** workspace settings are updated
- **THEN** system SHALL validate the JSON structure before saving

### Requirement: Workspace list retrieval
The system SHALL provide the ability to list all workspaces for a tenant, sorted by creation date descending.

#### Scenario: List workspaces for a tenant
- **WHEN** user requests workspace list for a tenant
- **THEN** system returns all workspaces belonging to that tenant
- **AND** results are sorted by createdAt descending

### Requirement: Workspace update
The system SHALL allow updating workspace name, description, icon, and settings.

#### Scenario: Update workspace name
- **WHEN** user updates workspace name
- **THEN** system validates name is not empty and updates updatedAt timestamp

#### Scenario: Update workspace settings
- **WHEN** admin updates workspace settings with invalid JSON
- **THEN** system rejects the update and returns validation error

### Requirement: Workspace deletion
The system SHALL support soft-delete of workspaces. Hard delete SHALL only be allowed if no projects exist in the workspace.

#### Scenario: Delete workspace with no projects
- **WHEN** admin deletes a workspace with zero projects
- **THEN** system soft-deletes the workspace (sets deletedAt timestamp)

#### Scenario: Delete workspace with existing projects
- **WHEN** admin attempts to delete a workspace that has projects
- **THEN** system returns error indicating projects must be archived or moved first
