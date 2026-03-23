## ADDED Requirements

### Requirement: Story 7.8 - Sub Agent Runtime Baseline
The system SHALL implement the full acceptance scope for Story 7.8 while staying aligned with FR(FR416, FR450, FR453), NFR(NFR8-12), ARCH(ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Detect when subtasks require sub-agent delegation
- **THEN** planner/executor state, outputs, and traces SHALL remain consistent and auditable

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Create sub-agent execution branches under the common runtime
- **THEN** planner/executor state, outputs, and traces SHALL remain consistent and auditable

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and runtime guardrails are active
- **WHEN** Show sub-agent state and results to the user
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
