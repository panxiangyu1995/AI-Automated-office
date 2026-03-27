# Proposal: Runtime event streaming bridge

## Change Type
- refactor

## Background
Upgrade the frontend event model into a real frontend-backend runtime event bridge for progress, tool, error, and completion events.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Define runtime event protocol and event type mapping
- Implement backend to frontend event bridge
- Connect StreamingHostContext to the real event source
- Handle ordering, reconnect, replay, and interruption consistency
- Verify chat and debug panels consume real runtime events

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
- Story 43.3