## ADDED Requirements

### Requirement: Story 5.1 - Tool Registry Management
The system SHALL implement the full acceptance scope for Story 5.1 while staying aligned with FR(FR12, FR13), NFR(NFR8-6), ARCH(ADR-010, ADR-017, ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Expose registered core, plugin, and MCP tools
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Show tool descriptor metadata and availability
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Keep the management surface aligned with the common tool runtime
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-F1: Permission denied or policy block
- **GIVEN** the actor lacks required permission or the action is blacklisted
- **WHEN** execution is requested
- **THEN** execution SHALL be blocked with explicit reason and auditable decision record

#### Scenario-F2: Runtime failure and retry control
- **GIVEN** a tool execution fails due to transient or terminal errors
- **WHEN** retry/fallback policy is applied
- **THEN** retry count, backoff, and terminal result SHALL be deterministic and visible

#### Scenario-O1: History and observability
- **GIVEN** one or more tool calls were executed
- **WHEN** history/observability views are queried
- **THEN** correlated invocation details, duration, outcome, and policy traces SHALL be retrievable
