# epic-53-story-53-2-context-compression

## Story
- Epic: Epic 53
- Story: Story 53.2
- Task: Task 116
- Title: Context compression and session summary persistence
- Phase: Phase 2 - Context, Memory, Prompt
- Priority: high

## Goal
Turn the existing summary and compression model into real backend persistence and runtime token budget control.

## Requirements Mapping
- FR: FR443, FR444, FR445
- NFR: NFR1, NFR16
- ARCH: ADR-038, ADR-043
- UX: UX-01

## Dependencies
- Story 53.1
- Story 47.3

## Planned Steps
1. Create summary refresh triggers and persistence structures
2. Generate reusable session summaries and key facts from real history
3. Implement token budget and compression policy
4. Feed compressed context back into PromptBuilder
5. Add restore, refresh, and expiry behavior