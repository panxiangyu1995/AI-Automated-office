# Enterprise Tools - Resource

## ADDED Requirements

### Requirement: resource_query tool
The system SHALL provide a `resource_query` tool for querying cloud and workspace resources.

#### Scenario: Query local resources
- **WHEN** Agent calls `resource_query` with type=local and path
- **THEN** system SHALL return resource metadata for local path

#### Scenario: Query cloud resources
- **WHEN** Agent calls `resource_query` with type=cloud and bucket/key
- **THEN** system SHALL return resource metadata from cloud storage

#### Scenario: Query workspace resources
- **WHEN** Agent calls `resource_query` with type=workspace and page_id
- **THEN** system SHALL return resource metadata for workspace page

#### Scenario: Query with filters
- **WHEN** Agent calls `resource_query` with filters (dateRange, owner, type)
- **THEN** system SHALL return filtered results matching criteria

### Requirement: resource_upload tool
The system SHALL provide a `resource_upload` tool for uploading files to controlled storage.

#### Scenario: Upload to cloud storage
- **WHEN** Agent calls `resource_upload` with data and destination cloud path
- **THEN** system SHALL upload data and return resource metadata

#### Scenario: Upload to workspace
- **WHEN** Agent calls `resource_upload` with data and destination workspace/page
- **THEN** system SHALL attach resource to workspace and return metadata

#### Scenario: Upload with metadata
- **WHEN** Agent calls `resource_upload` with data, destination, and metadata
- **THEN** system SHALL upload data with metadata and return result

## Security Requirements

### Requirement: Resource access control
The resource tools SHALL enforce access control based on user permissions.

### Requirement: Upload size limit
The resource_upload tool SHALL enforce maximum upload size limits.

### Requirement: Allowed content types
The resource_upload tool SHALL validate uploaded content types.
