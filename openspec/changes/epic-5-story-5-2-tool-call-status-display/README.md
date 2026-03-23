# Epic 5, Story 5.2: Tool Call Status Display

## Overview
Render real-time tool invocation cards in the Agent conversation stream.

## Iron-Law Mapping
- FR: FR69
- NFR: NFR8-11
- ARCH: ADR-017, ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Show tool call start and running state
- Update cards on success or failure
- Keep status synchronized with streamed runtime events

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Show tool call start and running state | Scenario-1 in specs/spec.md |
| AC-2 | Update cards on success or failure | Scenario-2 in specs/spec.md |
| AC-3 | Keep status synchronized with streamed runtime events | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
