# Proposal: Sub-Agent result return and merge

## Change Type
- new

## Background
Return Sub-Agent summaries, failures, and outputs back into the main Agent session in a reviewable and traceable form.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Normalize Sub-Agent result and summary payloads
- Merge results and failures back into the main Agent context
- Allow main Agent replanning or review handoff based on returned results
- Preserve context boundaries during result merge
- Add visible debug and review data for parent-child Agent interaction

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 52.2
- Story 52.3