# epic-52-story-52-1-subagent-routing-engine

## Story
- Epic: Epic 52
- Story: Story 52.1
- Task: Task 123
- Title: Sub-Agent routing baseline
- Phase: Phase 4 - Advanced Common Agent
- Priority: medium

## Goal
Only after the main Agent loop is stable, add routing for delegated Sub-Agent calls based on keywords, intent, and scenario matching.

## Requirements Mapping
- FR: FR930, FR931, FR932
- NFR: NFR1, NFR16
- ARCH: ADR-013, ADR-037
- UX: UX-01

## Dependencies
- Story 51.1
- Story 51.2
- Story 51.3
- Story 51.4
- Story 55.1
- Story 21.16
- Story 21.17

## Planned Steps
1. Create routing service for keyword, intent, and scenario matching
2. Base delegation decisions on real runtime context
3. Write routing outcomes into the main trace
4. Prepare standardized input for Sub-Agent execution context
5. Verify routing cannot bypass an incomplete main Agent path