# Design: Mcp Approve Policy

## Architecture Alignment
- Keep config control-plane separated from runtime execution-plane
- Apply settings through validated adapters and explicit reload semantics
- Enforce permission and audit checks for all tenant-affecting configuration changes

## Affected Modules
- `src/features/settings/components/*`
- `src/features/settings/types/*`
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/stores/appStore.ts`
- `src/lib/api.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/llm/*`
- `src-tauri/src/agent/tools/*`
- `src-tauri/src/agent/mcp/*`
- `src-tauri/src/agent/subagent/*`
- `src-tauri/src/storage/sqlite.rs`
- `src-tauri/src/auth/permission.rs`
- `src/features/settings/components/Mcp*`
- `src-tauri/src/agent/mcp/client.rs`

## Implementation Plan
### Configuration Data Model
- Define typed config schemas with defaults, validation rules, and migration strategy
- Persist change history and active version pointers for rollback
### Apply and Runtime Binding
- Apply settings through runtime-safe update points (hot-reload or staged restart)
- Emit apply-status events for UI observability and failure diagnostics
### Governance and Debugging
- Add role-based permission checks and explicit approval points for high-risk config
- Provide preview/debug mode for prompt/rule/sub-agent routes where required

## Interface Contracts
- Config API contract: validate -> persist draft -> apply -> confirm status
- Runtime binding contract: config snapshot id + scope + effective timestamp
- Audit contract: actor, action, before/after diff, apply result

## Failure Handling
- Reject invalid config with field-level diagnostics
- On apply failure, preserve previous effective version and expose rollback action
- Keep partial updates isolated by transactional boundaries

## Test Strategy
- Unit: schema validation, diff generation, rollback logic
- Integration: config apply to runtime behavior consistency
- Security: permission and audit enforcement for admin operations
