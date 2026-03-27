# Proposal: Rust agent core and orchestrator

## Change Type
- refactor

## Background
Create src-tauri/src/agent and land the real backend orchestrator, provider trait, runtime session service, and Tauri command entry points.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Create src-tauri/src/agent and module exports
- Define AgentOrchestrator, provider trait, and runtime session service
- Register agent commands in lib.rs invoke_handler
- Define request and response contracts for frontend runtime integration
- Ensure the main execution loop is interruptible, traceable, and persistable

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 43.1
- Story 43.2
- Story 44.1
- Story 44.2
- Story 44.3