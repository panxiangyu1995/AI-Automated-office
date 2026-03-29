# Layer 2 Enterprise Tools Implementation Tasks

## 1. Project Setup

- [ ] 1.1 Create `src-tauri/src/agent/tools/enterprise/` directory structure
- [ ] 1.2 Create module entry point `enterprise/mod.rs`
- [ ] 1.3 Add required dependencies (aws-sdk for S3, etc.)
- [ ] 1.4 Configure Cargo.toml with new dependencies

## 2. Resource Tools Implementation

- [ ] 2.1 Define ResourceService trait
- [ ] 2.2 Implement local resource handler
- [ ] 2.3 Implement cloud storage handler (S3 compatible)
- [ ] 2.4 Implement workspace resource handler
- [ ] 2.5 Implement `resource_query` tool
- [ ] 2.6 Implement `resource_upload` tool
- [ ] 2.7 Add access control checks
- [ ] 2.8 Write unit tests for resource tools

## 3. Knowledge Tools Implementation

- [ ] 3.1 Integrate with existing RAG service
- [ ] 3.2 Integrate with existing Knowledge Entry API
- [ ] 3.3 Implement `knowledge_query` tool with RAG retrieval
- [ ] 3.4 Implement `knowledge_submit_draft` tool
- [ ] 3.5 Add draft workflow support (create, update, submit)
- [ ] 3.6 Add review notification integration
- [ ] 3.7 Write unit tests for knowledge tools

## 4. Messaging Tools Implementation

- [ ] 4.1 Integrate with existing message service
- [ ] 4.2 Implement `message_query` tool
- [ ] 4.3 Implement `message_send` tool
- [ ] 4.4 Implement `agent_delegate` tool
- [ ] 4.5 Add delegation depth tracking
- [ ] 4.6 Add TTL support for delegated tasks
- [ ] 4.7 Add result aggregation for parent session
- [ ] 4.8 Write unit tests for messaging tools

## 5. Workspace Tools Implementation

- [ ] 5.1 Integrate with existing editor host
- [ ] 5.2 Implement `workspace_stage_change` tool
- [ ] 5.3 Add change representation (structured diffs)
- [ ] 5.4 Add conflict detection
- [ ] 5.5 Write unit tests for workspace tools

## 6. Database Tools Implementation

- [ ] 6.1 Define allowed tables whitelist
- [ ] 6.2 Implement `db_query` tool
- [ ] 6.3 Add admin-only permission check
- [ ] 6.4 Add field masking for sensitive data
- [ ] 6.5 Add tenant isolation filter injection
- [ ] 6.6 Add audit logging for all queries
- [ ] 6.7 Add query timeout enforcement
- [ ] 6.8 Add row limit enforcement
- [ ] 6.9 Write unit tests for database tools

## 7. Integration

- [ ] 7.1 Register all enterprise tools in ToolRegistry
- [ ] 7.2 Add tool descriptors with metadata
- [ ] 7.3 Configure permissions for restricted tools (db_query)
- [ ] 7.4 Integration testing with existing services
- [ ] 7.5 End-to-end testing

## 8. Documentation

- [ ] 8.1 Update architecture docs with new enterprise tools
- [ ] 8.2 Add tool usage examples for each tool
- [ ] 8.3 Document db_query whitelist configuration
- [ ] 8.4 Update OpenSpec specs with implementation notes
