# Proposal: Mcp Tool Discovery Management

## Problem Statement
Allow discovery, enablement, and control of MCP-provided tools.

## Goals
- Discover tools from connected MCP services
- Enable or disable individual MCP tools
- Bind tool state into the common runtime registry

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.5
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Discover tools from connected MCP services
- Enable or disable individual MCP tools
- Bind tool state into the common runtime registry

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.4

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
