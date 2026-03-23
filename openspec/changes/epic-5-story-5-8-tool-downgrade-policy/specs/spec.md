## ADDED Requirements

### Requirement: Story 5.8 - Tool Downgrade Policy
The system SHALL implement the full acceptance scope for Story 5.8 while staying aligned with FR(FR77), NFR(NFR35), ARCH(ADR-017), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Define fallback tool or fallback behavior options
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Expose downgrade hints for the user
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Persist downgrade rules for runtime use
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
