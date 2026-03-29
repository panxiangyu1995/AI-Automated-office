## ADDED Requirements

### Requirement: Recent access tracking
The system SHALL track when users access resources and store this information.

#### Scenario: Track project access
- **WHEN** user opens a project
- **THEN** system SHALL record access with timestamp
- **AND** resource type as "project"
- **AND** workspace context

#### Scenario: Track document access
- **WHEN** user opens a document
- **THEN** system SHALL record access with timestamp
- **AND** resource type as "document"

### Requirement: Recent access storage
The system SHALL store recent access records in localStorage.

#### Scenario: Persist recent access
- **WHEN** user accesses a resource
- **THEN** system SHALL save access record to localStorage
- **AND** include: resourceId, resourceType, workspaceId, accessedAt

#### Scenario: Limit recent records
- **WHEN** user exceeds 20 recent access records
- **THEN** system SHALL remove oldest records
- **AND** keep most recent 20

### Requirement: Recent access by workspace
The system SHALL scope recent access records to current workspace context.

#### Scenario: Filter by workspace
- **WHEN** Quick Open shows recent items
- **THEN** system SHALL display items from current workspace first
- **AND** then items from other workspaces

#### Scenario: Clear workspace recent access
- **WHEN** user clears workspace data
- **THEN** system SHALL remove recent access records for that workspace

### Requirement: Access record structure
Recent access records SHALL contain:
- `resourceId`: string, unique identifier of resource
- `resourceType`: enum, one of [project, document, template, knowledge, user]
- `workspaceId`: UUID, workspace context
- `title`: string, display title at time of access
- `subtitle`: string, display subtitle at time of access
- `accessedAt`: ISO timestamp

#### Scenario: Store complete access record
- **WHEN** user accesses a project
- **THEN** system SHALL store all required fields
- **AND** allow reconstruction of Quick Open result item

### Requirement: Update access on repeated access
The system SHALL update the timestamp when a resource is accessed again.

#### Scenario: Re-access same resource
- **WHEN** user accesses a resource that exists in recent list
- **THEN** system SHALL update its accessedAt to current time
- **AND** move it to top of recent list
