# Design: Prompt builder and provider request path

## Architecture Alignment
- Phase: Phase 2 - Context, Memory, Prompt
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/userContext.ts
- src/features/session/runtime/pageContext.ts

### Backend
- src-tauri/src/http/commands.rs

### Current Note
There is no Agent-specific provider layer yet.

## Technical Design
- Define provider traits and request-response contracts
- Implement PromptBuilder with system prompt, runtime context, and tool visibility
- Support provider selection, timeout, retry, and error mapping
- Connect PromptBuilder to AgentOrchestrator
- Persist model outputs through the runtime pipeline

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable