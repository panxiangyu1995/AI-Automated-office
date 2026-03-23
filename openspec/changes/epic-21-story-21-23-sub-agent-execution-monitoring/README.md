# Epic 21, Story 21.23: Sub Agent Execution Monitoring

## Overview
Provide execution status, history, and monitoring for Sub-Agent runs.

## Iron-Law Mapping
- FR: FR938, FR924
- NFR: NFR23-4
- ARCH: ADR-042, ADR-037
- UX: UX-02, UX-04

## Acceptance Scope
- Show current Sub-Agent execution state
- List historical runs and outcomes
- Link sub-agent traces back to the main Agent session

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Show current Sub-Agent execution state | Scenario-1 in specs/spec.md |
| AC-2 | List historical runs and outcomes | Scenario-2 in specs/spec.md |
| AC-3 | Link sub-agent traces back to the main Agent session | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.22

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
