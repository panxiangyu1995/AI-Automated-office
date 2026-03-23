# Epic 36, Story 36.2: Failover Session Repair

## Overview
Implement provider failover, recovery, and session repair operations.

## Iron-Law Mapping
- FR: FR1155, FR1156, FR1157, FR1158, FR1159, FR1160, FR1161, FR1162, FR1163, FR1164, FR1165, FR1166, FR1167, FR1168, FR1169
- NFR: NFR17, NFR22
- ARCH: ADR-048
- UX: UX-01, UX-04

## Acceptance Scope
- Switch providers and auth profiles on controlled failure conditions
- Repair session and context corruption with diff summary
- Record failover and repair actions for audit and diagnosis

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Switch providers and auth profiles on controlled failure conditions | Scenario-1 in specs/spec.md |
| AC-2 | Repair session and context corruption with diff summary | Scenario-2 in specs/spec.md |
| AC-3 | Record failover and repair actions for audit and diagnosis | Scenario-3 in specs/spec.md |

## Dependencies
- Story 36.1

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
