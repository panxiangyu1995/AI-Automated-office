# Epic 4, Story 4.1: Agent Chat Ui

## Overview
Build the product-facing chat panel on top of the completed common Agent runtime.

## Iron-Law Mapping
- FR: FR9
- NFR: NFR3
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Integrate the common runtime session stream into the AI panel
- Render user and assistant messages with streaming updates
- Support markdown and code display in responses

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Integrate the common runtime session stream into the AI panel | Scenario-1 in specs/spec.md |
| AC-2 | Render user and assistant messages with streaming updates | Scenario-2 in specs/spec.md |
| AC-3 | Support markdown and code display in responses | Scenario-3 in specs/spec.md |

## Dependencies
- None

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
