# Epic 6, Story 6.6: Correction Rule Learning

## Overview
Create a durable correction-rule learning pipeline for the Agent.

## Iron-Law Mapping
- FR: FR83, FR84, FR85, FR86, FR87, FR88
- NFR: NFR8-3, NFR16-3
- ARCH: ADR-043, ADR-044
- UX: UX-01, UX-04

## Acceptance Scope
- Capture corrected outputs and reasons
- Extract structured correction rules
- Inject applicable rules into future execution

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Capture corrected outputs and reasons | Scenario-1 in specs/spec.md |
| AC-2 | Extract structured correction rules | Scenario-2 in specs/spec.md |
| AC-3 | Inject applicable rules into future execution | Scenario-3 in specs/spec.md |

## Dependencies
- Story 6.5

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
