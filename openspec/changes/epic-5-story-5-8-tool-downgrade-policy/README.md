# Epic 5, Story 5.8: Tool Downgrade Policy

## Overview
Support admin-defined downgrade paths when tools are unavailable.

## Iron-Law Mapping
- FR: FR77
- NFR: NFR35
- ARCH: ADR-017
- UX: UX-02, UX-04

## Acceptance Scope
- Define fallback tool or fallback behavior options
- Expose downgrade hints for the user
- Persist downgrade rules for runtime use

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Define fallback tool or fallback behavior options | Scenario-1 in specs/spec.md |
| AC-2 | Expose downgrade hints for the user | Scenario-2 in specs/spec.md |
| AC-3 | Persist downgrade rules for runtime use | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.7

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
