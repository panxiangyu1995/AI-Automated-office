# Epic 21, Story 21.18: Sub Agent Persona Config

## Overview
Configure Sub-Agent persona, trigger conditions, and SOUL-backed prompt behavior.

## Iron-Law Mapping
- FR: FR905, FR906, FR907, FR908, FR909, FR910, FR911, FR912, FR913, FR914
- NFR: NFR16
- ARCH: ADR-042, ADR-047
- UX: UX-02, UX-04

## Acceptance Scope
- Edit role prompt and invocation description
- Support trigger keywords and conditions
- Apply SOUL-backed template policy with audit for persistent edits

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Edit role prompt and invocation description | Scenario-1 in specs/spec.md |
| AC-2 | Support trigger keywords and conditions | Scenario-2 in specs/spec.md |
| AC-3 | Apply SOUL-backed template policy with audit for persistent edits | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.17

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
