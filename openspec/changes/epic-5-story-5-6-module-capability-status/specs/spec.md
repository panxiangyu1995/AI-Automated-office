## ADDED Requirements

### Requirement: Story 5.6 - Module Capability Status
The system SHALL implement the full acceptance scope for Story 5.6 while staying aligned with FR(FR74, FR75), NFR(NFR1), ARCH(ADR-017), and UX(UX-01, UX-02).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Build module capability status overview
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Show tool, skill, and MCP counts and health state
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Display handshake state with the main Agent
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
