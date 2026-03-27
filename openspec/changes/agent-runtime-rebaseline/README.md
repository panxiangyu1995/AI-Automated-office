# Agent Runtime Rebaseline

## Summary
This change is the planning entry point for the rebuilt common Agent roadmap.
It treats archived Story 43.1 through Story 49.4 as reusable foundations and redirects new work toward the missing backend execution spine.

## Active Scope
- Rebuild sequencing around the real Rust Agent runtime
- Align task.json with the real source of truth
- Keep business pilots, skill expansion, and advanced Sub-Agent work off the critical path until the main Agent loop is stable

## Story Map
- Task 111: Story 51.1 - Rust agent core and orchestrator
- Task 112: Story 51.2 - Runtime event streaming bridge
- Task 113: Story 51.3 - Real tool execution pipeline
- Task 114: Story 51.4 - Chat host integration and E2E baseline
- Task 115: Story 53.1 - Prompt builder and provider request path
- Task 116: Story 53.2 - Context compression and session summary persistence
- Task 117: Story 53.4 - Knowledge retrieval integration
- Task 118: Story 55.2 - Retry, replan, and checkpoint recovery
- Task 119: Story 55.1 - Trace, audit, and failure persistence
- Task 120: Story 55.3 - Runtime metrics and debug telemetry
- Task 121: Story 55.4 - Backend-enforced security and confirmation
- Task 122: Story 53.3 - Controlled correction-rule baseline
- Task 123: Story 52.1 - Sub-Agent routing baseline
- Task 124: Story 52.2 - Sub-Agent execution context and isolation
- Task 125: Story 52.3 - Sub-Agent nested call control
- Task 126: Story 52.4 - Sub-Agent result return and merge
- Task 127: Story 52.5 - Sub-Agent monitoring and diagnostics

## Phase Order
- Phase 1 - Execution Spine: Task 111, Task 112, Task 113, Task 114
- Phase 2 - Context, Memory, Prompt: Task 115, Task 116, Task 117
- Phase 3 - Reliability and Governance: Task 118, Task 119, Task 120, Task 121
- Phase 4 - Advanced Common Agent: Task 122, Task 123, Task 124, Task 125, Task 126, Task 127