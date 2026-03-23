## ADDED Requirements

### Requirement: Story 9.5 - Knowledge Base Access Control
The system SHALL implement the full acceptance scope for Story 9.5 while staying aligned with FR(FR290, FR291), NFR(NFR16-2), ARCH(ADR-043), and UX(UX-02, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Define access scope per knowledge base
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Enforce role and department visibility rules
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Apply effective knowledge scope to Agent execution
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-F1: Invalid or untrusted input
- **GIVEN** uploaded/imported content fails schema or trust checks
- **WHEN** ingestion is requested
- **THEN** ingestion SHALL be rejected with actionable diagnostics and no partial activation

#### Scenario-F2: Runtime execution or retrieval failure
- **GIVEN** execution/retrieval fails after registration
- **WHEN** runtime attempts to use the resource or knowledge item
- **THEN** system SHALL fail safely, preserve previous stable state, and expose fallback guidance

#### Scenario-O1: Audit and provenance visibility
- **GIVEN** a resource/knowledge item is imported, updated, approved, or executed
- **WHEN** audit/provenance view is queried
- **THEN** source, actor, policy decision, version, and outcome SHALL be reconstructable
