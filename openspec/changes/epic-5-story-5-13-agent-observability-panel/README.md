# Epic 5, Story 5.13: Agent Observability Panel

## Overview
Expose task, token, and tool execution metrics to users and admins.

## Iron-Law Mapping
- FR: FR500, FR502, FR504, FR505
- NFR: NFR8-11, NFR23-8
- ARCH: ADR-023, ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Show session-level token and tool metrics
- Provide tenant-level usage statistics for admins
- Allow report export for review and governance

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Show session-level token and tool metrics | Scenario-1 in specs/spec.md |
| AC-2 | Provide tenant-level usage statistics for admins | Scenario-2 in specs/spec.md |
| AC-3 | Allow report export for review and governance | Scenario-3 in specs/spec.md |

## Dependencies
- Story 5.12

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
