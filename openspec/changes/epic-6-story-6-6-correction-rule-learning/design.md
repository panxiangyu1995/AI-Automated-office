# Design: Correction Rule Learning

## Architecture Alignment
- Follow memory layering: session memory -> user preference memory -> enterprise knowledge memory
- Keep tenant and permission isolation mandatory during retrieval and update
- Keep memory operations integrated with runtime summary and context compression chain

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/features/settings/components/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/session/*`
- `src-tauri/src/agent/memory/*`

## Implementation Plan
### Memory Write Path
- Define memory entry schema (source, confidence, scope, ttl, updated_at)
- Add decision rules for when to write, update, merge, or ignore entries
### Memory Retrieval Path
- Retrieve by tenant, user/session scope, recency, and semantic relevance
- Rank and package memory snippets for prompt injection with token budget limits
### Management and Configuration
- Expose memory visibility and controls in UI where required by story
- Add policy controls for retention, update thresholds, and manual correction

## Interface Contracts
- Write contract: entry payload + source metadata + policy decision result
- Query contract: scope filters + ranking hints + max result budget
- Audit contract: who changed what and why, with before/after diffs where relevant

## Failure Handling
- Reject malformed entries and unsupported scopes with explicit errors
- Fallback to safe baseline context when retrieval fails
- Prevent partial writes by using transactional persistence in critical paths

## Test Strategy
- Unit: memory decision rules, ranking, and merge policies
- Integration: runtime-to-memory roundtrip and prompt injection consistency
- Security: tenant isolation, permission checks, and sensitive data redaction
