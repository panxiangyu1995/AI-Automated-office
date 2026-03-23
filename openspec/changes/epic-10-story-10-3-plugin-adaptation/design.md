# Design: Plugin Adaptation

## Architecture Alignment
- Keep knowledge/resource ingestion behind controlled pipeline (validate -> transform -> index/register -> expose)
- Enforce tenant isolation and permission checks for read/write/execute operations
- Keep runtime execution decoupled from marketplace/resource metadata storage

## Affected Modules
- `src/features/agent/components/*`
- `src/features/settings/components/*`
- `src/lib/api.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/storage/sqlite.rs`
- `src-tauri/src/auth/permission.rs`
- `src-tauri/src/plugins/*`
- `src-tauri/src/agent/tools/registry.rs`
- `src-tauri/src/agent/skill/*`
- `src/features/plugin/*`

## Implementation Plan
### Ingestion and Registration
- Validate source metadata, schema, and security policy before accepting payload
- Persist normalized records and attach version + provenance metadata
### Retrieval/Discovery and Runtime Binding
- Build indexed retrieval or discovery endpoints with scope filtering
- Bind runtime access through policy-checked adapters and explicit capability declarations
### Governance and Operations
- Add quality/security scoring and approval workflow for risky items
- Emit detailed audit events for create/update/import/execute lifecycle

## Interface Contracts
- Ingestion contract: source info + payload hash + policy verdict + normalized metadata
- Retrieval contract: query + scope filters + ranking hints + evidence bundle
- Execution contract: resource id + execution context + policy decision + outcome trace

## Failure Handling
- Reject invalid or untrusted resources with explicit diagnostics
- Fall back to safe baseline when retrieval or import pipeline fails
- Keep partial failures isolated and reversible through versioned state

## Test Strategy
- Unit: validation, ranking, policy checks, parser behavior
- Integration: end-to-end ingest/discover/execute with audit verification
- Security: import hardening, approval enforcement, and isolation boundaries
