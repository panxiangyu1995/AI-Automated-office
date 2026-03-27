# Design: Context compression and session summary persistence

## Architecture Alignment
- Phase: Phase 2 - Context, Memory, Prompt
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/sessionMemorySummary.ts
- src/features/agent/hooks/useContextCompression.ts

### Backend
- src-tauri/src/storage/memory_store.rs

### Current Note
The summary model exists, but it is not yet part of real backend runtime behavior.

## Technical Design
- Create summary refresh triggers and persistence structures
- Generate reusable session summaries and key facts from real history
- Implement token budget and compression policy
- Feed compressed context back into PromptBuilder
- Add restore, refresh, and expiry behavior

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable