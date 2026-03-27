# Design: Sub-Agent routing baseline

## Architecture Alignment
- Phase: Phase 4 - Advanced Common Agent
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/settings/components/SubAgentRouting.tsx

### Backend
- None

### Current Note
The UI exists before the runtime capability and must remain a deferred path.

## Technical Design
- Create routing service for keyword, intent, and scenario matching
- Base delegation decisions on real runtime context
- Write routing outcomes into the main trace
- Prepare standardized input for Sub-Agent execution context
- Verify routing cannot bypass an incomplete main Agent path

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable