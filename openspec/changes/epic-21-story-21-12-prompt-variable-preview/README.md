# Epic 21, Story 21.12: Prompt Variable Preview

## Overview
Support full rendered prompt preview with token estimation.

## Iron-Law Mapping
- FR: FR855, FR856, FR857
- NFR: NFR3
- ARCH: ADR-038, ADR-040
- UX: UX-02, UX-04

## Acceptance Scope
- Render variable-substituted prompt preview
- Show current variable values and missing inputs
- Estimate token usage and cost before execution

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Render variable-substituted prompt preview | Scenario-1 in specs/spec.md |
| AC-2 | Show current variable values and missing inputs | Scenario-2 in specs/spec.md |
| AC-3 | Estimate token usage and cost before execution | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.11

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
