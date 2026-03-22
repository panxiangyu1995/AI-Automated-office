# Design: Page and Resource Context

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define page context contract from host runtime
- Attach active resource references to runtime context
- Resolve context per static dynamic and editor modes
- Expose context safely to planner and tool runtime

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage