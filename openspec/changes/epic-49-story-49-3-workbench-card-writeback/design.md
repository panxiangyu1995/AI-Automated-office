# Design: Workbench Card Writeback

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define card writeback payload for dashboard content
- Create or update cards within approved containers
- Check visibility and placement permissions
- Expose card writeback events to the host

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage