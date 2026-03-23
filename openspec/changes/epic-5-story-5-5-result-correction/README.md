# Epic 5, Story 5.5: Result Correction

## Overview
Let users correct Agent outputs and turn corrections into reusable guidance.

## Iron-Law Mapping
- FR: FR73, FR81, FR82, FR83, FR85, FR86
- NFR: NFR8-3
- ARCH: ADR-043, ADR-044
- UX: UX-01, UX-04

## Acceptance Scope
- Allow inline editing of generated output
- Capture correction rationale from the user
- Write correction rules into the memory and prompt pipeline

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Allow inline editing of generated output | Scenario-1 in specs/spec.md |
| AC-2 | Capture correction rationale from the user | Scenario-2 in specs/spec.md |
| AC-3 | Write correction rules into the memory and prompt pipeline | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.4

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
