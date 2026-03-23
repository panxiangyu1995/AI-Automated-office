## ADDED Requirements

### Requirement: Story 4.2 - Session Management Ui
The system SHALL implement the full acceptance scope for Story 4.2 while staying aligned with FR(FR10), NFR(NFR1), ARCH(ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Build session list and new session entry points
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Support rename and delete actions for sessions
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Bind UI state to the persisted runtime session store
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
