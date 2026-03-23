# Epic 50, Story 50.1: Approval Pilot Integration

## Overview
Validate the common Agent platform in the approval scenario without introducing a separate runtime.

## Iron-Law Mapping
- FR: FR410, FR470, FR496
- NFR: NFR23-1, NFR23-8
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Bind approval context, tools, and dynamic UI targets to the common runtime
- Support read, generate, confirm, and execute loop for approval work
- Verify audit and permission behavior in the scenario

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Bind approval context, tools, and dynamic UI targets to the common runtime | Scenario-1 in specs/spec.md |
| AC-2 | Support read, generate, confirm, and execute loop for approval work | Scenario-2 in specs/spec.md |
| AC-3 | Verify audit and permission behavior in the scenario | Scenario-3 in specs/spec.md |

## Dependencies
- Story 36.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
