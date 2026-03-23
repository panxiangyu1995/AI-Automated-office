# Design: Module Capability Status

## Architecture Alignment
- Preserve tool governance chain: descriptor -> validation -> permission -> execution -> audit
- Keep command/event contracts deterministic across runtime and UI
- Ensure no bypass of confirmation and blacklist policies for sensitive actions

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/features/agent/types/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/tools/*`
- `src-tauri/src/agent/session/*`
- `src-tauri/src/agent/audit/*`
- `src-tauri/src/utils/logger.rs`
- `src/features/agent/components/ToolCallDisplay.tsx`

## Implementation Plan
### Tool Registry and Invocation Pipeline
- Define or extend tool metadata and invocation schema
- Validate input/output and normalize error envelopes
### UI and Session Integration
- Render tool lifecycle states and drill-down details in conversation flow
- Keep status transitions synchronized with runtime events
### Policy and Safety
- Add permission precheck, sensitive-operation detection, and confirmation flow
- Enforce blacklist and downgrade/retry policies with explicit user-visible outcomes

## Interface Contracts
- Tool descriptor contract: name, capability, auth scope, risk level
- Invocation event contract: correlationId, phase, payload summary, outcome
- Audit contract: who/when/what/result/error persisted for every execution

## Failure Handling
- Distinguish validation errors, permission denials, runtime failures, and timeout failures
- Provide bounded retries and deterministic terminal failure state
- Preserve investigation details for history and observability panels

## Test Strategy
- Unit: registry validation, permission checks, retry policy handlers
- Integration: UI-to-runtime invocation and event sync
- Security: blocked and sensitive actions require enforced policy paths
