# Design: Replan and Failure Strategy

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define bounded replanning rules
- Handle tool or permission failures with runtime decisions
- Record replan attempts and outcomes
- Surface actionable failure states to the host

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage