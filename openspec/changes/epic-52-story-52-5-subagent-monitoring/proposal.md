# Proposal: Sub-Agent monitoring and diagnostics

## Change Type
- refactor

## Background
After real Sub-Agent execution exists, add monitoring, linked traces, metrics, and diagnostics for multi-agent execution.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Add metrics for Sub-Agent latency, failure rate, and token usage
- Connect Sub-Agent monitoring to the shared telemetry and trace stack
- Support inspection by main session, child call, and role template
- Emit diagnostics for multi-agent troubleshooting
- Verify monitoring does not create new permission leaks

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 52.4
- Story 55.3
- Story 21.23