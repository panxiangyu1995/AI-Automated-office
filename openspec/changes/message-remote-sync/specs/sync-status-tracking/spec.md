## ADDED Requirements

### Requirement: Message sync status tracking
The system SHALL track the sync status of each message: local, pending, synced, or conflict.

#### Scenario: New message has pending status
- **WHEN** a new message is created
- **THEN** its sync_status SHALL be set to 'pending'

#### Scenario: Successful sync updates status
- **WHEN** a pending message is successfully synced to server
- **THEN** its sync_status SHALL be updated to 'synced' and remote_id set

#### Scenario: Sync failure marks message
- **WHEN** sync attempt fails for a message
- **THEN** its sync_status SHALL remain 'pending' and error SHALL be logged

### Requirement: Sync status indicator in UI
The system SHALL display sync status indicators in the message list without blocking user interaction.

#### Scenario: Pending message shows indicator
- **WHEN** a message has sync_status='pending'
- **THEN** a subtle sync icon SHALL be shown next to the message

#### Scenario: Conflict message highlighted
- **WHEN** a message has sync_status='conflict'
- **THEN** it SHALL be visually highlighted with a warning indicator
