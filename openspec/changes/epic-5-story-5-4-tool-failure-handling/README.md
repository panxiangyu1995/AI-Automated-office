# Epic 5, Story 5.4: Tool Failure Handling

## Overview
Support manual retry and fallback handling for failed tool executions.

## Iron-Law Mapping
- FR: FR71, FR72
- NFR: NFR22
- ARCH: ADR-017, ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Provide retry controls for failed tool calls
- Allow user-supplied fallback result entry where permitted
- Show normalized error reasons and next-step guidance

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Provide retry controls for failed tool calls | Scenario-1 in specs/spec.md |
| AC-2 | Allow user-supplied fallback result entry where permitted | Scenario-2 in specs/spec.md |
| AC-3 | Show normalized error reasons and next-step guidance | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.3

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
