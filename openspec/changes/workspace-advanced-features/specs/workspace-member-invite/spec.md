## ADDED Requirements

### Requirement: Invite member to workspace
The system SHALL allow admins to invite users to workspace.

#### Scenario: Invite by email
- **WHEN** admin enters user email to invite
- **THEN** system searches for existing user
- **AND** if found, adds them to workspace with selected role
- **AND** if not found, shows option to send invitation email

#### Scenario: Invite by username
- **WHEN** admin enters username to invite
- **THEN** system searches for user in tenant
- **AND** adds them to workspace with selected role

### Requirement: Invite approval flow
The system SHALL support optional approval for workspace invitations.

#### Scenario: Direct add (no approval)
- **WHEN** admin adds user directly
- **THEN** user immediately gains access to workspace

#### Scenario: Request approval
- **WHEN** workspace requires approval for joining
- **THEN** system creates pending invitation
- **AND** notifies workspace admins
- **AND** user gains access after approval

### Requirement: Member role assignment
The system SHALL allow assigning roles when inviting members.

#### Scenario: Assign role during invite
- **WHEN** admin invites user
- **THEN** admin selects role (owner/admin/member/viewer)
- **AND** user is added with that role

#### Scenario: Change member role
- **WHEN** admin changes member role
- **THEN** system updates WorkspaceMember.role
- **AND** new permissions take effect immediately

### Requirement: Remove member from workspace
The system SHALL allow admins to remove members.

#### Scenario: Remove member
- **WHEN** admin removes a member
- **THEN** system soft-deletes WorkspaceMember
- **AND** user loses workspace access immediately

#### Scenario: Cannot remove owner
- **WHEN** admin attempts to remove workspace owner
- **THEN** system rejects operation
- **AND** shows error message

### Requirement: Member list view
The system SHALL provide a list view of all workspace members.

#### Scenario: View member list
- **WHEN** admin opens workspace member management
- **THEN** system shows all members with roles
- **AND** shows their last active time

#### Scenario: Filter members by role
- **WHEN** admin filters member list by role
- **THEN** system shows only members with that role
