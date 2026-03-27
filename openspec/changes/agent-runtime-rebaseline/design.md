# Design: Agent runtime rebaseline

## Architecture Alignment
- Presentation: keep the current React runtime shells and UI surfaces
- Runtime: add the missing Rust Agent core and Tauri command bridge
- Governance: move audit, recovery, confirmation, and security decisions into backend-enforced paths

## Design Principles
- Rebaseline does not mean rebuild; reuse archived Story 43.1 through Story 49.4 foundations
- The backend execution spine comes before advanced Agent features
- Frontend models remain useful, but real execution, persistence, and permission enforcement must move to backend services
- Sub-Agent work stays behind the main Agent runtime until the single-agent loop is stable end to end

## Phase Design
- Phase 1 - Execution Spine: Task 111, Task 112, Task 113, Task 114
- Phase 2 - Context, Memory, Prompt: Task 115, Task 116, Task 117
- Phase 3 - Reliability and Governance: Task 118, Task 119, Task 120, Task 121
- Phase 4 - Advanced Common Agent: Task 122, Task 123, Task 124, Task 125, Task 126, Task 127

## Outputs
- Valid task.json aligned with this change
- One planning document for the runtime rebaseline
- Story-level OpenSpec changes rewritten to match the new execution order