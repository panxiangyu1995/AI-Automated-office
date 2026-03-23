# Proposal: Private Market Config

## Problem Statement
Support enterprise-private resource market configuration and isolation.

## Goals
- Configure private market endpoints and policies
- Upload and review private resources
- Keep private and public resource spaces isolated

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 10.5
- Ad-hoc knowledge/resource ingestion without governance path

## Scope and Boundaries
### Included
- Configure private market endpoints and policies
- Upload and review private resources
- Keep private and public resource spaces isolated

### Excluded
- Unsafe import/execute flows without validation and approval
- Knowledge writeback outside tenant and permission boundaries

## Dependency Impact
- Story 10.4

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Low-quality retrieval | Wrong answers and workflow errors | Add ranking quality checks and citation visibility |
| Malicious resource import | Security incident and runtime compromise | Add signature/source validation + approval gate |
| Audit gaps | Inability to investigate incidents | Require immutable audit records for import/execute actions |

## Definition of Done
- Retrieval/import/execution paths are bounded and auditable
- Security validation and fallback behavior are test-covered
- Lint/build/integration verification recorded in progress tracking
