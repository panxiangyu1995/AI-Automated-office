# epic-46-story-46-1-tool-permission-precheck

## Story
- **Epic:** Epic 46
- **Story:** Story 46.1
- **Title:** Tool Permission Precheck

## Goal
Check permissions before any runtime tool call is executed.

## Requirements Mapping
- **FR:** FR-P2-013
- **NFR:** NFR1, NFR8, NFR16
- **ARCH:** ADR-002, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 45.1
- Story 45.2
- Story 2.7

## Planned Steps
1. Resolve required permissions from tool descriptors
2. Check user, department, and tenant permissions before execution
3. Block unauthorized tool calls before runtime execution
4. Publish permission decisions into the runtime stream