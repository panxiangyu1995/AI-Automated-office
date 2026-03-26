## ADDED Requirements

### Requirement: User-owned Sub-Agent Settings Alignment
The system SHALL align the Sub-Agent settings surface to the iron-law model of one main Agent per user with user-owned Sub-Agents, while staying aligned with FR(FR890-FR900, FR905-FR914, FR915-FR925, FR930-FR938, FR460, FR461, FR922), NFR(NFR16, NFR23-8), ARCH(ADR-013, ADR-039, ADR-046), and UX(UX-02, UX-04).

#### Scenario: Registry ownership copy is corrected
- **GIVEN** the user opens the Sub-Agent registry
- **WHEN** the page renders the introductory copy and list items
- **THEN** the surface SHALL describe Sub-Agents as belonging to the current user's main Agent
- **AND** it SHALL NOT describe departments as independent Agent entities

#### Scenario: Persona defaults come from the selected Sub-Agent template
- **GIVEN** the user creates or selects a Sub-Agent persona configuration
- **WHEN** the form loads the initial draft state
- **THEN** the role prompt SHALL default from the selected Sub-Agent template
- **AND** the invocation description SHALL default from the selected Sub-Agent template description

#### Scenario: Routing and execution examples use corrective samples
- **GIVEN** the user opens routing or execution monitoring
- **WHEN** default examples and samples are rendered
- **THEN** the displayed routes and executions SHALL use the corrective Sub-Agent sample set
- **AND** departments SHALL appear only as capability or permission boundaries inside the metadata
