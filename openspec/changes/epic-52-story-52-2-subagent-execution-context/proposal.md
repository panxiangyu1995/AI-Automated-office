# Proposal: Sub-Agent execution context and isolation

## Change Type
- new

## Background
Create isolated execution context, memory scope, tool filtering, and permission inheritance or shrinkage for Sub-Agent calls.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Create SubAgentExecutionContext and tool filtering
- Project main Agent context into isolated Sub-Agent context
- Ensure permissions can only inherit or shrink
- Link Sub-Agent calls back to the main trace
- Provide the shared context model needed by later Sub-Agent tasks

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 52.1
- Story 21.18
- Story 21.19