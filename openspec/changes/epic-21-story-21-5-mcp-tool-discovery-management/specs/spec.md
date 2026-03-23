## ADDED Requirements

### Requirement: Story 21.5 - Mcp Tool Discovery Management
The system SHALL implement the full acceptance scope for Story 21.5 while staying aligned with FR(FR818, FR819, FR820), NFR(NFR30), ARCH(ADR-015, ADR-039), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Discover tools from connected MCP services
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Enable or disable individual MCP tools
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and operator has required configuration permissions
- **WHEN** Bind tool state into the common runtime registry
- **THEN** config state, runtime effect, and audit traces SHALL remain consistent

#### Scenario-F1: Invalid configuration submission
- **GIVEN** submitted config violates schema or policy constraints
- **WHEN** save/apply is requested
- **THEN** the operation SHALL fail with field-level diagnostics and no effective-state mutation

#### Scenario-F2: Apply failure and rollback
- **GIVEN** config passes validation but apply-to-runtime fails
- **WHEN** apply pipeline reports failure
- **THEN** previous effective version SHALL remain active and rollback metadata SHALL be recorded

#### Scenario-O1: Configuration auditability
- **GIVEN** config is created, updated, applied, or rolled back
- **WHEN** audit timeline is inspected
- **THEN** actor, change diff, approval status, and effective version SHALL be reconstructable
