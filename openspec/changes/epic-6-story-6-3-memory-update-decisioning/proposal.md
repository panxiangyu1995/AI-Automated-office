# Proposal: Memory Update Decisioning

## Problem Statement
Support intelligent ADD, UPDATE, DELETE, and NONE decisions for memory updates.

## Goals
- Classify memory write actions from extracted information
- Resolve conflicts against existing memory state
- Update summaries and cognitive state after session stop

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 6.3
- Ad-hoc memory writes or retrieval paths outside governed runtime

## Scope and Boundaries
### Included
- Classify memory write actions from extracted information
- Resolve conflicts against existing memory state
- Update summaries and cognitive state after session stop

### Excluded
- Cross-tenant memory mixing
- Untracked memory mutation without audit metadata

## Dependency Impact
- Story 6.2

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Memory pollution | Response quality degradation | Add write-gating and confidence thresholds |
| Retrieval mismatch | Wrong context injected into prompts | Add ranking, tenant filter, and recency weighting tests |
| PII leakage risk | Compliance and trust issues | Enforce desensitization and permission-scoped retrieval |

## Definition of Done
- Memory write/read/update rules are deterministic and testable
- Retrieval and correction behaviors are observable and auditable
- Lint/build/integration verification recorded in progress tracking
