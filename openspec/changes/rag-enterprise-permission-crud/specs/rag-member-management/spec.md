## ADDED Requirements

### Requirement: List Knowledge Base Members

The system SHALL allow listing members who have access to a partial_team knowledge base.

#### Scenario: List Members
- **WHEN** a user with admin permission lists members for a partial_team knowledge base
- **THEN** the system SHALL return all users with explicit permissions
- **AND** include user details (ID, name, email)

#### Scenario: Members for Non-Partial
- **WHEN** a user lists members for an all_team knowledge base
- **THEN** the system SHALL return all tenant members
- **OR** return an error indicating membership is tenant-wide

### Requirement: Add Knowledge Base Member

The system SHALL allow adding members to a partial_team knowledge base.

#### Scenario: Add Single Member
- **WHEN** an admin adds user "user-123" to a knowledge base
- **THEN** the system SHALL create a permission record with:
  - `knowledge_base_id`: target knowledge base
  - `user_id`: "user-123"
  - `tenant_id`: same as knowledge base
  - `has_permission`: true
  - `granted_by`: admin user ID
  - `granted_at`: current timestamp

#### Scenario: Add Multiple Members
- **WHEN** an admin adds members with `member_ids: ["user-1", "user-2", "user-3"]`
- **THEN** the system SHALL create permission records for all users
- **AND** handle partial failures gracefully

#### Scenario: Add to Non-Partial
- **WHEN** an admin tries to add members to an all_team knowledge base
- **THEN** the system SHALL return error "Cannot add members to all_team knowledge base"

### Requirement: Remove Knowledge Base Member

The system SHALL allow removing members from a partial_team knowledge base.

#### Scenario: Remove Member
- **WHEN** an admin removes user "user-123" from a knowledge base
- **THEN** the system SHALL set `has_permission: false` in the permission record
- **OR** delete the permission record entirely

#### Scenario: Remove Non-Member
- **WHEN** an admin tries to remove a user who is not a member
- **THEN** the system SHALL return success (idempotent operation)

### Requirement: Update Member Permission

The system SHALL allow updating member permission status.

#### Scenario: Disable Member Access
- **WHEN** an admin disables access for a member
- **THEN** the system SHALL update the permission record
- **AND** the user SHALL lose access immediately

#### Scenario: Re-enable Member Access
- **WHEN** an admin re-enables access for a previously disabled member
- **THEN** the system SHALL update the permission record
- **AND** the user SHALL regain access

### Requirement: Transfer Ownership

The system SHALL allow transferring knowledge base ownership.

#### Scenario: Transfer to Another User
- **WHEN** the owner transfers ownership to another user
- **THEN** the system SHALL:
  - Update `created_by` to the new owner
  - Add new owner to permission list with admin access
  - Optionally remove old owner from admin access

#### Scenario: Transfer Requires Owner
- **WHEN** a non-owner tries to transfer ownership
- **THEN** the system SHALL return error "Only owner can transfer ownership"
