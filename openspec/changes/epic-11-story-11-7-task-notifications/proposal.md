# Proposal: Task Notifications

## Problem Statement
Send governed task and status notifications through the unified message system.

## Goals
- Push task completion and pending notifications
- Respect user preference and do-not-disturb settings
- Track delivery and reminder state

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 11.7
- Uncontrolled cross-channel or cross-agent messaging behavior

## Scope and Boundaries
### Included
- Push task completion and pending notifications
- Respect user preference and do-not-disturb settings
- Track delivery and reminder state

### Excluded
- Bypassing connector/messaging policy gates and audit requirements
- Runtime behavior outside tenant and permission constraints

## Dependency Impact
- Story 11.6

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
