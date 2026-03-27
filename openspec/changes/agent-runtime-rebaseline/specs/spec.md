## ADDED Requirements

### Requirement: Archived runtime foundations stay reusable
The system SHALL treat archived Story 43.1 through Story 49.4 as reusable foundations for the current generic Agent plan instead of rebuilding them from scratch.

#### Scenario: Planning a new runtime batch
- **GIVEN** archived runtime stories are already marked complete
- **WHEN** a new generic Agent batch is planned
- **THEN** those foundations SHALL be reused as dependencies rather than reintroduced as first-class implementation targets

### Requirement: The backend execution spine comes before advanced Agent work
The system SHALL sequence the current batch so that the Rust execution spine, runtime bridge, real tool pipeline, prompt path, retrieval path, reliability, and backend security land before advanced Sub-Agent work.

#### Scenario: Building the active task order
- **GIVEN** the backend Agent module is still missing
- **WHEN** task sequencing is defined
- **THEN** execution-spine and governance stories SHALL come before Sub-Agent expansion

### Requirement: task.json remains a valid execution entry point
The system SHALL keep task.json valid and aligned to a real source-of-truth change.

#### Scenario: Reading the active task plan
- **GIVEN** task.json is consumed by later agent sessions
- **WHEN** the file is parsed
- **THEN** it SHALL resolve to an existing OpenSpec change that describes the same active roadmap