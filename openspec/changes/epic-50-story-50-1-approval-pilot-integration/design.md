# Design: Approval Pilot Integration

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Bind approval tools and context into the common runtime
- Support approval summary generation and structured content fill
- Require confirmation for approval execution actions
- Verify end-to-end audit and writeback behavior

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage