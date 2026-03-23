# Epic 7, Story 7.7: Task Boundary Control

## Overview
Add execution boundaries for iterations, timeout, and user interruption.

## Iron-Law Mapping
- FR: FR421, FR422, FR423
- NFR: NFR23-1
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Apply iteration and timeout bounds to runtime execution
- Support user interruption entry points
- Show boundary termination causes in runtime history

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Apply iteration and timeout bounds to runtime execution | Scenario-1 in specs/spec.md |
| AC-2 | Support user interruption entry points | Scenario-2 in specs/spec.md |
| AC-3 | Show boundary termination causes in runtime history | Scenario-3 in specs/spec.md |

## Dependencies
- Story 7.6

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
