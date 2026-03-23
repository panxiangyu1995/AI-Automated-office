# Proposal: Context Compression

## Problem Statement
Productize automatic context compression on top of the existing runtime summary capabilities.

## Goals
- Detect token threshold crossing in active sessions
- Trigger structured summary generation and recent-history retention
- Store compression output into session memory

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 4.12
- Cross-epic capability expansion without explicit dependency completion

## Scope and Boundaries
### Included
- Detect token threshold crossing in active sessions
- Trigger structured summary generation and recent-history retention
- Store compression output into session memory

### Excluded
- Department custom runtime forks that bypass common agent runtime
- Permission or audit bypass paths

## Dependency Impact
- Story 4.11

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Runtime/UI contract drift | User-facing behavior mismatch | Pin event and payload schema in integration tests |
| State inconsistency during failures | Data and UX confusion | Add idempotency and explicit failure state transitions |
| Permission or audit blind spots | Security and compliance issues | Enforce precheck and mandatory audit logging |

## Definition of Done
- All acceptance steps in `tasks.md` marked complete
- `specs/spec.md` scenarios pass in verification artifacts
- Lint/build/integration verification recorded in progress tracking
