# Epic 35, Story 35.1: Heartbeat Checklist

## Overview
Implement heartbeat execution with precheck, quiet mode, and checklist governance.

## Iron-Law Mapping
- FR: FR1127, FR1128, FR1129, FR1130, FR1131, FR1132, FR1133, FR1134
- NFR: NFR14
- ARCH: ADR-048
- UX: UX-02, UX-04

## Acceptance Scope
- Load HEARTBEAT checklist and evaluate execution window
- Run precheck for activity, context budget, and availability
- Return `HEARTBEAT_OK` silently when no action is needed

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Load HEARTBEAT checklist and evaluate execution window | Scenario-1 in specs/spec.md |
| AC-2 | Run precheck for activity, context budget, and availability | Scenario-2 in specs/spec.md |
| AC-3 | Return `HEARTBEAT_OK` silently when no action is needed | Scenario-3 in specs/spec.md |

## Dependencies
- Story 32.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
