# Epic 4, Story 4.7: Checkpoint Auto Create

## Overview
Connect message send flow to checkpoint creation in the common runtime.

## Iron-Law Mapping
- FR: FR17-1, FR17-2, FR17-4
- NFR: NFR23
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Create checkpoints on message submission
- Capture session metadata and related working state
- Display checkpoint markers in the conversation stream

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Create checkpoints on message submission | Scenario-1 in specs/spec.md |
| AC-2 | Capture session metadata and related working state | Scenario-2 in specs/spec.md |
| AC-3 | Display checkpoint markers in the conversation stream | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.6

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
