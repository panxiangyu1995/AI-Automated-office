# Proposal: Sub Agent Registry

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical story traceability only. Ongoing implementation for user-owned Sub-Agent management must follow the corrective change and the updated iron-law documents.

## Problem Statement
Create the product surface for Sub-Agent CRUD and lifecycle control.

## Goals
- Support create, edit, enable, disable, and delete
- Provide template-based Sub-Agent creation
- Persist registry and status metadata

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.17
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Support create, edit, enable, disable, and delete
- Provide template-based Sub-Agent creation
- Persist registry and status metadata

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.16

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
