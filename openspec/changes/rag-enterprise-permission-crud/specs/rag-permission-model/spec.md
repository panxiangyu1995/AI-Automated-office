## ADDED Requirements

### Requirement: Knowledge Permission Enum

The system SHALL define three types of knowledge base permissions for access control.

#### Scenario: OnlyMe Permission
- **WHEN** a knowledge base has `permission: "only_me"`
- **THEN** only the creator can access it
- **AND** other users SHALL NOT see it in their knowledge base list

#### Scenario: AllTeam Permission
- **WHEN** a knowledge base has `permission: "all_team"`
- **THEN** all users in the same tenant can access it
- **AND** it SHALL appear in everyone's knowledge base list

#### Scenario: PartialTeam Permission
- **WHEN** a knowledge base has `permission: "partial_team"`
- **THEN** only users in the permission list can access it
- **AND** it SHALL only appear in the knowledge base list of permitted users

### Requirement: Knowledge Base Model

The system SHALL provide a comprehensive KnowledgeBase data model.

#### Scenario: KnowledgeBase Fields
- **WHEN** creating a knowledge base
- **THEN** it SHALL include:
  - `id`: Unique identifier (UUID)
  - `tenant_id`: Tenant identifier for isolation
  - `name`: Knowledge base name (max 255 chars)
  - `description`: Optional description (max 1000 chars)
  - `permission`: Permission type (only_me/all_team/partial_team)
  - `created_by`: Creator user ID
  - `created_at`: Creation timestamp
  - `updated_by`: Last modifier user ID
  - `updated_at`: Last modification timestamp
  - `document_count`: Total documents count
  - `chunk_count`: Total chunks count
  - `total_tokens`: Total tokens indexed

### Requirement: Permission Validation Service

The system SHALL provide a permission validation service for access control.

#### Scenario: Tenant Isolation Check
- **WHEN** a user tries to access a knowledge base
- **THEN** the system SHALL verify the user belongs to the same tenant
- **AND** reject access if tenants don't match

#### Scenario: Owner Bypass
- **WHEN** a user with OWNER role accesses any knowledge base in their tenant
- **THEN** the system SHALL bypass all permission checks
- **AND** allow access

#### Scenario: OnlyMe Access Check
- **WHEN** a user accesses a knowledge base with only_me permission
- **THEN** the system SHALL verify the user is the creator
- **OR** reject access

#### Scenario: PartialTeam Access Check
- **WHEN** a user accesses a knowledge base with partial_team permission
- **THEN** the system SHALL check the knowledge_permissions table
- **AND** verify the user has an explicit permission record

### Requirement: KnowledgePermissionRecord Model

The system SHALL track explicit permission grants for partial_team knowledge bases.

#### Scenario: PermissionRecord Fields
- **WHEN** granting access to a user
- **THEN** the system SHALL create a permission record with:
  - `id`: Unique identifier
  - `knowledge_base_id`: Target knowledge base
  - `user_id`: Granted user
  - `tenant_id`: Tenant identifier
  - `has_permission`: Boolean flag
  - `granted_by`: Granting user ID
  - `granted_at`: Grant timestamp

#### Scenario: Permission Record Lookup
- **WHEN** checking partial_team access
- **THEN** the system SHALL query the knowledge_permissions table
- **AND** verify `has_permission: true` for the user

### Requirement: Access Level

The system SHALL define three levels of access for fine-grained control.

#### Scenario: Read Access
- **WHEN** a user has Read access
- **THEN** they can list documents and retrieve chunks
- **AND** they CANNOT modify documents or settings

#### Scenario: Write Access
- **WHEN** a user has Write access
- **THEN** they can do everything Read allows
- **AND** they CAN upload, update, and delete documents
- **AND** they CAN modify document metadata

#### Scenario: Admin Access
- **WHEN** a user has Admin access
- **THEN** they can do everything Write allows
- **AND** they CAN modify knowledge base settings
- **AND** they CAN change permissions
- **AND** they CAN manage members
