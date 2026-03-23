# Epic 7, Story 7.5: Dynamic Replanning

## Overview
Support bounded replanning with user-visible reason codes during execution.

## Iron-Law Mapping
- FR: FR413, FR415
- NFR: NFR22
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Detect plan drift from step outcomes
- Replan within bounded policy limits
- Explain plan changes to the user

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Detect plan drift from step outcomes | Scenario-1 in specs/spec.md |
| AC-2 | Replan within bounded policy limits | Scenario-2 in specs/spec.md |
| AC-3 | Explain plan changes to the user | Scenario-3 in specs/spec.md |

## Dependencies
- Story 7.4

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
