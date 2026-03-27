# Proposal: Sub-Agent routing baseline

## Change Type
- refactor

## Background
Only after the main Agent loop is stable, add routing for delegated Sub-Agent calls based on keywords, intent, and scenario matching.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Create routing service for keyword, intent, and scenario matching
- Base delegation decisions on real runtime context
- Write routing outcomes into the main trace
- Prepare standardized input for Sub-Agent execution context
- Verify routing cannot bypass an incomplete main Agent path

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
- Story 55.1
- Story 21.16
- Story 21.17