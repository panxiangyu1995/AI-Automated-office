# Design: Controlled correction-rule baseline

## Architecture Alignment
- Phase: Phase 4 - Advanced Common Agent
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/components/CorrectionRuleLearning.tsx

### Backend
- None

### Current Note
Correction support exists mostly as UI and model scaffolding.

## Technical Design
- Add correction rule read and match capability
- Inject rule suggestions into planner and runtime without auto-mutation
- Link rule hits to failure and audit records
- Output reviewable improvement suggestions
- Verify human review remains required for governance changes

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable