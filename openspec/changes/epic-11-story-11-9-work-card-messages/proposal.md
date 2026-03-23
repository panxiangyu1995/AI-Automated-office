# Proposal: Work Card Messages

## Problem Statement
Support structured work-card generation and action handling in messaging.

## Goals
- Render structured work-card messages in chat
- Support card actions with result feedback
- Allow Agent-generated work-card delivery

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 11.9
- Uncontrolled cross-channel or cross-agent messaging behavior

## Scope and Boundaries
### Included
- Render structured work-card messages in chat
- Support card actions with result feedback
- Allow Agent-generated work-card delivery

### Excluded
- Bypassing connector/messaging policy gates and audit requirements
- Runtime behavior outside tenant and permission constraints

## Dependency Impact
- Story 11.8

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
