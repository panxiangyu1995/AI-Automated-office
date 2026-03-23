## ADDED Requirements

### Requirement: Story 32.2 - Task Trace Analysis
The system SHALL implement the full acceptance scope for Story 32.2 while staying aligned with FR(FR1101, FR1104, FR1105, FR1106), NFR(NFR23-8), ARCH(ADR-023, ADR-048), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Link tasks, steps, and tool calls under a common trace
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Show latency distribution and bottlenecks
- **THEN** runtime action, state transition, and telemetry SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and reliability governance is active
- **WHEN** Support drill-down from product events to runtime details
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
