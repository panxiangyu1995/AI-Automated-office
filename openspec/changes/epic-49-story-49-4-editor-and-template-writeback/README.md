# epic-49-story-49-4-editor-and-template-writeback

## Story
- **Epic:** Epic 49
- **Story:** Story 49.4
- **Title:** Editor and Template Writeback

## Goal
Write Agent output into editor and template hosts through controlled contracts.

## Requirements Mapping
- **FR:** FR-P2-028
- **NFR:** NFR1, NFR8, NFR16
- **ARCH:** ADR-035, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 39.1
- Story 40.5
- Story 45.4

## Planned Steps
1. Define editor writeback contract
2. Support template content updates through host APIs
3. Preserve dirty state and version boundaries
4. Record writeback decisions for audit and rollback