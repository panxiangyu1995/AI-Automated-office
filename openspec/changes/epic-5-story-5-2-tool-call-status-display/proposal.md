# Proposal: Tool Call Status Display

## Problem Statement
Render real-time tool invocation cards in the Agent conversation stream.

## Goals
- Show tool call start and running state
- Update cards on success or failure
- Keep status synchronized with streamed runtime events

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.2
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Show tool call start and running state
- Update cards on success or failure
- Keep status synchronized with streamed runtime events

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.1

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
