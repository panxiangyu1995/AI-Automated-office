## ADDED Requirements

### Requirement: Story 21.23 - Sub Agent Execution Monitoring
The system SHALL implement the full acceptance scope for Story 21.23 while staying aligned with FR(FR938, FR924), NFR(NFR23-4), ARCH(ADR-042, ADR-037), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Show current Sub-Agent execution state
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** List historical runs and outcomes
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Link sub-agent traces back to the main Agent session
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-F1: Invalid configuration submission
- **GIVEN** submitted config violates schema or policy constraints
- **WHEN** save/apply is requested
- **THEN** the operation SHALL fail with field-level diagnostics and no effective-state mutation

#### Scenario-F2: Apply failure and rollback
- **GIVEN** config passes validation but apply-to-runtime fails
- **WHEN** apply pipeline reports failure
- **THEN** previous effective version SHALL remain active and rollback metadata SHALL be recorded

#### Scenario-O1: Configuration auditability
- **GIVEN** config is created, updated, applied, or rolled back
- **WHEN** audit timeline is inspected
- **THEN** actor, change diff, approval status, and effective version SHALL be reconstructable
