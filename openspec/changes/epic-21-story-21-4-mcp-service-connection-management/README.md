# Epic 21, Story 21.4: Mcp Service Connection Management

## Overview
Expose MCP service connection, health, and state management.

## Iron-Law Mapping
- FR: FR814, FR815, FR816, FR817
- NFR: NFR30
- ARCH: ADR-015, ADR-039
- UX: UX-02, UX-04

## Acceptance Scope
- Show service online, offline, and error states
- Allow reconnect and disable operations
- Persist service health and last-check information

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Show service online, offline, and error states | Scenario-1 in specs/spec.md |
| AC-2 | Allow reconnect and disable operations | Scenario-2 in specs/spec.md |
| AC-3 | Persist service health and last-check information | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.3

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
