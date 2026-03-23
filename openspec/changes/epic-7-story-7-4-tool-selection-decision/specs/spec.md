## ADDED Requirements

### Requirement: Story 7.4 - Tool Selection Decision
The system SHALL implement the full acceptance scope for Story 7.4 while staying aligned with FR(FR412), NFR(NFR8-6), ARCH(ADR-017, ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Rank candidate tools against task intent
- **THEN** planner/executor state, outputs, and traces SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Record tool selection rationale
- **THEN** planner/executor state, outputs, and traces SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Expose selection outcomes for debugging and audit
- **THEN** planner/executor state, outputs, and traces SHALL remain consistent and auditable

#### Scenario-F1: Intent ambiguity or low confidence
- **GIVEN** user input cannot be confidently classified
- **WHEN** planning is requested
- **THEN** the system SHALL ask for clarification and avoid unsafe execution

#### Scenario-F2: Loop or boundary violation
- **GIVEN** execution exceeds loop threshold or boundary policy
- **WHEN** guardrail checks trigger
- **THEN** execution SHALL stop safely with actionable diagnostics and trace records

#### Scenario-O1: Runtime observability
- **GIVEN** a task executes through planning and execution phases
- **WHEN** runtime trace is inspected
- **THEN** intent, plan steps, execution outcomes, and any replan decisions SHALL be reconstructable
