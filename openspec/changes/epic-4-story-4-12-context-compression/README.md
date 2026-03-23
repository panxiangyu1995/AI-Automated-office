# Epic 4, Story 4.12: Context Compression

## Overview
Productize automatic context compression on top of the existing runtime summary capabilities.

## Iron-Law Mapping
- FR: FR-CTX-1, FR-CTX-2, FR-CTX-3, FR-CTX-4, FR-CTX-5
- NFR: NFR8-1
- ARCH: ADR-043, ADR-044
- UX: UX-01, UX-04

## Acceptance Scope
- Detect token threshold crossing in active sessions
- Trigger structured summary generation and recent-history retention
- Store compression output into session memory

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Detect token threshold crossing in active sessions | Scenario-1 in specs/spec.md |
| AC-2 | Trigger structured summary generation and recent-history retention | Scenario-2 in specs/spec.md |
| AC-3 | Store compression output into session memory | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.11

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
