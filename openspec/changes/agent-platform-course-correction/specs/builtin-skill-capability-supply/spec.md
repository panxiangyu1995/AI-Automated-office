## ADDED Requirements

### Requirement: Capability supply surfaces MUST distinguish built-in and installed Skills
The system SHALL distinguish platform built-in Skills, department capability pack built-in Skills, and user/admin installed Skills across settings, capability status, and runtime candidate selection surfaces.

#### Scenario: Viewing Skill configuration
- **WHEN** the user opens Skill management or capability status views
- **THEN** each Skill SHALL display its source category
- **AND** platform defaults SHALL be visible even before the user installs additional Skills

### Requirement: Built-in Skills MUST remain governed like other capabilities
The system SHALL subject built-in Skills to the same registry, permission, approval, audit, and context-budget governance chain used by external or installed capabilities.

#### Scenario: Runtime selects a built-in Skill
- **WHEN** a built-in Skill is considered for execution
- **THEN** it SHALL pass through the same governance pipeline as any other capability
- **AND** it SHALL NOT bypass tool permissions, approval rules, or audit recording
