# Proposal: Connector Health Retry

## Problem Statement
Add connector monitoring, retry, and downgrade handling.

## Goals
- Monitor connector health and recent failures
- Apply retry and downgrade policies
- Expose connector incidents and recovery status

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 30.2
- Uncontrolled cross-channel or cross-agent messaging behavior

## Scope and Boundaries
### Included
- Monitor connector health and recent failures
- Apply retry and downgrade policies
- Expose connector incidents and recovery status

### Excluded
- Bypassing connector/messaging policy gates and audit requirements
- Runtime behavior outside tenant and permission constraints

## Dependency Impact
- Story 30.1

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Connector instability | Downstream task disruption | Add health checks, retry strategy, and downgrade policy |
| Message routing mistakes | Data leakage or wrong recipient actions | Add strict recipient validation and scoped routing rules |
| Missing communication audit | Compliance and incident triage gaps | Enforce immutable audit logs for all critical exchanges |

## Definition of Done
- Connector/messaging state transitions are deterministic and visible
- Permission/routing/audit controls are verified in tests
- Lint/build/integration verification recorded in progress tracking
