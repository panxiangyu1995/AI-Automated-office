# Design: Real tool execution pipeline

## Architecture Alignment
- Phase: Phase 1 - Execution Spine
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/tools/toolRegistry.ts
- src/features/session/tools/toolExecutor.ts
- src/features/session/tools/toolPermissionPrecheck.ts
- src/features/session/tools/sensitiveActionDetection.ts
- src/features/session/tools/toolResultNormalization.ts

### Backend
- src-tauri/src/http/commands.rs

### Current Note
registerCoreTools is still a placeholder and there is no backend ToolExecutionPipeline.

## Technical Design
- Implement backend ToolExecutionPipeline
- Bind tool descriptors to real executors
- Register core tools and remove placeholder behavior
- Integrate permission checks, sensitive action detection, and confirmation flow
- Normalize tool results and errors into one runtime contract

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable