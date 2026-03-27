# epic-51-story-51-1-agent-orchestrator-core

## Story
- Epic: Epic 51
- Story: Story 51.1
- Task: Task 111
- Title: Rust agent core and orchestrator
- Phase: Phase 1 - Execution Spine
- Priority: critical

## Goal
Create src-tauri/src/agent and land the real backend orchestrator, provider trait, runtime session service, and Tauri command entry points.

## Requirements Mapping
- FR: FR400, FR401, FR402, FR403, FR404
- NFR: NFR1, NFR16, NFR17
- ARCH: ADR-001, ADR-037, ADR-043
- UX: UX-01, UX-04

## Dependencies
- Story 43.1
- Story 43.2
- Story 44.1
- Story 44.2
- Story 44.3

## Planned Steps
1. Create src-tauri/src/agent and module exports
2. Define AgentOrchestrator, provider trait, and runtime session service
3. Register agent commands in lib.rs invoke_handler
4. Define request and response contracts for frontend runtime integration
5. Ensure the main execution loop is interruptible, traceable, and persistable