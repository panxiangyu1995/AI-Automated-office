## ADDED Requirements

### Requirement: Story 35.1 - Heartbeat Checklist
The system SHALL implement the full acceptance scope for Story 35.1 while staying aligned with FR(FR1127, FR1128, FR1129, FR1130, FR1131, FR1132, FR1133, FR1134), NFR(NFR14), ARCH(ADR-048), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Load HEARTBEAT checklist and evaluate execution window
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Run precheck for activity, context budget, and availability
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Return `HEARTBEAT_OK` silently when no action is needed
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
