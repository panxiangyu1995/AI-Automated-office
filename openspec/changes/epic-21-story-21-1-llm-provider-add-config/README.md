# Epic 21, Story 21.1: Llm Provider Add Config

## Overview
Create the provider registry and add-provider UI for the Agent control plane.

## Iron-Law Mapping
- FR: FR800, FR801, FR802, FR803, FR804
- NFR: NFR29, NFR15
- ARCH: ADR-038
- UX: UX-02, UX-04

## Acceptance Scope
- Support preset and custom OpenAI-compatible providers
- Store provider credentials securely
- Test provider connectivity from the control plane

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Support preset and custom OpenAI-compatible providers | Scenario-1 in specs/spec.md |
| AC-2 | Store provider credentials securely | Scenario-2 in specs/spec.md |
| AC-3 | Test provider connectivity from the control plane | Scenario-3 in specs/spec.md |

## Dependencies
- Story 7.9

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
