# Proposal: Real tool execution pipeline

## Change Type
- refactor

## Background
Connect the existing tool models to a real backend execution pipeline, including core tool registration, permission checks, confirmation flow, and result normalization.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Implement backend ToolExecutionPipeline
- Bind tool descriptors to real executors
- Register core tools and remove placeholder behavior
- Integrate permission checks, sensitive action detection, and confirmation flow
- Normalize tool results and errors into one runtime contract

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
- Story 45.1
- Story 45.2
- Story 45.3
- Story 45.4
- Story 46.1
- Story 46.2
- Story 46.3