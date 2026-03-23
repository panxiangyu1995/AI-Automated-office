# Epic 21, Story 21.2: Llm Provider Defaults

## Overview
Allow default provider and model selection across sessions and agents.

## Iron-Law Mapping
- FR: FR805, FR806, FR807, FR808, FR809
- NFR: NFR29
- ARCH: ADR-038
- UX: UX-02, UX-04

## Acceptance Scope
- Set global and session-level defaults
- Support model parameter configuration
- Persist effective default selection

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Set global and session-level defaults | Scenario-1 in specs/spec.md |
| AC-2 | Support model parameter configuration | Scenario-2 in specs/spec.md |
| AC-3 | Persist effective default selection | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
