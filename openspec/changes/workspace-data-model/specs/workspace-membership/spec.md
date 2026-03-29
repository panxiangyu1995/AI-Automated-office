## ADDED Requirements

### Requirement: Workspace membership structure
The system SHALL define a WorkspaceMember entity with the following attributes:
- `id`: UUID, unique identifier
- `workspaceId`: UUID, reference to workspace
- `userId`: UUID, reference to user
- `role`: enum, one of [owner, admin, member, viewer]
- `createdAt`: timestamp
- `createdBy`: UUID, user who added this member

#### Scenario: Add member to workspace
- **WHEN** admin adds a user to workspace
- **THEN** system creates WorkspaceMember record with role
- **AND** user gains access to workspace based on role

### Requirement: Workspace roles and permissions
The system SHALL enforce the following role permissions:
- `owner`: full control, can delete workspace, cannot be removed
- `admin`: can manage members, settings, cannot delete workspace
- `member`: can create/edit projects, cannot manage settings
- `viewer`: read-only access to workspace and projects

#### Scenario: Owner role is irrevocable
- **WHEN** admin attempts to remove owner from workspace
- **THEN** system rejects the operation with error

#### Scenario: Role-based access control
- **WHEN** viewer attempts to create a project
- **THEN** system returns permission denied error

### Requirement: Member removal
The system SHALL allow admins to remove members from workspace, except the owner.

#### Scenario: Remove member from workspace
- **WHEN** admin removes a member from workspace
- **THEN** system soft-deletes the WorkspaceMember record
- **AND** user loses access to workspace immediately

### Requirement: Transfer ownership
The system SHALL allow owner to transfer ownership to another admin.

#### Scenario: Transfer workspace ownership
- **WHEN** owner transfers ownership to admin
- **THEN** system updates role to admin for old owner
- **AND** new owner receives owner role
- **AND** old owner becomes admin
