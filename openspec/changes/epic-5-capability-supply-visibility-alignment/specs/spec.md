## ADDED Requirements

### Requirement: Tool Calling 2.0 Visibility Alignment
The system SHALL align default-facing capability status, tool history, and observability samples to the iron-law Tool Calling 2.0 model, while staying aligned with FR(FR69-FR80, FR74, FR75, FR79, FR80, FR500-FR502, FR835-FR840), NFR(NFR8-6, NFR8-7, NFR16, NFR23-8), ARCH(ADR-020, ADR-023, ADR-025, ADR-045, ADR-046), and UX(UX-01, UX-02, UX-04).

#### Scenario: Capability status uses capability-supply wording
- **GIVEN** the user opens capability status for a module
- **WHEN** counts and labels are rendered
- **THEN** the surface SHALL describe capabilities with the corrected supply terminology
- **AND** it SHALL avoid department-Agent wording for source categories

#### Scenario: Tool history uses layered categories
- **GIVEN** the user opens tool history
- **WHEN** the page renders filters, badges, and default entries
- **THEN** the visible categories SHALL be general, platform, department, or restricted
- **AND** the default samples SHALL not promote restricted low-level tools as ordinary examples

#### Scenario: Skill source separation remains visible
- **GIVEN** the user inspects Sub-Agent-bound capability summaries
- **WHEN** the page shows available or already-bound Skills
- **THEN** platform built-in, department built-in, and user-installed sources SHALL remain distinguishable
- **AND** the page SHALL not collapse them into one undifferentiated source label
