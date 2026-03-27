# Design: Runtime metrics and debug telemetry

## Architecture Alignment
- Phase: Phase 3 - Reliability and Governance
- Backend Required: Yes
- Rebaseline Source: openspec/changes/agent-runtime-rebaseline

## Existing Code
### Frontend
- src/features/session/runtime/runtimeMetrics.ts
- src/features/agent/components/LogMetricsCenter.tsx
- src/features/agent/components/TaskTraceAnalysis.tsx

### Backend
- src-tauri/src/utils/logger.rs

### Current Note
Current observability panels still contain mock data.

## Technical Design
- Define runtime metric collection points
- Persist telemetry and expose aggregate queries
- Connect metrics panels to real data
- Support session and tenant level statistics
- Emit structured diagnostics for troubleshooting

## Test Focus
- Contract compatibility with the runtime spine
- Failure, retry, and recovery behavior where applicable
- Permission, audit, and confirmation coverage where applicable