# Design: Task Notifications

## Architecture Alignment
- Keep connector and messaging capabilities as governed runtime adapters
- Enforce permission-first checks before any cross-user/agent communication or external connector call
- Maintain traceable event chain across UI, runtime, routing, and audit layers

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/features/auth/components/*`
- `src/stores/appStore.ts`
- `src/lib/api.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/auth/permission.rs`
- `src-tauri/src/storage/sqlite.rs`
- `src/features/message/*`
- `src/features/agent/components/ChatPanel.tsx`
- `src-tauri/src/agent/messaging/*`
- `src-tauri/src/agent/audit/*`
- `src-tauri/src/agent/messaging/router.rs`
- `src-tauri/src/utils/logger.rs`

## Implementation Plan
### Connection and Routing Control
- Define connector/channel metadata, auth mode, routing policy, and health status model
- Route messages/actions through validated policies and recipient scope checks
### Runtime Execution and Feedback
- Emit deterministic lifecycle events: pending/running/success/failure/retry/downgrade
- Keep delivery/read/ack and retry metadata consistent with runtime state
### Governance and Audit
- Require policy checks for high-risk communication and cross-agent operations
- Persist auditable traces for sender, receiver, payload class, decision, and outcome

## Interface Contracts
- Connector contract: endpoint/auth/policy/health + retry profile
- Messaging contract: sender/recipient/thread/payload/permission verdict
- Audit contract: routing decision, execution status, and failure diagnostics

## Failure Handling
- On connector failure, trigger bounded retry then downgrade fallback
- On invalid routing or permission denial, block operation with explicit reason
- Preserve delivery consistency and avoid duplicate side effects under retries

## Test Strategy
- Unit: routing rules, permission checks, retry/downgrade handlers
- Integration: end-to-end connector/message flows with event consistency
- Security: isolation checks for tenant/user/agent communication boundaries
