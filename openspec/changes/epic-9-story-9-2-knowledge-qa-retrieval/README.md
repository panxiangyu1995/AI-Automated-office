# Epic 9, Story 9.2: Knowledge Qa Retrieval

## Overview
Productize knowledge-backed Q&A retrieval for the Agent.

## Iron-Law Mapping
- FR: FR283, FR284, FR285
- NFR: NFR8-2
- ARCH: ADR-043
- UX: UX-01, UX-04

## Acceptance Scope
- Run hybrid retrieval over configured knowledge bases
- Inject cited knowledge into Agent answers
- Expose answer source details in the UI

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Run hybrid retrieval over configured knowledge bases | Scenario-1 in specs/spec.md |
| AC-2 | Inject cited knowledge into Agent answers | Scenario-2 in specs/spec.md |
| AC-3 | Expose answer source details in the UI | Scenario-3 in specs/spec.md |

## Dependencies
- Story 9.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
