## ADDED Requirements

### Requirement: Story 4.10 - Git Checkpoint Integration
The system SHALL implement the full acceptance scope for Story 4.10 while staying aligned with FR(FR17-14, FR17-15, FR17-17, FR17-18), NFR(NFR17), ARCH(ADR-037), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Detect or provision Git runtime support
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Bind checkpoint operations to Git-backed history
- **THEN** runtime state, persisted records, and UI status stay consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** prerequisite dependencies are complete and the user has valid permission context
- **WHEN** Store commit metadata for checkpoint inspection
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
