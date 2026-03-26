## ADDED Requirements

### Requirement: Runtime Panel Memo Simplification Alignment
The system SHALL keep runtime observability and reliability panel behavior unchanged while aligning simple fallback derivation to React best practices consistent with FR(FR1100, FR1102, FR1103, FR1146, FR1162, FR1163, FR1164, FR1165, FR1169), NFR(NFR3, NFR35), ARCH(ADR-023, ADR-048), and UX(UX-02, UX-04).

#### Scenario: Default sample data still renders without props
- **GIVEN** the user opens an affected runtime panel with no explicit props
- **WHEN** the component resolves its default dataset
- **THEN** it SHALL render the same default sample content as before
- **AND** that simple fallback choice SHALL be derived directly during render

#### Scenario: Expensive aggregations remain memoized
- **GIVEN** the user filters logs, errors, providers, or repairs in the affected panels
- **WHEN** the panels derive statistics or filtered collections from the resolved dataset
- **THEN** materially repeated aggregations SHALL remain memoized
- **AND** simple fallback-value resolution SHALL NOT be wrapped in `useMemo`

#### Scenario: Panel interactions remain intact after simplification
- **GIVEN** the user opens details dialogs, runs filters, or exports logs
- **WHEN** the simplified components render and update
- **THEN** the visible interaction model SHALL remain unchanged
- **AND** the governance copy and sample semantics SHALL stay aligned with the iron-law documents
