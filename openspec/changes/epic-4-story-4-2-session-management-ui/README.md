# Epic 4, Story 4.2: Session Management Ui

## Overview
Expose session creation, listing, rename, and deletion through the Agent UI.

## Iron-Law Mapping
- FR: FR10
- NFR: NFR1
- ARCH: ADR-037
- UX: UX-01, UX-04

## Acceptance Scope
- Build session list and new session entry points
- Support rename and delete actions for sessions
- Bind UI state to the persisted runtime session store

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Build session list and new session entry points | Scenario-1 in specs/spec.md |
| AC-2 | Support rename and delete actions for sessions | Scenario-2 in specs/spec.md |
| AC-3 | Bind UI state to the persisted runtime session store | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
