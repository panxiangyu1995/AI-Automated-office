# Design: Chat host integration and E2E baseline

## Architecture Alignment
- Phase: Phase 1 - Execution Spine
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/agent/components/AgentChatPanel.tsx
- src/features/agent/components/StagedReviewPanel.tsx
- src/features/session/runtime/formWritebackAdapter.ts
- src/features/session/runtime/detailSectionWriteback.ts
- src/features/session/runtime/workbenchCardWriteback.ts
- src/features/session/runtime/editorTemplateWriteback.ts

### Backend
- src-tauri/src/storage/message_store.rs
- src-tauri/src/storage/checkpoint_store.rs

### Current Note
AgentChatPanel still falls back to simulateResponse today.

## Technical Design
- Remove the default simulateResponse path
- Connect MessageInput, MessageList, and StagedReviewPanel to the real runtime
- Close the loop from user input to tool call to staged writeback to apply
- Add a mock provider and a minimum tool set for runtime tests
- Add end-to-end coverage for the main Agent loop

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable