# Proposal: Tool Downgrade Policy

## Problem Statement
Support admin-defined downgrade paths when tools are unavailable.

## Goals
- Define fallback tool or fallback behavior options
- Expose downgrade hints for the user
- Persist downgrade rules for runtime use

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.8
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Define fallback tool or fallback behavior options
- Expose downgrade hints for the user
- Persist downgrade rules for runtime use

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 5.7

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
