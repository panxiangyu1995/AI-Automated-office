# epic-47-story-47-2-page-and-resource-context

## Story
- **Epic:** Epic 47
- **Story:** Story 47.2
- **Title:** Page and Resource Context

## Goal
Inject current page and resource context into the common runtime.

## Requirements Mapping
- **FR:** FR-P2-018
- **NFR:** NFR1, NFR16
- **ARCH:** ADR-035, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 41.4
- Story 47.1

## Planned Steps
1. Define page context contract from host runtime
2. Attach active resource references to runtime context
3. Resolve context per static dynamic and editor modes
4. Expose context safely to planner and tool runtime