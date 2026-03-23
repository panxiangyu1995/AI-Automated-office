# Epic 30, Story 30.1: Connector Framework Auth

## Overview
Build the external connector framework and auth configuration surface.

## Iron-Law Mapping
- FR: FR1080, FR1081, FR1082, FR1083
- NFR: NFR29, NFR35
- ARCH: ADR-015
- UX: UX-02, UX-04

## Acceptance Scope
- Define connector registry and auth schemes
- Support OAuth, API key, and certificate modes
- Persist connector configuration for runtime use

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Define connector registry and auth schemes | Scenario-1 in specs/spec.md |
| AC-2 | Support OAuth, API key, and certificate modes | Scenario-2 in specs/spec.md |
| AC-3 | Persist connector configuration for runtime use | Scenario-3 in specs/spec.md |

## Dependencies
- Story 10.7

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
