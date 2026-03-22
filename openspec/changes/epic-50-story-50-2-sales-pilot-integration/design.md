# Design: Sales Pilot Integration

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Bind sales tools and context into the common runtime
- Support customer summary and follow-up form fill workflows
- Write approved results into workbench and detail views
- Verify shared runtime behavior without a dedicated sales-only agent core

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage