# Epic 32, Story 32.2: Task Trace Analysis

## Overview
Add trace-level execution inspection for tasks, steps, and tools.

## Iron-Law Mapping
- FR: FR1101, FR1104, FR1105, FR1106
- NFR: NFR23-8
- ARCH: ADR-023, ADR-048
- UX: UX-02, UX-04

## Acceptance Scope
- Link tasks, steps, and tool calls under a common trace
- Show latency distribution and bottlenecks
- Support drill-down from product events to runtime details

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Link tasks, steps, and tool calls under a common trace | Scenario-1 in specs/spec.md |
| AC-2 | Show latency distribution and bottlenecks | Scenario-2 in specs/spec.md |
| AC-3 | Support drill-down from product events to runtime details | Scenario-3 in specs/spec.md |

## Dependencies
- Story 32.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
