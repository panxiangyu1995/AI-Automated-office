# epic-43-story-43-2-message-and-part-model

## Story
- **Epic:** Epic 43
- **Story:** Story 43.2
- **Title:** Message and Part Model

## Goal
Implement the message and part model for structured Agent conversation records.

## Requirements Mapping
- **FR:** FR-P2-002
- **NFR:** NFR1, NFR16
- **ARCH:** ADR-001, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 43.1

## Planned Steps
1. Define message and part schemas
2. Support text, reasoning, tool_call, tool_result, confirmation, error, and ui_patch parts
3. Persist ordered parts per message
4. Expose serialization contract for frontend streaming