# Proposal: Controlled correction-rule baseline

## Change Type
- refactor

## Background
Add correction-rule read, match, and suggestion output after the main Agent loop is stable, without allowing automatic config mutation.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Add correction rule read and match capability
- Inject rule suggestions into planner and runtime without auto-mutation
- Link rule hits to failure and audit records
- Output reviewable improvement suggestions
- Verify human review remains required for governance changes

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
- Story 55.1
- Story 55.2
- Story 55.4