## ADDED Requirements

### Requirement: Story 30.2 - Connector Health Retry
The system SHALL implement the full acceptance scope for Story 30.2 while staying aligned with FR(FR1084, FR1085, FR1086), NFR(NFR35), ARCH(ADR-015, ADR-048), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Monitor connector health and recent failures
- **THEN** runtime state, routing outcome, and audit traces SHALL remain consistent and permission-safe

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Apply retry and downgrade policies
- **THEN** runtime state, routing outcome, and audit traces SHALL remain consistent and permission-safe

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Expose connector incidents and recovery status
- **THEN** runtime state, routing outcome, and audit traces SHALL remain consistent and permission-safe

#### Scenario-F1: Permission or routing rejection
- **GIVEN** recipient scope, policy, or permission validation fails
- **WHEN** operation is requested
- **THEN** operation SHALL be blocked with explicit reason and no side effects

#### Scenario-F2: Connector/channel failure
- **GIVEN** channel or connector is unavailable during execution
- **WHEN** runtime dispatches the operation
- **THEN** retry/downgrade policy SHALL execute deterministically and preserve state consistency

#### Scenario-O1: Communication auditability
- **GIVEN** communication or connector actions are executed
- **WHEN** audit timeline is queried
- **THEN** sender/receiver/context/decision/outcome SHALL be reconstructable
