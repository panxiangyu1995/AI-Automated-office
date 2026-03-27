# Design: Sub-Agent execution context and isolation

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
There is no real backend implementation for Sub-Agent execution context yet.

## Technical Design
- Create SubAgentExecutionContext and tool filtering
- Project main Agent context into isolated Sub-Agent context
- Ensure permissions can only inherit or shrink
- Link Sub-Agent calls back to the main trace
- Provide the shared context model needed by later Sub-Agent tasks

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable