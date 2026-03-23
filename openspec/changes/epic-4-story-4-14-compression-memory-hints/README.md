# Epic 4, Story 4.14: Compression Memory Hints

## Overview
Show users what was retained after compression and what the Agent remembered.

## Iron-Law Mapping
- FR: FR-CTX-6, FR-CTX-7, FR14-2
- NFR: NFR1
- ARCH: ADR-043, ADR-044
- UX: UX-01, UX-04

## Acceptance Scope
- Display compression notifications in the session stream
- Render remembered key facts near the input surface
- Keep the hints consistent with actual stored memory state

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Display compression notifications in the session stream | Scenario-1 in specs/spec.md |
| AC-2 | Render remembered key facts near the input surface | Scenario-2 in specs/spec.md |
| AC-3 | Keep the hints consistent with actual stored memory state | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.13

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
