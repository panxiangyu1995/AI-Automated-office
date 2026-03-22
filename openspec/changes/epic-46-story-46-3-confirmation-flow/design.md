# Design: Confirmation Flow

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Emit confirmation parts for gated steps
- Pause runtime until confirmation decision is provided
- Support approve reject and cancel outcomes
- Resume or terminate execution based on confirmation result

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage