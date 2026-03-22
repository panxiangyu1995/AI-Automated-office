# Design: Runtime Metrics and Debug View

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Collect runtime success and latency metrics
- Track retry and confirmation counts
- Expose a minimal debug inspection view
- Support filtering by trace or session id

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage