# Epic 32, Story 32.1: Log Metrics Center

## Overview
Expand the baseline runtime metrics into a unified operational log and metrics center.

## Iron-Law Mapping
- FR: FR1100, FR1102, FR1103
- NFR: NFR14, NFR23-8
- ARCH: ADR-023, ADR-048
- UX: UX-02, UX-04

## Acceptance Scope
- Aggregate Agent, tool, plugin, and sync logs
- Show core runtime metrics and health indicators
- Support filtering and export from the log center

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Aggregate Agent, tool, plugin, and sync logs | Scenario-1 in specs/spec.md |
| AC-2 | Show core runtime metrics and health indicators | Scenario-2 in specs/spec.md |
| AC-3 | Support filtering and export from the log center | Scenario-3 in specs/spec.md |

## Dependencies
- Story 37.2

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
