# Epic 21, Story 21.6: Mcp Approve Policy

## Overview
Configure per-tool approve policies for MCP tool execution.

## Iron-Law Mapping
- FR: FR825, FR826, FR827, FR828
- NFR: NFR16
- ARCH: ADR-039
- UX: UX-02, UX-04

## Acceptance Scope
- Support auto, confirm, and deny policies
- Apply defaults and per-tool overrides
- Expose effective policy to the runtime and UI

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Support auto, confirm, and deny policies | Scenario-1 in specs/spec.md |
| AC-2 | Apply defaults and per-tool overrides | Scenario-2 in specs/spec.md |
| AC-3 | Expose effective policy to the runtime and UI | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.5

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
