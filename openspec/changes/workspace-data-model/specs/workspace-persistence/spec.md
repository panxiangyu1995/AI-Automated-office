## ADDED Requirements

### Requirement: Workspace state persistence
The system SHALL persist workspace-related state to localStorage for offline access.

#### Scenario: Persist current workspace selection
- **WHEN** user switches to a workspace
- **THEN** system persists currentWorkspaceId to localStorage
- **AND** on app reload, restores the last selected workspace

#### Scenario: Restore workspace context on app load
- **WHEN** user opens the application
- **THEN** system reads currentWorkspaceId from localStorage
- **AND** validates user still has access to that workspace
- **AND** if not, clears selection and shows workspace picker

### Requirement: Workspace list caching
The system SHALL cache workspace list for the current tenant to reduce API calls.

#### Scenario: Cache workspace list
- **WHEN** user loads workspace list
- **THEN** system caches result in memory
- **AND** subsequent requests within 5 minutes use cache

#### Scenario: Invalidate cache on workspace change
- **WHEN** user creates, updates, or deletes a workspace
- **THEN** system invalidates the workspace list cache
- **AND** next list request fetches fresh data

### Requirement: Cloud sync for workspace data
The system SHALL sync workspace data to cloud using the existing sync engine.

#### Scenario: Sync workspace to cloud
- **WHEN** local workspace data changes
- **THEN** system queues delta sync to cloud
- **AND** uses existing conflict resolution strategy

#### Scenario: Offline workspace access
- **WHEN** user is offline and opens a previously loaded workspace
- **THEN** system serves data from local SQLite cache
- **AND** shows offline indicator in StatusBar
