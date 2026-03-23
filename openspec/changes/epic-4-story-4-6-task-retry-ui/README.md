# Epic 4, Story 4.6: Task Retry Ui

## Overview
Expose retry behavior and failure explanation in the Agent task UI.

## Iron-Law Mapping
- FR: FR16
- NFR: NFR22
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Show retry status for failed tasks
- Render retry count and backoff behavior in execution history
- Provide clear terminal failure explanation to users

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Show retry status for failed tasks | Scenario-1 in specs/spec.md |
| AC-2 | Render retry count and backoff behavior in execution history | Scenario-2 in specs/spec.md |
| AC-3 | Provide clear terminal failure explanation to users | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.5

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
