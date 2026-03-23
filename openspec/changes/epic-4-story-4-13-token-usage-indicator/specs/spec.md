## ADDED Requirements

### Requirement: Story 4.13 - Token Usage Indicator
The system SHALL implement the full acceptance scope for Story 4.13 while staying aligned with FR(FR-CTX-1, FR-CTX-6), NFR(NFR3), ARCH(ADR-043), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Show session token usage and threshold state
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Display detailed token counts on demand
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Link the indicator to compression threshold status
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-F1: Dependency not ready
- **GIVEN** an upstream dependency story is incomplete or contract-incompatible
- **WHEN** this story flow is executed
- **THEN** the system SHALL fail fast with actionable guidance and no partial destructive writes

#### Scenario-F2: Runtime execution failure
- **GIVEN** runtime execution returns an error after command acceptance
- **WHEN** failure handling is triggered
- **THEN** user-visible state, audit trail, and retry/rollback options SHALL remain coherent

#### Scenario-O1: Observability and audit
- **GIVEN** the story action is executed end-to-end
- **WHEN** logs and records are inspected
- **THEN** command, state transition, and outcome SHALL be traceable by correlation identifiers
