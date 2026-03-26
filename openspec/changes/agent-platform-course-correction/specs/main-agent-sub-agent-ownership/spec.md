## ADDED Requirements

### Requirement: Sub-Agent configuration MUST belong to the current user's main Agent
The system SHALL model every Sub-Agent as a configuration owned by the current user's main Agent, rather than as a department-specific independent Agent entity.

#### Scenario: Managing Sub-Agent registry
- **WHEN** a user opens Sub-Agent management
- **THEN** the registry SHALL present Sub-Agents as part of that user's main Agent workspace
- **AND** department metadata SHALL appear only as context, permission, or capability boundary information

### Requirement: Mock department-specific Sub-Agent presets MUST be replaced during refactor
The system SHALL replace department-specific mock Sub-Agent presets and sample data that reinforce the old “department agent” model with user-owned, capability-oriented examples.

#### Scenario: Loading configuration screens
- **WHEN** Sub-Agent registry, persona, tool binding, permission, model, routing, or execution screens are rendered
- **THEN** they SHALL use shared runtime-backed state contracts or clearly labeled corrective placeholders
- **AND** they SHALL NOT default to hard-coded department-exclusive Agent identities
