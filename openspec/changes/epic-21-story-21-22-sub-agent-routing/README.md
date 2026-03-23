# Epic 21, Story 21.22: Sub Agent Routing

## Overview
Create automatic and manual routing from the main Agent to Sub-Agents.

## Iron-Law Mapping
- FR: FR930, FR931, FR932, FR933, FR934, FR935, FR936, FR937, FR938
- NFR: NFR8-12
- ARCH: ADR-042
- UX: UX-02, UX-04

## Acceptance Scope
- Match messages against trigger conditions
- Recommend or auto-select a Sub-Agent
- Track routing decisions in execution history

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Match messages against trigger conditions | Scenario-1 in specs/spec.md |
| AC-2 | Recommend or auto-select a Sub-Agent | Scenario-2 in specs/spec.md |
| AC-3 | Track routing decisions in execution history | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.21

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
