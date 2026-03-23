# Proposal: Tool Registry Management

## Problem Statement
Productize the unified tool registry for user and admin visibility.

## Goals
- Expose registered core, plugin, and MCP tools
- Show tool descriptor metadata and availability
- Keep the management surface aligned with the common tool runtime

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 5.1
- Runtime or policy shortcuts that bypass tool governance

## Scope and Boundaries
### Included
- Expose registered core, plugin, and MCP tools
- Show tool descriptor metadata and availability
- Keep the management surface aligned with the common tool runtime

### Excluded
- Cross-epic expansion not covered by dependencies
- Unsafe operations without explicit confirmation/permission gates

## Dependency Impact
- Story 4.14

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
