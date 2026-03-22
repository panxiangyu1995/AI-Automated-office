# Design: Knowledge Retrieval Baseline

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define retrieval request contract
- Resolve scoped knowledge sources by tenant and department
- Inject retrieval results into runtime context
- Keep retrieval references available for audit

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage