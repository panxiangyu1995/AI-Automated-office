# Proposal: Log Metrics Center

## Problem Statement
Expand the baseline runtime metrics into a unified operational log and metrics center.

## Goals
- Aggregate Agent, tool, plugin, and sync logs
- Show core runtime metrics and health indicators
- Support filtering and export from the log center

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 32.1
- Hidden reliability behavior without observability and policy controls

## Scope and Boundaries
### Included
- Aggregate Agent, tool, plugin, and sync logs
- Show core runtime metrics and health indicators
- Support filtering and export from the log center

### Excluded
- Runtime failover/self-healing behavior outside governed policy settings
- Silent failures without trace, metric, or user-facing diagnosis

## Dependency Impact
- Story 37.2

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
