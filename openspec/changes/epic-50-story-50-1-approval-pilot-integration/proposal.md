# Proposal: Approval Pilot Integration

## Problem Statement
Validate the common Agent platform in the approval scenario without introducing a separate runtime.

## Goals
- Bind approval context, tools, and dynamic UI targets to the common runtime
- Support read, generate, confirm, and execute loop for approval work
- Verify audit and permission behavior in the scenario

## Non-Goals
- Separate runtime forks per department scenario
- Scenario-specific shortcuts that bypass common policy and audit chain

## Scope and Boundaries
### Included
- Bind approval context, tools, and dynamic UI targets to the common runtime
- Support read, generate, confirm, and execute loop for approval work
- Verify audit and permission behavior in the scenario

### Excluded
- Changes that break cross-scenario runtime reuse guarantees
- Scenario-specific permission behavior inconsistent with global policy model

## Dependency Impact
- Story 36.2

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
