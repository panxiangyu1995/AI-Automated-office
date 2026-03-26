# Proposal: Sub Agent Routing

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical story traceability only. Ongoing implementation for main-Agent to Sub-Agent routing must follow the corrective change and the updated iron-law documents.

## Problem Statement
Create automatic and manual routing from the main Agent to Sub-Agents.

## Goals
- Match messages against trigger conditions
- Recommend or auto-select a Sub-Agent
- Track routing decisions in execution history

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.22
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Match messages against trigger conditions
- Recommend or auto-select a Sub-Agent
- Track routing decisions in execution history

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.21

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
