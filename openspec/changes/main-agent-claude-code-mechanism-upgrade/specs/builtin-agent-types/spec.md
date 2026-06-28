# Specification: builtin-agent-types

## ADDED Requirements

### Requirement: Builtin Agent Type System
The system SHALL implement a builtin agent type system for the main generic agent, supporting multiple predefined agent types with distinct capabilities and tool permissions.

### Requirement: General Purpose Agent Type
The system SHALL provide a `general-purpose` agent type that has access to all available tools and operates with full functionality.

#### Scenario: General purpose agent with full tools
- **WHEN** a user creates or invokes a general-purpose agent
- **THEN** the agent SHALL have access to all registered tools
- **AND** the agent SHALL support all agent capabilities including planning, execution, and tool calling

### Requirement: Explore Agent Type
The system SHALL provide an `explore` agent type that has read-only access limited to search tools (Glob, Grep, Read) for quick code exploration.

#### Scenario: Explore agent with restricted tools
- **WHEN** a user invokes an explore agent
- **THEN** the agent SHALL only have access to read-only search tools
- **AND** the agent SHALL NOT have access to any write tools (Write, Edit, Delete)
- **AND** the agent SHALL NOT have access to shell execution tools

### Requirement: Plan Agent Type
The system SHALL provide a `plan` agent type that uses search tools and is prohibited from writing, designed for software architecture design and planning.

#### Scenario: Plan agent with search-only access
- **WHEN** a user invokes a plan agent
- **THEN** the agent SHALL have access to search tools
- **AND** the agent SHALL NOT have access to any tools that modify system state
- **AND** the agent SHALL return a detailed execution plan without executing actions

### Requirement: Verification Agent Type
The system SHALL provide a `verification` agent type that is read-only and prohibits writing, designed for adversarial testing to verify fix correctness.

#### Scenario: Verification agent for fix validation
- **WHEN** a user invokes a verification agent to validate a fix
- **THEN** the agent SHALL NOT have access to any write tools
- **AND** the agent SHALL attempt to break or invalidate the proposed fix
- **AND** the agent SHALL report findings about whether the fix is correct or incomplete

### Requirement: Agent Type Selection
The system SHALL allow users to select the appropriate agent type based on their current task requirements.

#### Scenario: User selects explore agent
- **WHEN** a user requests to explore codebase structure
- **THEN** system SHALL present explore agent as the recommended option
- **AND** user can explicitly select explore agent type

### Requirement: Agent Type Metadata
Each builtin agent type SHALL include metadata containing:
- `name`: Unique identifier for the agent type
- `description`: Human-readable description of when to use this type
- `tools`: List of tool names or patterns this type can access
- `disallowedTools`: List of tool names or patterns this type cannot access
- `systemPrompt`: Custom system prompt for this agent type
- `model`: Recommended model for this type (e.g., sonnet, haiku, inherit)

#### Scenario: Agent type metadata retrieval
- **WHEN** system needs to configure an agent
- **THEN** system SHALL retrieve the appropriate metadata for the selected type
- **AND** system SHALL apply tool filtering based on the metadata
