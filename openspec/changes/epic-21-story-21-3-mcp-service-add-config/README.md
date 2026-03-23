# Epic 21, Story 21.3: Mcp Service Add Config

## Overview
Build the MCP service registry entry flow for the Agent control plane.

## Iron-Law Mapping
- FR: FR810, FR811, FR812, FR813
- NFR: NFR30
- ARCH: ADR-015, ADR-039
- UX: UX-02, UX-04

## Acceptance Scope
- Add MCP service definition and command configuration
- Support args, env, and runtime policy settings
- Persist MCP service records for later discovery

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Add MCP service definition and command configuration | Scenario-1 in specs/spec.md |
| AC-2 | Support args, env, and runtime policy settings | Scenario-2 in specs/spec.md |
| AC-3 | Persist MCP service records for later discovery | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
