# Enterprise Tools - Messaging

## ADDED Requirements

### Requirement: message_query tool
The system SHALL provide a `message_query` tool for querying message context.

#### Scenario: Query user messages
- **WHEN** Agent calls `message_query` with target=user and user_id
- **THEN** system SHALL return recent messages for user

#### Scenario: Query channel messages
- **WHEN** Agent calls `message_query` with target=channel and channel_id
- **THEN** system SHALL return recent messages for channel

#### Scenario: Query with date range
- **WHEN** Agent calls `message_query` with dateRange filter
- **THEN** system SHALL return messages within date range

### Requirement: message_send tool
The system SHALL provide a `message_send` tool for sending messages.

#### Scenario: Send to user
- **WHEN** Agent calls `message_send` with target=user and content
- **THEN** system SHALL deliver message to user

#### Scenario: Send to channel
- **WHEN** Agent calls `message_send` with target=channel and content
- **THEN** system SHALL deliver message to channel

#### Scenario: Send as agent
- **WHEN** Agent calls `message_send` with sender=agent
- **THEN** system SHALL send message on behalf of agent

### Requirement: agent_delegate tool
The system SHALL provide an `agent_delegate` tool for task delegation to sub-agents.

#### Scenario: Delegate to sub-agent
- **WHEN** Agent calls `agent_delegate` with agent_config and task_spec
- **THEN** system SHALL create sub-agent task and return task_id

#### Scenario: Delegate with context
- **WHEN** Agent calls `agent_delegate` with task_spec and context
- **THEN** system SHALL create task with provided context

#### Scenario: Delegate with parent session
- **WHEN** Agent calls `agent_delegate` with parent_session_id
- **THEN** system SHALL link sub-agent session to parent

## Delegation Constraints

### Requirement: Maximum delegation depth
The agent_delegate tool SHALL enforce maximum delegation depth (default: 3).

### Requirement: Delegation TTL
The agent_delegate tool SHALL support task TTL for auto-expiration.

### Requirement: Delegation result aggregation
The agent_delegate tool SHALL support returning aggregated results to parent session.
