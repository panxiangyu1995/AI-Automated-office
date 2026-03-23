# Proposal: User Preference Memory

## Problem Statement
Productize long-term user preference capture and application.

## Goals
- Store user preferences by scene and type
- Apply preferences during generation
- Provide preference editing UI

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 6.2
- Ad-hoc memory writes or retrieval paths outside governed runtime

## Scope and Boundaries
### Included
- Store user preferences by scene and type
- Apply preferences during generation
- Provide preference editing UI

### Excluded
- Cross-tenant memory mixing
- Untracked memory mutation without audit metadata

## Dependency Impact
- Story 6.1

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
