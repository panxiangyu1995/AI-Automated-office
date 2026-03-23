# Proposal: Sensitive Operation Confirmation

## Problem Statement
Complete sensitive-operation confirmation cards in the chat execution flow.

## Goals
- Identify high-risk tool operations in the conversation flow
- Render confirmation cards with risk detail
- Support approve, modify, or cancel outcomes

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.9
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Identify high-risk tool operations in the conversation flow
- Render confirmation cards with risk detail
- Support approve, modify, or cancel outcomes

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.8

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
