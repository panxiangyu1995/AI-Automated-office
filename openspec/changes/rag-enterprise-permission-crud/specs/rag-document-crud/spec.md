## ADDED Requirements

### Requirement: Document Upload

The system SHALL allow uploading documents to a knowledge base.

#### Scenario: Successful Upload
- **WHEN** a user uploads a document to a knowledge base they have write permission for
- **THEN** the system SHALL create a document record with status "pending"
- **AND** store the file content
- **AND** trigger async indexing pipeline
- **AND** return the document metadata with its ID

#### Scenario: File Type Validation
- **WHEN** a user uploads a file with unsupported type
- **THEN** the system SHALL return error "Unsupported file type"
- **AND** supported types SHALL be: pdf, docx, txt, md, html, csv

#### Scenario: File Size Limit
- **WHEN** a user uploads a file exceeding 100MB
- **THEN** the system SHALL return error "File size exceeds limit (100MB)"

### Requirement: Document List

The system SHALL provide paginated listing of documents in a knowledge base.

#### Scenario: List Documents
- **WHEN** a user with read permission lists documents in a knowledge base
- **THEN** the system SHALL return paginated document list
- **AND** include document metadata (name, size, type, status, upload time)

#### Scenario: Filter by Status
- **WHEN** a list request includes `status: "completed"`
- **THEN** the system SHALL return only documents with that status

#### Scenario: Filter by Date Range
- **WHEN** a list request includes `created_after` and `created_before`
- **THEN** the system SHALL return documents created within that range

### Requirement: Document Update

The system SHALL allow updating document metadata and settings.

#### Scenario: Update Tags
- **WHEN** a user with write permission updates document tags
- **THEN** the system SHALL update the tags field
- **AND** update `updated_at` timestamp

#### Scenario: Update Custom Metadata
- **WHEN** a user with write permission updates custom metadata
- **THEN** the system SHALL merge with existing metadata
- **AND** preserve built-in fields

### Requirement: Document Delete

The system SHALL allow deleting documents from a knowledge base.

#### Scenario: Delete Document
- **WHEN** a user with write permission deletes a document
- **THEN** the system SHALL remove the document record
- **AND** delete all associated segments
- **AND** remove all vector entries for that document

#### Scenario: Delete Triggers Reindex
- **WHEN** a document is deleted
- **THEN** the knowledge base document count SHALL be decremented

### Requirement: Document Batch Operations

The system SHALL support batch operations for managing multiple documents.

#### Scenario: Batch Update Status
- **WHEN** a user requests batch status update with `document_ids: ["doc-1", "doc-2"]` and `status: "archived"`
- **THEN** the system SHALL update all specified documents
- **AND** return counts of successful and failed updates

#### Scenario: Batch Delete
- **WHEN** a user requests batch delete with `document_ids: ["doc-1", "doc-2"]`
- **THEN** the system SHALL delete all specified documents
- **AND** handle partial failures gracefully
- **AND** return results with errors if any

### Requirement: Document Processing Status

The system SHALL track and report document indexing status.

#### Scenario: Processing States
- **WHEN** a document is being processed
- **THEN** status SHALL be one of: "pending", "parsing", "cleaning", "splitting", "indexing", "completed", "error"

#### Scenario: Error Reporting
- **WHEN** a document fails during processing
- **THEN** status SHALL be "error"
- **AND** error message SHALL be stored in `error` field
- **AND** error timestamp SHALL be stored in `error_at` field

#### Scenario: Retry Processing
- **WHEN** a user retries a failed document
- **THEN** the system SHALL reset status to "pending"
- **AND** re-trigger the indexing pipeline
