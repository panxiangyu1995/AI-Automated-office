# Design: Finance Pilot Integration

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Bind finance tools and context into the common runtime
- Support structured document understanding and field fill workflows
- Require confirmation for high-risk finance actions
- Verify shared runtime behavior across a third business domain

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage