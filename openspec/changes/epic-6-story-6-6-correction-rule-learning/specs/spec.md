## ADDED Requirements

### Requirement: Story 6.6 - Correction Rule Learning
The system SHALL implement the full acceptance scope for Story 6.6 while staying aligned with FR(FR83, FR84, FR85, FR86, FR87, FR88), NFR(NFR8-3, NFR16-3), ARCH(ADR-043, ADR-044), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Capture corrected outputs and reasons
- **THEN** memory state, retrieval output, and audit metadata SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Extract structured correction rules
- **THEN** memory state, retrieval output, and audit metadata SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Inject applicable rules into future execution
- **THEN** memory state, retrieval output, and audit metadata SHALL remain consistent

#### Scenario-F1: Memory write rejected
- **GIVEN** a memory payload violates schema, scope, or policy constraints
- **WHEN** write/update is attempted
- **THEN** the operation SHALL be rejected with explicit reason and no partial persistence

#### Scenario-F2: Retrieval failure fallback
- **GIVEN** retrieval backend is unavailable or returns invalid data
- **WHEN** runtime requests memory context
- **THEN** the system SHALL fallback to safe baseline context and emit observable diagnostics

#### Scenario-O1: Memory auditability
- **GIVEN** memory entries are created/updated/deleted or corrected
- **WHEN** audit view or logs are inspected
- **THEN** actor, scope, change diff, and timestamp SHALL be traceable
