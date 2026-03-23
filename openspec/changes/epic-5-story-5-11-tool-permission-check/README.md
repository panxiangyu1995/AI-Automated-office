# Epic 5, Story 5.11: Tool Permission Check

## Overview
Show permission precheck behavior through user-facing tool execution flows.

## Iron-Law Mapping
- FR: FR470, FR471
- NFR: NFR16, NFR23-5
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Validate tool access before execution
- Explain missing permission conditions to the user
- Keep permission decisions visible in execution history

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Validate tool access before execution | Scenario-1 in specs/spec.md |
| AC-2 | Explain missing permission conditions to the user | Scenario-2 in specs/spec.md |
| AC-3 | Keep permission decisions visible in execution history | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.10

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
