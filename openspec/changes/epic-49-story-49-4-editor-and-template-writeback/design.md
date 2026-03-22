# Design: Editor and Template Writeback

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define editor writeback contract
- Support template content updates through host APIs
- Preserve dirty state and version boundaries
- Record writeback decisions for audit and rollback

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage