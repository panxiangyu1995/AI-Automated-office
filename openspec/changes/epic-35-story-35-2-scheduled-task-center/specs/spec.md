## ADDED Requirements

### Requirement: Story 35.2 - Scheduled Task Center
The system SHALL implement the full acceptance scope for Story 35.2 while staying aligned with FR(FR1135, FR1136, FR1137, FR1138, FR1139, FR1140, FR1141, FR1142, FR1143, FR1144, FR1145), NFR(NFR22), ARCH(ADR-048), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Manage scheduled tasks and Cron definitions
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Apply retry, backoff, timeout, and mutex policy
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Enforce confirmation or approval on high-risk scheduled actions
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
