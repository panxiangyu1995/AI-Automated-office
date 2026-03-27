# Design: Runtime event streaming bridge

## Architecture Alignment
- Phase: Phase 1 - Execution Spine
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/streaming/runtime/runtimeEvents.ts
- src/features/streaming/runtime/streamingHostContext.tsx

### Backend
- src-tauri/src/lib.rs

### Current Note
Current event emission is local to the frontend and not driven by real backend execution.

## Technical Design
- Define runtime event protocol and event type mapping
- Implement backend to frontend event bridge
- Connect StreamingHostContext to the real event source
- Handle ordering, reconnect, replay, and interruption consistency
- Verify chat and debug panels consume real runtime events

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable