# Design: Form Writeback Adapter

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define writeback contract for form fields
- Map normalized runtime results into field updates
- Check form field permissions before writeback
- Record writeback actions in the runtime trace

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage