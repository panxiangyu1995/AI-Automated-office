# Proposal: Tool Call Detail

## Problem Statement
Provide detailed parameter and result inspection for tool calls.

## Goals
- Show normalized tool input summary and raw details
- Render structured result and raw output references
- Support copy and trace navigation from the UI

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.3
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Show normalized tool input summary and raw details
- Render structured result and raw output references
- Support copy and trace navigation from the UI

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.2

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
