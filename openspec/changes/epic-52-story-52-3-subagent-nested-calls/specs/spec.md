## ADDED Requirements

### Requirement: Story 52.3 - Sub-Agent nested call control
The system SHALL deliver this story scope aligned with FR(FR935, FR937, FR938) and ARCH(ADR-013).

#### Scenario: Story completed
- **GIVEN** implementation follows task.json and the agent-runtime-rebaseline plan
- **WHEN** code, tests, and documentation are complete
- **THEN** all acceptance items in tasks.md SHALL be satisfied
- **AND** the behavior SHALL run through the real common Agent path rather than placeholder-only or mock-only logic

#### Scenario: Dependency gate respected
- **GIVEN** dependency stories are listed for this story
- **WHEN** implementation begins and verification is performed
- **THEN** the story SHALL not be considered complete if those dependencies remain unstable