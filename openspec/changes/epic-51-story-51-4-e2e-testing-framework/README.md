# epic-51-story-51-4-e2e-testing-framework

## Story
- Epic: Epic 51
- Story: Story 51.4
- Task: Task 114
- Title: Chat host integration and E2E baseline
- Phase: Phase 1 - Execution Spine
- Priority: high

## Goal
Remove the simulated chat response path and connect the chat panel, staged review, and writeback flow to the real runtime, then add the minimum end-to-end harness.

## Requirements Mapping
- FR: FR400, FR410, FR411
- NFR: NFR1, NFR22
- ARCH: ADR-001, ADR-037
- UX: UX-01, UX-04, UX-05

## Dependencies
- Story 51.1
- Story 51.2
- Story 51.3
- Story 43.4
- Story 49.1
- Story 49.2
- Story 49.3
- Story 49.4

## Planned Steps
1. Remove the default simulateResponse path
2. Connect MessageInput, MessageList, and StagedReviewPanel to the real runtime
3. Close the loop from user input to tool call to staged writeback to apply
4. Add a mock provider and a minimum tool set for runtime tests
5. Add end-to-end coverage for the main Agent loop