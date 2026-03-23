## ADDED Requirements

### Requirement: Story 10.4 - Clawhub Marketplace
The system SHALL implement the full acceptance scope for Story 10.4 while staying aligned with FR(FR730, FR731, FR732, FR738, FR739, FR741, FR743, FR744), NFR(NFR16), ARCH(ADR-046, ADR-047), and UX(UX-01, UX-02).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Browse and search compatible external resources
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Inspect details and installable packages
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Route installs through security and governance checks
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
