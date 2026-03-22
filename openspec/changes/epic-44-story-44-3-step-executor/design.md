# Design: Step Executor

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Map plan steps to runtime actions
- Invoke tool runtime through executor contracts
- Handle synchronous and streaming step results
- Update state and message parts after each step

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage