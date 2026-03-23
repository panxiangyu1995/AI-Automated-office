## ADDED Requirements

### Requirement: Story 5.4 - Tool Failure Handling
The system SHALL implement the full acceptance scope for Story 5.4 while staying aligned with FR(FR71, FR72), NFR(NFR22), ARCH(ADR-017, ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Provide retry controls for failed tool calls
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Allow user-supplied fallback result entry where permitted
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Show normalized error reasons and next-step guidance
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
