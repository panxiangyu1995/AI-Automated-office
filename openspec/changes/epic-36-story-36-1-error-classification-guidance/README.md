# Epic 36, Story 36.1: Error Classification Guidance

## Overview
Provide unified error classification and actionable recovery guidance.

## Iron-Law Mapping
- FR: FR1146, FR1147, FR1148, FR1149, FR1150, FR1151, FR1152, FR1153, FR1154
- NFR: NFR17
- ARCH: ADR-048
- UX: UX-01, UX-04

## Acceptance Scope
- Define user-facing error classes and codes
- Desensitize error output before display
- Attach recovery suggestions and fallback hints

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Define user-facing error classes and codes | Scenario-1 in specs/spec.md |
| AC-2 | Desensitize error output before display | Scenario-2 in specs/spec.md |
| AC-3 | Attach recovery suggestions and fallback hints | Scenario-3 in specs/spec.md |

## Dependencies
- Story 35.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
