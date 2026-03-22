# Design: Tool Executor and Validation

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Validate tool input against descriptor schema
- Inject runtime context before execution
- Normalize execution errors into runtime results
- Track tool call lifecycle in the session stream

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage