# epic-48-story-48-3-failure-and-result-recording

## Story
- **Epic:** Epic 48
- **Story:** Story 48.3
- **Title:** Failure and Result Recording

## Goal
Persist runtime results and failure causes for task-level analysis.

## Requirements Mapping
- **FR:** FR-P2-023
- **NFR:** NFR1, NFR16
- **ARCH:** ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 44.4
- Story 48.1

## Planned Steps
1. Record final result summary for each task
2. Persist failure reasons and impacted step ids
3. Store retry and replan outcomes
4. Expose records for recovery and analysis flows