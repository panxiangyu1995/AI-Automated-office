## ADDED Requirements

### Requirement: Sync engine manages local and remote message state
The system SHALL provide a SyncEngine that manages the synchronization state between local SQLite and remote server.

#### Scenario: SyncEngine initializes with local messages
- **WHEN** the application starts
- **THEN** SyncEngine SHALL load messages from local SQLite and merge with any pending remote changes

#### Scenario: New local message queued for sync
- **WHEN** user creates a new message
- **THEN** the message SHALL be saved locally with sync_status='pending' and queued for remote sync

#### Scenario: SyncEngine processes sync queue
- **WHEN** there are pending messages and network is available
- **THEN** SyncEngine SHALL upload pending messages to remote server and update sync_status to 'synced'

### Requirement: Sync triggers on lifecycle events
The system SHALL trigger synchronization at application startup, periodically during active use, and at shutdown.

#### Scenario: Startup sync
- **WHEN** application starts
- **THEN** a full sync SHALL be performed within 5 seconds

#### Scenario: Periodic incremental sync
- **WHEN** application is actively used
- **THEN** incremental sync SHALL occur every 60 seconds

#### Scenario: Shutdown sync
- **WHEN** application closes
- **THEN** all pending messages SHALL be synced before shutdown (with 5 second timeout)
