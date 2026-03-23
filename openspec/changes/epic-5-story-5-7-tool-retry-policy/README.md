# Epic 5, Story 5.7: Tool Retry Policy

## Overview
Expose retry policy configuration for tool calls.

## Iron-Law Mapping
- FR: FR76
- NFR: NFR22
- ARCH: ADR-017
- UX: UX-02, UX-04

## Acceptance Scope
- Allow retry count and backoff policy configuration
- Support per-error-type retry handling
- Persist retry settings for runtime enforcement

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Allow retry count and backoff policy configuration | Scenario-1 in specs/spec.md |
| AC-2 | Support per-error-type retry handling | Scenario-2 in specs/spec.md |
| AC-3 | Persist retry settings for runtime enforcement | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.6

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
