# Epic 4, Story 4.8: Checkpoint Restore

## Overview
Support rollback to previous conversation or workspace state from checkpoints.

## Iron-Law Mapping
- FR: FR17-6, FR17-7, FR17-8, FR17-9
- NFR: NFR23
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Add checkpoint restore actions in the session UI
- Support conversation-only and conversation-plus-content restore modes
- Record restore decisions into runtime history

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Add checkpoint restore actions in the session UI | Scenario-1 in specs/spec.md |
| AC-2 | Support conversation-only and conversation-plus-content restore modes | Scenario-2 in specs/spec.md |
| AC-3 | Record restore decisions into runtime history | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.7

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
