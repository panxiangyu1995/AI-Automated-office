## ADDED Requirements

### Requirement: Knowledge Base Create

The system SHALL allow users to create new knowledge bases.

#### Scenario: Successful Creation
- **WHEN** a user with write permission creates a knowledge base with name "Sales Policy"
- **THEN** the system SHALL create a new knowledge base record
- **AND** set `created_by` to the user's ID
- **AND** set `created_at` to current timestamp
- **AND** set `permission` to the specified value
- **AND** return the created knowledge base with its ID

#### Scenario: Name Uniqueness
- **WHEN** a user tries to create a knowledge base with a name that already exists in the tenant
- **THEN** the system SHALL return an error "Knowledge base name already exists"
- **AND** SHALL NOT create a duplicate

#### Scenario: Permission Required
- **WHEN** a user without write permission tries to create a knowledge base
- **THEN** the system SHALL return an error "Insufficient permissions"
- **AND** SHALL NOT create the knowledge base

### Requirement: Knowledge Base List

The system SHALL provide paginated listing of knowledge bases with permission filtering.

#### Scenario: List with Permission Filter
- **WHEN** a user requests their knowledge base list
- **THEN** the system SHALL return only knowledge bases the user can access
- **AND** include all_team knowledge bases
- **AND** include only_me knowledge bases created by the user
- **AND** include partial_team knowledge bases where user has permission

#### Scenario: Search by Name
- **WHEN** a list request includes `search: "sales"`
- **THEN** the system SHALL filter results by name containing "sales" (case-insensitive)

#### Scenario: Tag Filter
- **WHEN** a list request includes `tag_ids: ["tag-1", "tag-2"]`
- **THEN** the system SHALL return only knowledge bases with any of the specified tags

#### Scenario: Pagination
- **WHEN** a list request includes `page: 2, page_size: 20`
- **THEN** the system SHALL return items 21-40
- **AND** include `total` count of all matching knowledge bases
- **AND** include `has_more` boolean

### Requirement: Knowledge Base Get

The system SHALL return detailed information about a specific knowledge base.

#### Scenario: Successful Get
- **WHEN** a user with read permission requests a knowledge base by ID
- **THEN** the system SHALL return the full knowledge base details
- **AND** include document count, chunk count, total tokens
- **AND** include the creator's information

#### Scenario: Access Denied
- **WHEN** a user without permission requests a knowledge base
- **THEN** the system SHALL return error "Access denied"

#### Scenario: Not Found
- **WHEN** a user requests a non-existent knowledge base
- **THEN** the system SHALL return error "Knowledge base not found"

### Requirement: Knowledge Base Update

The system SHALL allow updating knowledge base settings and configuration.

#### Scenario: Update Name
- **WHEN** a user with admin permission updates the name
- **THEN** the system SHALL update the name
- **AND** validate uniqueness within tenant
- **AND** update `updated_at` timestamp

#### Scenario: Update Description
- **WHEN** a user with admin permission updates the description
- **THEN** the system SHALL update the description
- **AND** update `updated_at` timestamp

#### Scenario: Update Permission
- **WHEN** a user with admin permission changes permission from only_me to all_team
- **THEN** the system SHALL update the permission
- **AND** clear the knowledge_permissions table if changing to all_team
- **AND** update `updated_at` timestamp

### Requirement: Knowledge Base Delete

The system SHALL allow deleting knowledge bases with cascading cleanup.

#### Scenario: Cascade Delete Documents
- **WHEN** a knowledge base is deleted
- **THEN** the system SHALL delete all documents in that knowledge base
- **AND** delete all segments for those documents
- **AND** remove all vector entries from the vector store

#### Scenario: Cascade Delete Permissions
- **WHEN** a knowledge base is deleted
- **THEN** the system SHALL delete all knowledge_permissions records for that knowledge base

#### Scenario: Delete Requires Admin
- **WHEN** a user without admin permission tries to delete a knowledge base
- **THEN** the system SHALL return error "Admin permission required"

### Requirement: Knowledge Base Statistics

The system SHALL provide aggregate statistics for knowledge bases.

#### Scenario: Get Statistics
- **WHEN** requesting statistics for a knowledge base
- **THEN** the system SHALL return:
  - `document_count`: Number of documents
  - `indexed_document_count`: Number of indexed documents
  - `chunk_count`: Number of chunks
  - `total_tokens`: Total tokens indexed
  - `storage_size`: Estimated storage in bytes
