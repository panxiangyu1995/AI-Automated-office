# Design: Sub-Agent result return and merge

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
Result return belongs after isolation and nested-call control.

## Technical Design
- Normalize Sub-Agent result and summary payloads
- Merge results and failures back into the main Agent context
- Allow main Agent replanning or review handoff based on returned results
- Preserve context boundaries during result merge
- Add visible debug and review data for parent-child Agent interaction

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable