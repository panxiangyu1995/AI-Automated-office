# Epic 7, Story 7.1: Intent Parsing

## Overview
Complete intent parsing and parameter extraction at the Agent product layer.

## Iron-Law Mapping
- FR: FR400, FR401, FR402
- NFR: NFR1
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Parse user intent and key parameters from chat input
- Detect ambiguity and request clarification when needed
- Feed structured intent into planner and tool selection flows

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Parse user intent and key parameters from chat input | Scenario-1 in specs/spec.md |
| AC-2 | Detect ambiguity and request clarification when needed | Scenario-2 in specs/spec.md |
| AC-3 | Feed structured intent into planner and tool selection flows | Scenario-3 in specs/spec.md |

## Dependencies
- Story 6.8

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
