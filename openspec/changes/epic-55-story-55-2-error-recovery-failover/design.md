# Design: Retry, replan, and checkpoint recovery

## Architecture Alignment
- Phase: Phase 3 - Reliability and Governance
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/replan/replanStrategy.ts
- src/features/agent/components/CheckpointManagementPanel.tsx
- src/features/agent/components/FailoverSessionRepair.tsx

### Backend
- src-tauri/src/storage/checkpoint_store.rs
- src-tauri/src/storage/message_store.rs

### Current Note
Recovery models exist, but there is no actual backend recovery loop yet.

## Technical Design
- Connect retry and replan decisions to real execution outcomes
- Implement checkpoint save, activate, rollback, and restore
- Trigger recovery from tool failure, timeout, and interruption
- Feed recovery state back to chat and debug views
- Verify interruption, retry, rollback, and restore end to end

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable