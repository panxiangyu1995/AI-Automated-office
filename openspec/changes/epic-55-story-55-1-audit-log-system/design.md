# Design: Trace, audit, and failure persistence

## Architecture Alignment
- Phase: Phase 3 - Reliability and Governance
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/traceAndStepLog.ts
- src/features/session/runtime/toolAuditLog.ts
- src/features/session/runtime/failureRecording.ts

### Backend
- src-tauri/src/storage/message_store.rs
- src-tauri/src/storage/session_store.rs

### Current Note
The models exist, but there are no backend trace or audit records yet.

## Technical Design
- Design trace, tool audit, and execution record storage
- Write trace and audit events from orchestrator and tool pipeline
- Expose query commands by session, trace, tool, and task
- Connect debug panels to real data sources
- Ensure audit coverage for tool calls, confirmations, failures, and results

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable