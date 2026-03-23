# Epic 7, Story 7.6: Loop Detection

## Overview
Expose loop detection and interruption behavior in the Agent runtime UX.

## Iron-Law Mapping
- FR: FR420
- NFR: NFR8-5, NFR23-2
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Detect repeated runtime states and tool loops
- Interrupt execution on loop threshold
- Show loop reason and recovery path

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Detect repeated runtime states and tool loops | Scenario-1 in specs/spec.md |
| AC-2 | Interrupt execution on loop threshold | Scenario-2 in specs/spec.md |
| AC-3 | Show loop reason and recovery path | Scenario-3 in specs/spec.md |

## Dependencies
- Story 7.5

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
