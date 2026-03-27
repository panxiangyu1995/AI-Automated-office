# Design: Sub-Agent monitoring and diagnostics

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
Monitoring depends on real Sub-Agent execution and trace links.

## Technical Design
- Add metrics for Sub-Agent latency, failure rate, and token usage
- Connect Sub-Agent monitoring to the shared telemetry and trace stack
- Support inspection by main session, child call, and role template
- Emit diagnostics for multi-agent troubleshooting
- Verify monitoring does not create new permission leaks

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable