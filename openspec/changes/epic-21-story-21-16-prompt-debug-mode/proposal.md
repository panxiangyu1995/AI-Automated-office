# Proposal: Prompt Debug Mode

## Problem Statement
Create a debug console for prompt, rule, and safety behavior verification.

## Goals
- Run test prompts against the Agent in debug mode
- Show triggered rules and prompt impact
- Display safety blocks and convergence strategy hits

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 21.16
- Hidden config side effects without explicit apply/rollback semantics

## Scope and Boundaries
### Included
- Run test prompts against the Agent in debug mode
- Show triggered rules and prompt impact
- Display safety blocks and convergence strategy hits

### Excluded
- Runtime behavior changes that are not controlled by declared settings contracts
- Tenant-level policy changes without permission checks and audit records

## Dependency Impact
- Story 21.15

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
