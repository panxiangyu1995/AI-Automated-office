# Proposal: Direct Messaging

## Problem Statement
Enable direct user-to-user messaging and message history management.

## Goals
- Create private chat UI and message send flow
- Persist delivery and read states
- Support history search and filtering

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 11.3
- Uncontrolled cross-channel or cross-agent messaging behavior

## Scope and Boundaries
### Included
- Create private chat UI and message send flow
- Persist delivery and read states
- Support history search and filtering

### Excluded
- Bypassing connector/messaging policy gates and audit requirements
- Runtime behavior outside tenant and permission constraints

## Dependency Impact
- Story 11.2

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
