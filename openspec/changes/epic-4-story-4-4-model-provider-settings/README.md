# Epic 4, Story 4.4: Model Provider Settings

## Overview
Bridge core provider selection into the product settings surface before the full control plane arrives.

## Iron-Law Mapping
- FR: FR18, FR19
- NFR: NFR29
- ARCH: ADR-037
- UX: UX-02, UX-04

## Acceptance Scope
- Expose current provider and model configuration in settings
- Support API key and relay mode selection
- Allow connection test from the UI

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Expose current provider and model configuration in settings | Scenario-1 in specs/spec.md |
| AC-2 | Support API key and relay mode selection | Scenario-2 in specs/spec.md |
| AC-3 | Allow connection test from the UI | Scenario-3 in specs/spec.md |

## Dependencies
- Story 4.3

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
