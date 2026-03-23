## ADDED Requirements

### Requirement: Story 11.6 - System Announcements
The system SHALL implement the full acceptance scope for Story 11.6 while staying aligned with FR(FR44, FR45), NFR(NFR1), ARCH(ADR-037), and UX(UX-01, UX-02).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Publish and render system notices
- **THEN** runtime state, routing outcome, and audit traces SHALL remain consistent and permission-safe

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Track read state and notice visibility
- **THEN** runtime state, routing outcome, and audit traces SHALL remain consistent and permission-safe

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and communication/connector governance is active
- **WHEN** Integrate notices with the unified messaging center
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
