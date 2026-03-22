# epic-44-story-44-1-agent-runtime-state-machine

## Story
- **Epic:** Epic 44
- **Story:** Story 44.1
- **Title:** Agent Runtime State Machine

## Goal
Implement the common runtime state machine for planning, running, confirmation, completion, and failure.

## Requirements Mapping
- **FR:** FR-P2-005
- **NFR:** NFR1, NFR16
- **ARCH:** ADR-001, ADR-037
- **UX:** UX-01, UX-02

## Dependencies
- Story 43.1
- Story 43.2

## Planned Steps
1. Define runtime state model
2. Enforce valid state transitions
3. Expose state changes to session events
4. Persist step and task status consistently