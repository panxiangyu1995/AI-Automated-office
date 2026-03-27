# Design: Knowledge retrieval integration

## Architecture Alignment
- Phase: Phase 2 - Context, Memory, Prompt
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/knowledgeRetrieval.ts

### Backend
- src-tauri/src/vector/mod.rs
- src-tauri/src/vector/store.rs
- src-tauri/src/storage/memory_store.rs

### Current Note
knowledgeRetrieval.ts still exposes mockRetrieve.

## Technical Design
- Create backend retrieval service
- Replace mockRetrieve with real async retrieval
- Enforce scope filters for tenant, department, and session
- Inject retrieval results into planner, runtime, and tool context
- Add caching, timeout, and degradation behavior

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable