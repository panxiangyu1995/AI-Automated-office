# Design: Tool Permission Precheck

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Resolve required permissions from tool descriptors
- Check user, department, and tenant permissions before execution
- Block unauthorized tool calls before runtime execution
- Publish permission decisions into the runtime stream

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage