# Design: Checkpoint Restore

## Architecture Alignment
- Preserve layered boundaries: Presentation -> Agent Core -> Tool/Plugin -> Data
- Reuse common runtime contracts instead of story-local runtime forks
- Keep permission, confirmation, and audit chains mandatory for sensitive operations

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/session/*`
- `src-tauri/src/agent/checkpoint/*`
- `src-tauri/src/agent/session/history.rs`

## Implementation Plan
### Presentation Layer
- Implement story-specific UI behavior and state binding to runtime events
- Keep visual states explicit: idle/running/success/failure/retry/rollback where applicable
### Agent Runtime Layer
- Add or extend runtime handlers for story actions and recovery paths
- Ensure idempotent command handling for repeated events or retries
### Data and Storage Layer
- Persist minimal required metadata for history, audit, and restore operations
- Preserve backward compatibility for existing session records

## Interface Contracts
- Command contract: UI command payload must include sessionId, actor context, and action params
- Event contract: runtime emits deterministic status events with correlation ids
- Persistence contract: write operations must be auditable and reversible where required by story

## Failure Handling
- Normalize error classes to user-facing recoverable/non-recoverable buckets
- Provide retry gates and bounded backoff for transient failures
- Keep rollback/restore actions explicit and logged

## Test Strategy
- Unit: reducers/state transitions and runtime handlers
- Integration: UI-runtime command/event roundtrip
- Regression: dependency story contracts remain compatible
