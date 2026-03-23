# Design: Sales Pilot Integration

## Architecture Alignment
- Validate scenario integration through adapters, not through runtime duplication
- Reuse common agent runtime state machine, policy checks, and observability chain
- Keep scenario-specific context/tools/writeback mapped through configuration boundaries

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/features/plugin/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/runtime/*`
- `src-tauri/src/agent/tools/*`
- `src-tauri/src/agent/writeback/*`
- `src-tauri/src/agent/audit/*`
- `src-tauri/src/auth/permission.rs`

## Implementation Plan
### Scenario Context Binding
- Bind scenario data context and eligible tool set into common runtime session
- Ensure context isolation and permission scope consistency per tenant/user role
### Execute Loop Integration
- Validate read -> generate/analyze -> confirm -> execute flow using shared executor pipeline
- Ensure writeback adapters preserve schema and transaction integrity for scenario targets
### Conformance and Audit
- Add scenario conformance checks to verify no runtime fork introduction
- Persist unified traces for planning, tool execution, confirmation, and writeback outcomes

## Interface Contracts
- Scenario adapter contract: context schema + tool set + writeback target mapping
- Runtime contract: consistent command/event/status semantics across scenarios
- Audit contract: scenario id + decision chain + final writeback/result record

## Failure Handling
- On scenario adapter mismatch, block execution with explicit diagnostics
- On writeback failure, keep state recoverable and prevent partial commit exposure
- On policy denial, retain full trace and suggest remediation path

## Test Strategy
- Unit: adapter mapping and schema validation
- Integration: end-to-end scenario flow on common runtime chain
- Conformance: cross-scenario contract parity and no-fork verification
