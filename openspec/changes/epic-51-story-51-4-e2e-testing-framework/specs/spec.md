## ADDED Requirements

### Requirement: Story 51.4 - Chat host integration and E2E baseline
The system SHALL deliver this story scope aligned with FR(FR400, FR410, FR411) and ARCH(ADR-001, ADR-037).

#### Scenario: Story completed
- **GIVEN** implementation follows task.json and the agent-runtime-rebaseline plan
- **WHEN** code, tests, and documentation are complete
- **THEN** all acceptance items in tasks.md SHALL be satisfied
- **AND** the behavior SHALL run through the real common Agent path rather than placeholder-only or mock-only logic

#### Scenario: Dependency gate respected
- **GIVEN** dependency stories are listed for this story
- **WHEN** implementation begins and verification is performed
- **THEN** the story SHALL not be considered complete if those dependencies remain unstable