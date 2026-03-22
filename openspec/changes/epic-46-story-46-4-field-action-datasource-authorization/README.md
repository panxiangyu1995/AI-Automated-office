# epic-46-story-46-4-field-action-datasource-authorization

## Story
- **Epic:** Epic 46
- **Story:** Story 46.4
- **Title:** Field Action and Datasource Authorization

## Goal
Extend authorization checks to fields, actions, and data sources used by runtime results.

## Requirements Mapping
- **FR:** FR-P2-016
- **NFR:** NFR1, NFR8, NFR16
- **ARCH:** ADR-002, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 46.1
- Story 47.2
- Story 49.1

## Planned Steps
1. Map field-level access into runtime decisions
2. Check action-level authorization before writeback or execution
3. Restrict unauthorized data source resolution
4. Expose authorization outcomes to audit logs