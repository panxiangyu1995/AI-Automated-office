# Proposal: Retry, replan, and checkpoint recovery

## Change Type
- refactor

## Background
Connect replan strategy, checkpoint management, and failure recovery to real backend execution records and restore flows.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Connect retry and replan decisions to real execution outcomes
- Implement checkpoint save, activate, rollback, and restore
- Trigger recovery from tool failure, timeout, and interruption
- Feed recovery state back to chat and debug views
- Verify interruption, retry, rollback, and restore end to end

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 51.1
- Story 51.2
- Story 51.3
- Story 51.4
- Story 43.4
- Story 44.4
- Story 48.3