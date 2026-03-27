# Proposal: Trace, audit, and failure persistence

## Change Type
- refactor

## Background
Turn trace, tool audit, and failure recording into real backend persistence and query capabilities.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Design trace, tool audit, and execution record storage
- Write trace and audit events from orchestrator and tool pipeline
- Expose query commands by session, trace, tool, and task
- Connect debug panels to real data sources
- Ensure audit coverage for tool calls, confirmations, failures, and results

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
- Story 51.3
- Story 48.1
- Story 48.2
- Story 48.3