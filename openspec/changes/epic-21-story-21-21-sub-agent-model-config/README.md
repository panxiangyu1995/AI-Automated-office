# Epic 21, Story 21.21: Sub Agent Model Config

## Overview
Allow per-Sub-Agent model and parameter selection.

## Iron-Law Mapping
- FR: FR905, FR909, FR910
- NFR: NFR29
- ARCH: ADR-042
- UX: UX-02, UX-04

## Acceptance Scope
- Choose provider and model per Sub-Agent
- Set model parameters and limits
- Persist execution defaults for each Sub-Agent

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Choose provider and model per Sub-Agent | Scenario-1 in specs/spec.md |
| AC-2 | Set model parameters and limits | Scenario-2 in specs/spec.md |
| AC-3 | Persist execution defaults for each Sub-Agent | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.20

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
