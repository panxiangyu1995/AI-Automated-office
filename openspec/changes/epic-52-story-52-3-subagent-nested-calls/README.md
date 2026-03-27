# epic-52-story-52-3-subagent-nested-calls

## Story
- Epic: Epic 52
- Story: Story 52.3
- Task: Task 125
- Title: Sub-Agent nested call control
- Phase: Phase 4 - Advanced Common Agent
- Priority: medium

## Goal
Add nested call depth limits, loop detection, budgets, and timeout control to prevent recursive multi-agent failure modes.

## Requirements Mapping
- FR: FR935, FR937, FR938
- NFR: NFR1, NFR16
- ARCH: ADR-013
- UX: UX-01, UX-04

## Dependencies
- Story 52.2

## Planned Steps
1. Track nested depth and enforce limits
2. Add loop detection and call budgets
3. Propagate timeout and failure correctly
4. Link nested calls to trace, audit, and failure records
5. Verify no unbounded recursion or privilege escalation