# Proposal: Model Provider Settings

## Problem Statement
Bridge core provider selection into the product settings surface before the full control plane arrives.

## Goals
- Expose current provider and model configuration in settings
- Support API key and relay mode selection
- Allow connection test from the UI

## Non-Goals
- Features not mapped to FR/NFR/ARCH/UX of Story 4.4
- Cross-epic capability expansion without explicit dependency completion

## Scope and Boundaries
### Included
- Expose current provider and model configuration in settings
- Support API key and relay mode selection
- Allow connection test from the UI

### Excluded
- Department custom runtime forks that bypass common agent runtime
- Permission or audit bypass paths

## Dependency Impact
- Story 4.3

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
