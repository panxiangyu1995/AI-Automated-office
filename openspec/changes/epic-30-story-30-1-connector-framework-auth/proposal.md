# Proposal: Connector Framework Auth

## Problem Statement
Build the external connector framework and auth configuration surface.

## Goals
- Define connector registry and auth schemes
- Support OAuth, API key, and certificate modes
- Persist connector configuration for runtime use

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 30.1
- Uncontrolled cross-channel or cross-agent messaging behavior

## Scope and Boundaries
### Included
- Define connector registry and auth schemes
- Support OAuth, API key, and certificate modes
- Persist connector configuration for runtime use

### Excluded
- Bypassing connector/messaging policy gates and audit requirements
- Runtime behavior outside tenant and permission constraints

## Dependency Impact
- Story 10.7

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
