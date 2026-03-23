## ADDED Requirements

### Requirement: Story 10.5 - Private Market Config
The system SHALL implement the full acceptance scope for Story 10.5 while staying aligned with FR(FR733, FR734, FR735, FR736, FR737, FR740, FR742, FR745), NFR(NFR16), ARCH(ADR-046), and UX(UX-02).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Configure private market endpoints and policies
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Upload and review private resources
- **THEN** state transitions, outputs, and audit traces SHALL remain consistent and tenant-safe

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and governance policies are active
- **WHEN** Keep private and public resource spaces isolated
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
