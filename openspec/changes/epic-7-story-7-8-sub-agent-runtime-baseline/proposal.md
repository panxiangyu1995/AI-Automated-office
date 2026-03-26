# Proposal: Sub Agent Runtime Baseline

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical story traceability only. Ongoing implementation for user-main-Agent to Sub-Agent runtime ownership must follow the corrective change and the updated iron-law documents.

## Problem Statement
Expose automatic sub-agent creation behavior through the core Agent execution surface.

## Goals
- Detect when subtasks require sub-agent delegation
- Create sub-agent execution branches under the common runtime
- Show sub-agent state and results to the user

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 7.8
- Unbounded autonomous execution beyond guardrails

## Scope and Boundaries
### Included
- Detect when subtasks require sub-agent delegation
- Create sub-agent execution branches under the common runtime
- Show sub-agent state and results to the user

### Excluded
- Planner/executor behavior that bypasses policy and boundary checks
- Sub-agent execution without explicit routing and capability constraints

## Dependency Impact
- Story 7.7

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
