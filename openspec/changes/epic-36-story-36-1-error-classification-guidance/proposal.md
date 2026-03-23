# Proposal: Error Classification Guidance

## Problem Statement
Provide unified error classification and actionable recovery guidance.

## Goals
- Define user-facing error classes and codes
- Desensitize error output before display
- Attach recovery suggestions and fallback hints

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 36.1
- Hidden reliability behavior without observability and policy controls

## Scope and Boundaries
### Included
- Define user-facing error classes and codes
- Desensitize error output before display
- Attach recovery suggestions and fallback hints

### Excluded
- Runtime failover/self-healing behavior outside governed policy settings
- Silent failures without trace, metric, or user-facing diagnosis

## Dependency Impact
- Story 35.2

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| False health signals | Wrong failover or disable actions | Add multi-signal checks and cooldown windows |
| Retry storms | Resource exhaustion and instability | Add bounded retry, jitter, and mutex controls |
| Error misclassification | Wrong remediation guidance | Define error taxonomy + recovery playbook mapping |

## Definition of Done
- Health/trace/error/failover flows are deterministic and auditable
- Scheduler/heartbeat guardrails are validated with failure scenarios
- Lint/build/integration verification recorded in progress tracking
