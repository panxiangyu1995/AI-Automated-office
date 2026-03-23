# Proposal: Compression Memory Hints

## Problem Statement
Show users what was retained after compression and what the Agent remembered.

## Goals
- Display compression notifications in the session stream
- Render remembered key facts near the input surface
- Keep the hints consistent with actual stored memory state

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 4.14
- Cross-epic capability expansion without explicit dependency completion

## Scope and Boundaries
### Included
- Display compression notifications in the session stream
- Render remembered key facts near the input surface
- Keep the hints consistent with actual stored memory state

### Excluded
- Department custom runtime forks that bypass common agent runtime
- Permission or audit bypass paths

## Dependency Impact
- Story 4.13

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
