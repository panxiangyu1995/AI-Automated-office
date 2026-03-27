# epic-53-story-53-1-prompt-builder

## Story
- Epic: Epic 53
- Story: Story 53.1
- Task: Task 115
- Title: Prompt builder and provider request path
- Phase: Phase 2 - Context, Memory, Prompt
- Priority: critical

## Goal
Create the real prompt assembly and provider request path for the common Agent runtime.

## Requirements Mapping
- FR: FR440, FR441, FR442
- NFR: NFR1, NFR16
- ARCH: ADR-038, ADR-039, ADR-043
- UX: UX-01

## Dependencies
- Story 51.1

## Planned Steps
1. Define provider traits and request-response contracts
2. Implement PromptBuilder with system prompt, runtime context, and tool visibility
3. Support provider selection, timeout, retry, and error mapping
4. Connect PromptBuilder to AgentOrchestrator
5. Persist model outputs through the runtime pipeline