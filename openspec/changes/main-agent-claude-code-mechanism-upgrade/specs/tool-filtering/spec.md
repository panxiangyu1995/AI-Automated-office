# Specification: tool-filtering

## ADDED Requirements

### Requirement: Tool Permission Types
The system SHALL implement a tool permission system that supports multiple permission modes for controlling tool access.

### Requirement: ToolPermission Enumeration
The system SHALL define a `ToolPermission` enumeration with the following variants:
- `All`: Allows access to all tools
- `Whitelist(Vec<String>)`: Allows access only to tools matching the specified patterns
- `Blacklist(Vec<String>)`: Denies access to tools matching the specified patterns

#### Scenario: Whitelist mode restricts tools
- **WHEN** tool permission is set to `Whitelist(["hr_*", "approval_*"])`
- **THEN** agent SHALL only have access to tools starting with "hr_" or "approval_"
- **AND** all other tools SHALL be filtered out

#### Scenario: Blacklist mode excludes tools
- **WHEN** tool permission is set to `Blacklist(["*_delete", "*_admin"])`
- **THEN** agent SHALL have access to all tools except those ending with "_delete" or "_admin"

### Requirement: ToolAccessPolicy Structure
The system SHALL implement a `ToolAccessPolicy` structure that contains:
- `permission`: The `ToolPermission` mode
- `requires_confirmation`: Boolean indicating if tool execution requires user confirmation
- `confirmation_timeout`: Optional timeout in seconds for confirmation

#### Scenario: Policy requires confirmation
- **WHEN** a tool has `requires_confirmation: true`
- **THEN** the system SHALL prompt user for confirmation before executing
- **AND** if timeout is exceeded, the tool execution SHALL be cancelled

### Requirement: Tool Filtering by Agent Type
The system SHALL provide a `filter_for_agent` method on the `ToolRegistry` that filters tools based on agent type and access policy.

#### Scenario: Filter tools for explore agent
- **WHEN** `filter_for_agent` is called with explore agent type
- **THEN** the method SHALL return only read-only search tools
- **AND** write tools SHALL be excluded from the result

### Requirement: Tool Pattern Matching
The system SHALL support glob-style pattern matching for tool names when filtering, including:
- `*`: Matches any sequence of characters
- `?`: Matches any single character
- `[abc]`: Matches any character in the set

#### Scenario: Pattern matching with wildcard
- **WHEN** whitelist contains "hr_*"
- **THEN** tools "hr_employee_create", "hr_employee_query" SHALL match
- **AND** tool "hr_department_create" SHALL match
- **AND** tool "approval_submit" SHALL NOT match

### Requirement: Permission Validation
The system SHALL validate tool access permissions before each tool execution, returning an error if access is denied.

#### Scenario: Permission denied
- **WHEN** agent attempts to execute a blacklisted tool
- **THEN** the system SHALL return a permission denied error
- **AND** the tool SHALL NOT be executed
- **AND** the attempt SHALL be logged for audit

### Requirement: Dynamic Permission Updates
The system SHALL support dynamically updating tool permissions without restarting the agent runtime.

#### Scenario: Update blacklist at runtime
- **WHEN** administrator updates the tool blacklist
- **THEN** the change SHALL take effect immediately
- **AND** existing sessions SHALL use the new blacklist on next tool call

### Requirement: Permission Audit Logging
The system SHALL log all permission checks including the agent ID, tool name, permission mode, and result.

#### Scenario: Audit log entry
- **WHEN** permission check occurs for tool "finance_export_all"
- **THEN** the system SHALL log: agent_id, tool_name, permission_mode, result, timestamp
