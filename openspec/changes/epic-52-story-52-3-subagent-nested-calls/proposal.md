# Proposal: Sub-Agent nested call control

## Change Type
- new

## Background
Add nested call depth limits, loop detection, budgets, and timeout control to prevent recursive multi-agent failure modes.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Track nested depth and enforce limits
- Add loop detection and call budgets
- Propagate timeout and failure correctly
- Link nested calls to trace, audit, and failure records
- Verify no unbounded recursion or privilege escalation

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