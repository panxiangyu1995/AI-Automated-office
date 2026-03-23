## ADDED Requirements

### Requirement: Story 50.1 - Approval Pilot Integration
The system SHALL implement the full acceptance scope for Story 50.1 while staying aligned with FR(FR410, FR470, FR496), NFR(NFR23-1, NFR23-8), ARCH(ADR-037), and UX(UX-01, UX-04).

#### Scenario-1: Acceptance item 1
- **GIVEN** dependencies are complete and the common runtime contract is active
- **WHEN** Bind approval context, tools, and dynamic UI targets to the common runtime
- **THEN** scenario behavior SHALL execute through shared runtime chain with consistent policy and audit traces

#### Scenario-2: Acceptance item 2
- **GIVEN** dependencies are complete and the common runtime contract is active
- **WHEN** Support read, generate, confirm, and execute loop for approval work
- **THEN** scenario behavior SHALL execute through shared runtime chain with consistent policy and audit traces

#### Scenario-3: Acceptance item 3
- **GIVEN** dependencies are complete and the common runtime contract is active
- **WHEN** Verify audit and permission behavior in the scenario
- **THEN** scenario behavior SHALL execute through shared runtime chain with consistent policy and audit traces

#### Scenario-F1: Scenario adapter contract mismatch
- **GIVEN** context/tool/writeback mapping is incompatible with common runtime contract
- **WHEN** scenario flow starts
- **THEN** execution SHALL be blocked with contract diagnostics and no partial side effects

#### Scenario-F2: Cross-scenario parity regression
- **GIVEN** one scenario introduces runtime behavior inconsistent with others
- **WHEN** conformance checks run
- **THEN** regression SHALL be detected and deployment SHALL be gated until fixed

#### Scenario-O1: Pilot observability completeness
- **GIVEN** pilot scenarios execute end-to-end
- **WHEN** operators inspect traces and audit logs
- **THEN** decision path, confirmation steps, tool calls, and writeback outcomes SHALL be reconstructable
