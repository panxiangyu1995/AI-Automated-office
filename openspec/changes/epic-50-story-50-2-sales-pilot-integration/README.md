# Epic 50, Story 50.2: Sales Pilot Integration

## Overview
Validate the common Agent platform in the sales scenario using the same runtime chain.

## Iron-Law Mapping
- FR: FR410, FR412, FR464
- NFR: NFR23-1, NFR23-7
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Bind sales context, tools, and writeback targets to the common runtime
- Support read, generate, confirm, and execute loop for sales work
- Verify that no department-specific runtime fork is introduced

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Bind sales context, tools, and writeback targets to the common runtime | Scenario-1 in specs/spec.md |
| AC-2 | Support read, generate, confirm, and execute loop for sales work | Scenario-2 in specs/spec.md |
| AC-3 | Verify that no department-specific runtime fork is introduced | Scenario-3 in specs/spec.md |

## Dependencies
- Story 50.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
