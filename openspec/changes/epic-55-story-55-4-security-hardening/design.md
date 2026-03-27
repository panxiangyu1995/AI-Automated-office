# Design: Backend-enforced security and confirmation

## Architecture Alignment
- Phase: Phase 3 - Reliability and Governance
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/tools/sensitiveActionDetection.ts
- src/features/session/confirmation/confirmationFlow.ts
- src/features/session/runtime/fieldActionAuthorization.ts

### Backend
- None

### Current Note
Security and confirmation are still largely frontend-side decisions today.

## Technical Design
- Move sensitive input and dangerous action checks into backend guards
- Implement backend confirmation, rejection, and permission-denied flows
- Add allow and block policy for system, path, and network tools
- Add second-pass validation for risky writeback and outbound requests
- Write security events into audit records

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable