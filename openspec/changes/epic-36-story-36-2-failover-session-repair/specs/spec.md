## ADDED Requirements

### Requirement: Story 36.2 - Failover Session Repair
The system SHALL implement the full acceptance scope for Story 36.2 while staying aligned with FR(FR1155, FR1156, FR1157, FR1158, FR1159, FR1160, FR1161, FR1162, FR1163, FR1164, FR1165, FR1166, FR1167, FR1168, FR1169), NFR(NFR17, NFR22), ARCH(ADR-048), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Switch providers and auth profiles on controlled failure conditions
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Repair session and context corruption with diff summary
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Record failover and repair actions for audit and diagnosis
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-F1: Detection uncertainty or conflicting signals
- **GIVEN** health/error signals are inconsistent or below confidence threshold
- **WHEN** auto-recovery decision is evaluated
- **THEN** system SHALL choose safe-degrade/escalation and avoid unsafe destructive actions

#### Scenario-F2: Recovery action failure
- **GIVEN** retry/failover/repair action fails during execution
- **WHEN** terminal failure threshold is reached
- **THEN** system SHALL emit actionable diagnostics, preserve trace continuity, and prevent uncontrolled loops

#### Scenario-O1: Incident traceability
- **GIVEN** an incident goes through detection, action, and resolution phases
- **WHEN** operators inspect runtime telemetry
- **THEN** trigger, decision path, action outcomes, and final status SHALL be reconstructable
