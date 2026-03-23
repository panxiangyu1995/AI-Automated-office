# Proposal: Checkpoint Auto Create

## Problem Statement
Connect message send flow to checkpoint creation in the common runtime.

## Goals
- Create checkpoints on message submission
- Capture session metadata and related working state
- Display checkpoint markers in the conversation stream

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 4.7
- Cross-epic capability expansion without explicit dependency completion

## Scope and Boundaries
### Included
- Create checkpoints on message submission
- Capture session metadata and related working state
- Display checkpoint markers in the conversation stream

### Excluded
- Department custom runtime forks that bypass common agent runtime
- Permission or audit bypass paths

## Dependency Impact
- Story 4.6

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
