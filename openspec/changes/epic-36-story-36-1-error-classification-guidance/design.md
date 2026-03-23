# Design: Error Classification Guidance

## Architecture Alignment
- Keep reliability controls in runtime governance layer, not ad-hoc business handlers
- Standardize telemetry: event logs, metrics, traces, and user-facing status
- Couple failover/recovery actions with explicit policy, approval, and audit hooks

## Affected Modules
- `src/features/agent/components/*`
- `src/features/settings/components/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/runtime/*`
- `src-tauri/src/agent/session/*`
- `src-tauri/src/utils/logger.rs`
- `src-tauri/src/agent/audit/*`
- `src-tauri/src/storage/sqlite.rs`
- `src-tauri/src/agent/error/*`
- `src-tauri/src/agent/llm/*`
- `src-tauri/src/agent/recovery/*`

## Implementation Plan
### Detection and Signal Aggregation
- Aggregate health/error/runtime signals into normalized status models
- Define thresholds, cooldown, and quorum rules for auto-actions
### Control Actions and Recovery
- Execute bounded retries, downgrade, isolation, failover, or session repair based on policy
- Keep action outcomes idempotent and reversible where required
### Observability and User Feedback
- Expose diagnostics, incidents, and recovery actions in product-facing views
- Persist immutable traces for postmortem and compliance checks

## Interface Contracts
- Health contract: source, signal class, severity, confidence, timestamp
- Action contract: trigger, policy verdict, execution plan, terminal state
- Trace contract: correlation id linking heartbeat/scheduler/runtime/tool events

## Failure Handling
- On uncertain diagnosis, choose safe-degrade rather than destructive auto-repair
- On repeated failures, enforce circuit-breaker and escalation path
- Keep recovery actions visible and cancellable where policy allows

## Test Strategy
- Unit: error taxonomy, policy evaluator, retry/backoff/circuit-breaker logic
- Integration: signal-to-action pipeline and trace consistency
- Resilience: chaos-style fault injection for connector/plugin/provider/session failures
