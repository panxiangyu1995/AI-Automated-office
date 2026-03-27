# Proposal: Context compression and session summary persistence

## Change Type
- refactor

## Background
Turn the existing summary and compression model into real backend persistence and runtime token budget control.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Create summary refresh triggers and persistence structures
- Generate reusable session summaries and key facts from real history
- Implement token budget and compression policy
- Feed compressed context back into PromptBuilder
- Add restore, refresh, and expiry behavior

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 53.1
- Story 47.3