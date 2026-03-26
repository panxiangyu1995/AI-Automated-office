## ADDED Requirements

### Requirement: Candidate Change Review Boundary Alignment
The system SHALL keep staged candidate-change review separate from ordinary tool-call display and SHALL expose enough metadata for users to understand where a staged package came from, while staying aligned with FR(FR69, FR70, FR76, FR79, FR80, FR470-FR498), NFR(NFR1, NFR16, NFR23-8), ARCH(ADR-035, ADR-037), and UX(UX-01, UX-04).

#### Scenario: Staged review shows source metadata
- **GIVEN** the Agent stages candidate changes for a page, editor, form, detail section, or workbench card
- **WHEN** the user opens the staged review list
- **THEN** each review package SHALL show the originating surface kind when that metadata is available
- **AND** it SHALL show the source staging tool when that metadata is available

#### Scenario: Human review actions remain outside the tool registry
- **GIVEN** a staged review package exists
- **WHEN** an AI actor attempts to accept, reject, or rollback the package
- **THEN** the runtime SHALL reject that action
- **AND** only a human review actor SHALL be able to finalize those review decisions

#### Scenario: Tool calls and review packages remain distinct
- **GIVEN** `workspace_stage_change` has been used to create a candidate change package
- **WHEN** the user inspects the chat and review surfaces
- **THEN** the tool invocation trace SHALL remain visible as a tool call event
- **AND** the candidate changes SHALL remain visible in a separate staged review package list
