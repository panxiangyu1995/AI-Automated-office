## ADDED Requirements

### Requirement: Shell And Session Store Selector Alignment
The system SHALL keep the existing shell and session behaviors while aligning Zustand subscriptions to selector-based best practices consistent with FR(FR9, FR10, FR11, FR260, FR261, FR262, FR263), NFR(NFR3), ARCH(ADR-001, ADR-004, ADR-035), and UX(UX-01, UX-02, UX-04).

#### Scenario: Workbench shell keeps existing navigation behavior
- **GIVEN** the user opens the desktop shell and navigates through fixed pages or resource entries
- **WHEN** shell components read UI store state
- **THEN** they SHALL subscribe only to the fields they render or invoke
- **AND** the workbench, sidebar, and top bar behaviors SHALL remain unchanged

#### Scenario: Session surfaces keep existing creation and switching behavior
- **GIVEN** the user opens the AI chat area
- **WHEN** sessions are created, switched, renamed, archived, or restored
- **THEN** the session-facing components SHALL keep the same visible behavior
- **AND** they SHALL avoid whole-store subscriptions where field-level selectors are sufficient

#### Scenario: Composite selector hooks use stable shallow results
- **GIVEN** a component needs a combined view of multiple chat or UI store fields
- **WHEN** the selector returns an object snapshot
- **THEN** the hook SHALL use a shallow composite selector
- **AND** unrelated store field changes SHALL NOT be required to update that combined snapshot
