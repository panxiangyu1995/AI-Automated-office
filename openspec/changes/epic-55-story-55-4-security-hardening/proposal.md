# Proposal: Backend-enforced security and confirmation

## Change Type
- refactor

## Background
Move sensitive action detection, input validation, field permissions, and confirmation flow into backend-enforced runtime guards.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Move sensitive input and dangerous action checks into backend guards
- Implement backend confirmation, rejection, and permission-denied flows
- Add allow and block policy for system, path, and network tools
- Add second-pass validation for risky writeback and outbound requests
- Write security events into audit records

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 51.3
- Story 55.1
- Story 46.1
- Story 46.2
- Story 46.3
- Story 46.4