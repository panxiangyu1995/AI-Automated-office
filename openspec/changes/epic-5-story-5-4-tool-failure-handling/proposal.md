# Proposal: Tool Failure Handling

## Problem Statement
Support manual retry and fallback handling for failed tool executions.

## Goals
- Provide retry controls for failed tool calls
- Allow user-supplied fallback result entry where permitted
- Show normalized error reasons and next-step guidance

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.4
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Provide retry controls for failed tool calls
- Allow user-supplied fallback result entry where permitted
- Show normalized error reasons and next-step guidance

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.3

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
