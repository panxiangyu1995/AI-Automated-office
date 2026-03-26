# Proposal: Agent Observability Panel

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical story traceability only. Ongoing implementation for observability surfaces must follow the corrective change and the updated iron-law documents.

## Problem Statement
Expose task, token, and tool execution metrics to users and admins.

## Goals
- Show session-level token and tool metrics
- Provide tenant-level usage statistics for admins
- Allow report export for review and governance

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.13
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Show session-level token and tool metrics
- Provide tenant-level usage statistics for admins
- Allow report export for review and governance

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.12

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Tool call schema drift | Wrong execution or UI mismatch | Lock descriptor and invoke payload schemas in integration tests |
| Missing permission precheck | Security incident risk | Enforce precheck before execution and block with explicit reason |
| Retry/fallback abuse | Hidden repeated failures | Bound retry policy, record each attempt, expose terminal state |

## Definition of Done
- Tool call lifecycle states are visible and traceable
- Permission/confirmation/audit requirements are verifiable in tests
- Lint/build/integration verification recorded in progress tracking
