# Design: Streaming Output and Status Sync

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Emit ordered runtime events during execution
- Sync message parts to frontend consumers
- Keep final state aligned with streamed events
- Handle reconnect and replay for active sessions

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage