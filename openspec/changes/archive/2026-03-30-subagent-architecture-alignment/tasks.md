# SubAgent Architecture Alignment - Implementation Tasks

## 1. Backend Infrastructure

### 1.1 Permission Ruleset Module

- [x] 1.1.1 Define `PermissionAction` enum (Allow/Ask/Deny)
- [x] 1.1.2 Define `PermissionRule` struct with operation, pattern, action
- [x] 1.1.3 Implement `PermissionChecker` with `check()` method
- [x] 1.1.4 Implement glob pattern matching for rules
- [x] 1.1.5 Implement `merge()` method for rule combination
- [x] 1.1.6 Add default ruleset for office operations (department, approval, document)

### 1.2 Agent Config Loader

- [x] 1.2.1 Create `AgentConfig` struct matching YAML schema
- [x] 1.2.2 Implement `AgentConfigLoader::load_all()` for directory scanning
- [x] 1.2.3 Implement `AgentConfigLoader::load_file()` for single file parsing
- [x] 1.2.4 Parse YAML front matter with serde_yaml
- [x] 1.2.5 Extract Markdown body as prompt content
- [x] 1.2.6 Implement config validation and error handling

### 1.3 Config Merge Logic

- [x] 1.3.1 Define merge priority: Native → File → User → Runtime
- [x] 1.3.2 Implement shallow merge for top-level fields
- [x] 1.3.3 Implement deep merge for nested objects (permission, options)
- [x] 1.3.4 Implement array replacement behavior
- [x] 1.3.5 Handle null value edge cases

### 1.4 Agent Mode Classification

- [x] 1.4.1 Define `AgentMode` enum (Primary/Subagent)
- [x] 1.4.2 Add `mode` field to `AgentInfo` struct
- [x] 1.4.3 Implement `default_agent()` respecting mode constraints
- [x] 1.4.4 Update routing logic to respect subagent constraints
- [x] 1.4.5 Add hidden flag support

## 2. Frontend Components

### 2.1 ModeSwitcher Component

- [x] 2.1.1 Create `ModeSwitcherBase` component with dropdown
- [x] 2.1.2 Implement keyboard navigation (↑↓/Enter/Escape)
- [x] 2.1.3 Connect to session context for agent list
- [x] 2.1.4 Add `openModePicker` event listener
- [x] 2.1.5 Auto-focus prompt after selection
- [x] 2.1.6 Add conditional rendering (hide if only 1 agent)

### 2.2 SubAgent Registry UI

- [x] 2.2.1 Create stats cards showing agent counts
- [x] 2.2.2 Implement search and filter bar
- [x] 2.2.3 Create expandable `AgentCard` component
- [x] 2.2.4 Display role, skills, tools, permissions in expanded view
- [x] 2.2.5 Add toggle for enable/disable
- [x] 2.2.6 Implement delete with confirmation

### 2.3 Create/Edit Dialogs

- [x] 2.3.1 Create template selection grid (general/specialist)
- [x] 2.3.2 Add form fields (name, description, role)
- [x] 2.3.3 Add skills/tools/permissions inputs
- [x] 2.3.4 Implement form validation
- [x] 2.3.5 Connect to backend API

### 2.4 Import/Export

- [x] 2.4.1 Implement JSON export functionality
- [x] 2.4.2 Implement JSON import with validation
- [x] 2.4.3 Handle duplicate name conflicts
- [x] 2.4.4 Add error feedback for invalid imports

## 3. Office Agent Templates

### 3.1 Template Configuration

- [x] 3.1.1 Define `AgentTemplate` type (general/specialist)
- [x] 3.1.2 Create `office-general` template (primary mode)
- [x] 3.1.3 Create `office-specialist` template (subagent mode)
- [x] 3.1.4 Add template icons and colors

### 3.2 Template Selection UI

- [x] 3.2.1 Create `TemplateCard` component
- [x] 3.2.2 Add template preview on hover/click
- [x] 3.2.3 Auto-fill form when template selected

## 4. Integration

### 4.1 Backend Integration

- [x] 4.1.1 Wire up permission checker in tool execution pipeline
- [x] 4.1.2 Connect config loader to agent registry
- [x] 4.1.3 Update routing service to use new permission system
- [x] 4.1.4 Add Tauri commands for config CRUD

### 4.2 Frontend Integration

- [x] 4.2.1 Integrate ModeSwitcher into ChatPanel
- [x] 4.2.2 Connect SubAgentRegistry to backend
- [x] 4.2.3 Add feature flag for new UI
- [x] 4.2.4 Update existing tests

## 5. Testing

### 5.1 Backend Tests

- [x] 5.1.1 Unit tests for PermissionChecker
- [x] 5.1.2 Unit tests for config loader
- [x] 5.1.3 Unit tests for merge logic
- [x] 5.1.4 Integration tests for permission enforcement

### 5.2 Frontend Tests

- [x] 5.2.1 Test ModeSwitcher keyboard navigation
- [x] 5.2.2 Test SubAgentRegistry CRUD operations
- [x] 5.2.3 Test template selection and form filling
- [x] 5.2.4 E2E test for agent creation flow

## 6. Documentation

- [x] 6.1 Update agent config format docs (office context)
- [x] 6.2 Add permission system documentation
- [x] 6.3 Create tutorial for custom agent creation
- [x] 6.4 Document template system usage
