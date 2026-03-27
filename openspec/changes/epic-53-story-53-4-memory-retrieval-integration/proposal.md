# Proposal: Knowledge retrieval integration

## Change Type
- refactor

## Background
Replace the mock retrieval path with real backend retrieval over storage, vector, and scoped knowledge sources.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Create backend retrieval service
- Replace mockRetrieve with real async retrieval
- Enforce scope filters for tenant, department, and session
- Inject retrieval results into planner, runtime, and tool context
- Add caching, timeout, and degradation behavior

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
- Story 47.4