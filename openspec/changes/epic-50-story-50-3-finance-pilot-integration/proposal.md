# Proposal: Finance Pilot Integration

## Problem Statement
Validate the common Agent platform in the finance scenario as the final agent-first pilot.

## Goals
- Bind finance context, tools, and writeback targets to the common runtime
- Support read, analyze, confirm, and execute loop for finance work
- Verify cross-scenario reuse of the same runtime, audit, and permission chain

## Non-Goals
- Separate runtime forks per department scenario
- Scenario-specific shortcuts that bypass common policy and audit chain

## Scope and Boundaries
### Included
- Bind finance context, tools, and writeback targets to the common runtime
- Support read, analyze, confirm, and execute loop for finance work
- Verify cross-scenario reuse of the same runtime, audit, and permission chain

### Excluded
- Changes that break cross-scenario runtime reuse guarantees
- Scenario-specific permission behavior inconsistent with global policy model

## Dependency Impact
- Story 50.2

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Scenario coupling drift | Reuse regression across departments | Freeze common runtime contract and run scenario conformance checks |
| Writeback inconsistency | Data correctness and trust issues | Enforce unified writeback adapter contracts + validation |
| Audit gap in pilot flows | Incomplete production readiness | Require mandatory audit coverage for all pilot actions |

## Definition of Done
- Three pilot flows run on same common runtime chain without runtime fork
- Permission/audit/writeback behavior is consistent and traceable across scenarios
- Lint/build/integration verification recorded in progress tracking
