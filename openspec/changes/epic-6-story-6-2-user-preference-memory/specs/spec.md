## ADDED Requirements

### Requirement: Story 6.2 - User Preference Memory
The system SHALL implement the full acceptance scope for Story 6.2 while staying aligned with FR(FR14-1, FR261), NFR(NFR16-1), ARCH(ADR-043, ADR-044), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Store user preferences by scene and type
- **THEN** memory state, retrieval output, and audit metadata SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Apply preferences during generation
- **THEN** memory state, retrieval output, and audit metadata SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and memory scope policies are active
- **WHEN** Provide preference editing UI
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
