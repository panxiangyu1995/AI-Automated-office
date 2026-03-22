# Design: Message and Part Model

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define message and part schemas
- Support text, reasoning, tool_call, tool_result, confirmation, error, and ui_patch parts
- Persist ordered parts per message
- Expose serialization contract for frontend streaming

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage