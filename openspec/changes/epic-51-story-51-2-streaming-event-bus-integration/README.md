# epic-51-story-51-2-streaming-event-bus-integration

## Story
- Epic: Epic 51
- Story: Story 51.2
- Task: Task 112
- Title: Runtime event streaming bridge
- Phase: Phase 1 - Execution Spine
- Priority: high

## Goal
Upgrade the frontend event model into a real frontend-backend runtime event bridge for progress, tool, error, and completion events.

## Requirements Mapping
- FR: FR405, FR406, FR407
- NFR: NFR3, NFR16
- ARCH: ADR-001, ADR-037
- UX: UX-01, UX-04, UX-05

## Dependencies
- Story 51.1
- Story 43.3

## Planned Steps
1. Define runtime event protocol and event type mapping
2. Implement backend to frontend event bridge
3. Connect StreamingHostContext to the real event source
4. Handle ordering, reconnect, replay, and interruption consistency
5. Verify chat and debug panels consume real runtime events