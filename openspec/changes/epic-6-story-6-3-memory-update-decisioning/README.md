# Epic 6, Story 6.3: Memory Update Decisioning

## Overview
Support intelligent ADD, UPDATE, DELETE, and NONE decisions for memory updates.

## Iron-Law Mapping
- FR: FR262, FR263, FR264
- NFR: NFR8-4
- ARCH: ADR-043, ADR-044
- UX: UX-04

## Acceptance Scope
- Classify memory write actions from extracted information
- Resolve conflicts against existing memory state
- Update summaries and cognitive state after session stop

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Classify memory write actions from extracted information | Scenario-1 in specs/spec.md |
| AC-2 | Resolve conflicts against existing memory state | Scenario-2 in specs/spec.md |
| AC-3 | Update summaries and cognitive state after session stop | Scenario-3 in specs/spec.md |

## Dependencies
- Story 6.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
