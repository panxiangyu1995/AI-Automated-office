# Design: Rust agent core and orchestrator

## Architecture Alignment
- Phase: Phase 1 - Execution Spine
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/sessionLifecycle.ts
- src/features/session/runtime/runtimeStateMachine.ts
- src/features/session/planner/structuredPlanner.ts
- src/features/session/executor/stepExecutor.ts

### Backend
- src-tauri/src/lib.rs
- src-tauri/src/commands/mod.rs

### Current Note
Frontend runtime shells exist, but src-tauri/src/agent does not exist yet.

## Technical Design
- Create src-tauri/src/agent and module exports
- Define AgentOrchestrator, provider trait, and runtime session service
- Register agent commands in lib.rs invoke_handler
- Define request and response contracts for frontend runtime integration
- Ensure the main execution loop is interruptible, traceable, and persistable

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable