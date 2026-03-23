# Proposal: Sub Agent Model Config

## Problem Statement
Allow per-Sub-Agent model and parameter selection.

## Goals
- Choose provider and model per Sub-Agent
- Set model parameters and limits
- Persist execution defaults for each Sub-Agent

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.21
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Choose provider and model per Sub-Agent
- Set model parameters and limits
- Persist execution defaults for each Sub-Agent

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.20

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
