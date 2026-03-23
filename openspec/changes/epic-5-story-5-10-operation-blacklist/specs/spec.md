## ADDED Requirements

### Requirement: Story 5.10 - Operation Blacklist
The system SHALL implement the full acceptance scope for Story 5.10 while staying aligned with FR(FR493, FR494, FR495, FR498), NFR(NFR23-6), ARCH(ADR-037), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Create personal and tenant-level blacklist controls
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Block blacklisted operations before execution
- **THEN** tool lifecycle state, policy decisions, and audit records SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the actor has required permission scope
- **WHEN** Show block reason and audit trail to users and admins
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
