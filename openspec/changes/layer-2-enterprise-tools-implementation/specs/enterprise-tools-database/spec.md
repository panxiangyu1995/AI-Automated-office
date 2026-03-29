# Enterprise Tools - Database

## ADDED Requirements

### Requirement: db_query tool
The system SHALL provide a `db_query` tool for querying cloud database (restricted to admin users).

#### Scenario: Query with valid table
- **WHEN** Admin calls `db_query` with table name from whitelist and filters
- **THEN** system SHALL return query results

#### Scenario: Query with non-whitelisted table
- **WHEN** Agent calls `db_query` with table name not in whitelist
- **THEN** system SHALL return error with code `PermissionDenied`

#### Scenario: Query without admin permission
- **WHEN** Non-admin calls `db_query`
- **THEN** system SHALL return error with code `PermissionDenied`

#### Scenario: Query with pagination
- **WHEN** Admin calls `db_query` with page and pageSize
- **THEN** system SHALL return paginated results

#### Scenario: Query with aggregation
- **WHEN** Admin calls `db_query` with aggregation functions
- **THEN** system SHALL return aggregated results

## Security Requirements

### Requirement: Admin-only access
The db_query tool SHALL only be accessible to users with admin role.

### Requirement: Table whitelist
The db_query tool SHALL only allow queries on whitelisted tables.

### Requirement: Field masking
The db_query tool SHALL automatically mask sensitive fields (password, token, secret).

### Requirement: Tenant isolation
The db_query tool SHALL automatically inject tenant_id filter for multi-tenant tables.

### Requirement: Audit logging
All db_query executions SHALL be logged with user, query, timestamp.

### Requirement: Query timeout
The db_query tool SHALL enforce maximum query execution time (default: 30s).

### Requirement: Row limit
The db_query tool SHALL enforce maximum rows returned (default: 1000).

## Whitelist Tables

### Requirement: Configurable table whitelist
The allowed tables SHALL be configurable via system settings.

### Requirement: Default whitelist
Default whitelisted tables SHALL include only system configuration tables.
