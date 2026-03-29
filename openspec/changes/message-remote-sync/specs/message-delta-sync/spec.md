## ADDED Requirements

### Requirement: Delta sync protocol based on timestamps
The system SHALL sync only messages that have changed since last sync, using updated_at timestamps.

#### Scenario: Pull only changed messages
- **WHEN** sync is triggered
- **THEN** the system SHALL request messages where updated_at > last_sync_timestamp

#### Scenario: Push only local changes
- **WHEN** uploading messages to server
- **THEN** only messages with sync_status='pending' SHALL be sent

### Requirement: Soft delete synchronization
The system SHALL support soft delete, syncing deleted_at timestamps rather than physical deletion.

#### Scenario: Local deletion synced to remote
- **WHEN** a message is deleted locally
- **THEN** deleted_at SHALL be set and synced to remote server

#### Scenario: Remote deletion applied locally
- **WHEN** a message is deleted on remote server
- **THEN** the local message SHALL have deleted_at set and be hidden from UI
