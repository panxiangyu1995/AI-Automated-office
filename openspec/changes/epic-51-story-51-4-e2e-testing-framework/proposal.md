# Proposal: Chat host integration and E2E baseline

## Change Type
- refactor

## Background
Remove the simulated chat response path and connect the chat panel, staged review, and writeback flow to the real runtime, then add the minimum end-to-end harness.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Remove the default simulateResponse path
- Connect MessageInput, MessageList, and StagedReviewPanel to the real runtime
- Close the loop from user input to tool call to staged writeback to apply
- Add a mock provider and a minimum tool set for runtime tests
- Add end-to-end coverage for the main Agent loop

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 51.1
- Story 51.2
- Story 51.3
- Story 43.4
- Story 49.1
- Story 49.2
- Story 49.3
- Story 49.4