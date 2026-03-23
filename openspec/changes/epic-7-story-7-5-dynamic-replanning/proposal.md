# Proposal: Dynamic Replanning

## Problem Statement
Support bounded replanning with user-visible reason codes during execution.

## Goals
- Detect plan drift from step outcomes
- Replan within bounded policy limits
- Explain plan changes to the user

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 7.5
- Unbounded autonomous execution beyond guardrails

## Scope and Boundaries
### Included
- Detect plan drift from step outcomes
- Replan within bounded policy limits
- Explain plan changes to the user

### Excluded
- Planner/executor behavior that bypasses policy and boundary checks
- Sub-agent execution without explicit routing and capability constraints

## Dependency Impact
- Story 7.4

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Intent misclassification | Wrong task execution path | Add confidence thresholds and clarification prompts |
| Replanning loops | Cost and latency explosion | Add loop detection, iteration cap, and stop conditions |
| Sub-agent overreach | Security or data boundary breach | Restrict capability scope and enforce permission/audit chain |

## Definition of Done
- Planner and executor decisions are deterministic and traceable
- Boundary/loop/guardrail behavior validated in failure scenarios
- Lint/build/integration verification recorded in progress tracking
