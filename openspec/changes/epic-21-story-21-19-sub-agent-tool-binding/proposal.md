# Proposal: Sub Agent Tool Binding

## Problem Statement
Bind scoped MCP tools and Skills to each Sub-Agent.

## Goals
- Bind allowed MCP tools to a Sub-Agent
- Bind allowed Skills and effective approve policy
- Persist scoped capability selection

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.19
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Bind allowed MCP tools to a Sub-Agent
- Bind allowed Skills and effective approve policy
- Persist scoped capability selection

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.18

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Misconfigured providers/MCP | Service instability and task failure | Add preflight validation and connection health checks |
| Prompt/rule regression | Output quality and safety degradation | Add versioning, preview, and rollback controls |
| Sub-agent misrouting | Wrong execution path and data exposure | Enforce routing policy and scoped capability binding |

## Definition of Done
- Config create/update/delete/apply flows are deterministic and auditable
- Debug/preview/version rollback paths are test-covered for relevant settings
- Lint/build/integration verification recorded in progress tracking
