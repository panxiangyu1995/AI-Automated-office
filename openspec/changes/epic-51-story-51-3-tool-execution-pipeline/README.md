# epic-51-story-51-3-tool-execution-pipeline

## Story
- Epic: Epic 51
- Story: Story 51.3
- Task: Task 113
- Title: Real tool execution pipeline
- Phase: Phase 1 - Execution Spine
- Priority: critical

## Goal
Connect the existing tool models to a real backend execution pipeline, including core tool registration, permission checks, confirmation flow, and result normalization.

## Requirements Mapping
- FR: FR420, FR421, FR422, FR423, FR424
- NFR: NFR1, NFR16, NFR20
- ARCH: ADR-010, ADR-018, ADR-045
- UX: UX-01, UX-04

## Dependencies
- Story 51.1
- Story 45.1
- Story 45.2
- Story 45.3
- Story 45.4
- Story 46.1
- Story 46.2
- Story 46.3

## Planned Steps
1. Implement backend ToolExecutionPipeline
2. Bind tool descriptors to real executors
3. Register core tools and remove placeholder behavior
4. Integrate permission checks, sensitive action detection, and confirmation flow
5. Normalize tool results and errors into one runtime contract