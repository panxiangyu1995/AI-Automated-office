## ADDED Requirements

### Requirement: Workspace creation API
The system SHALL provide an API endpoint to create a new workspace:
- **POST** `/api/workspaces`
- Request body: `{ name, description?, icon?, tenantId }`
- Response: created workspace object with 201 status

#### Scenario: Create workspace successfully
- **WHEN** user calls POST /api/workspaces with valid data
- **THEN** system creates workspace
- **AND** returns workspace with 201 status

#### Scenario: Create workspace with duplicate name
- **WHEN** user creates workspace with name that already exists in tenant
- **THEN** system allows it (names need not be unique)

### Requirement: Workspace retrieval API
The system SHALL provide API endpoints to retrieve workspace(s):
- **GET** `/api/workspaces/:id` - single workspace
- **GET** `/api/workspaces?tenantId=:tenantId` - list by tenant

#### Scenario: Get workspace by ID
- **WHEN** user calls GET /api/workspaces/:id
- **THEN** system returns workspace if user has access
- **AND** returns 404 if not found

### Requirement: Workspace update API
The system SHALL provide an API endpoint to update workspace:
- **PATCH** `/api/workspaces/:id`
- Request body: `{ name?, description?, icon?, settings? }`
- Response: updated workspace object

#### Scenario: Update workspace with valid data
- **WHEN** admin calls PATCH /api/workspaces/:id with valid data
- **THEN** system updates workspace
- **AND** returns updated workspace

### Requirement: Workspace deletion API
The system SHALL provide an API endpoint to delete workspace:
- **DELETE** `/api/workspaces/:id`
- Response: 204 No Content on success

#### Scenario: Delete empty workspace
- **WHEN** owner deletes workspace with no projects
- **THEN** system soft-deletes workspace
- **AND** returns 204

#### Scenario: Delete workspace with projects fails
- **WHEN** owner deletes workspace with existing projects
- **THEN** system returns 409 Conflict with error message
