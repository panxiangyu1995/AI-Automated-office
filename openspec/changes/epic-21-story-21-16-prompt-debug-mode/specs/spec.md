## ADDED Requirements

### Requirement: Story 21.16 - Prompt Debug Mode
The system SHALL implement the full acceptance scope for Story 21.16 while staying aligned with FR(FR880, FR881, FR882, FR883, FR884, FR885, FR886, FR887, FR888), NFR(NFR16), ARCH(ADR-040, ADR-041, ADR-042), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Run test prompts against the Agent in debug mode
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Show triggered rules and prompt impact
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Display safety blocks and convergence strategy hits
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
