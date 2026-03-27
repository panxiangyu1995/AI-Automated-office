# Design: Sub-Agent nested call control

## Architecture Alignment
- Phase: Phase 4 - Advanced Common Agent
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- None

### Backend
- None

### Current Note
This is an advanced capability and must follow a verified single-layer Sub-Agent path.

## Technical Design
- Track nested depth and enforce limits
- Add loop detection and call budgets
- Propagate timeout and failure correctly
- Link nested calls to trace, audit, and failure records
- Verify no unbounded recursion or privilege escalation

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable