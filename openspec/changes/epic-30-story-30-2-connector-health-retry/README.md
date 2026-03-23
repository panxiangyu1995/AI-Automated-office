# Epic 30, Story 30.2: Connector Health Retry

## Overview
Add connector monitoring, retry, and downgrade handling.

## Iron-Law Mapping
- FR: FR1084, FR1085, FR1086
- NFR: NFR35
- ARCH: ADR-015, ADR-048
- UX: UX-02, UX-04

## Acceptance Scope
- Monitor connector health and recent failures
- Apply retry and downgrade policies
- Expose connector incidents and recovery status

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Monitor connector health and recent failures | Scenario-1 in specs/spec.md |
| AC-2 | Apply retry and downgrade policies | Scenario-2 in specs/spec.md |
| AC-3 | Expose connector incidents and recovery status | Scenario-3 in specs/spec.md |

## Dependencies
- Story 30.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
