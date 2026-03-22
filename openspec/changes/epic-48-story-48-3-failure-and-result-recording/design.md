# Design: Failure and Result Recording

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Record final result summary for each task
- Persist failure reasons and impacted step ids
- Store retry and replan outcomes
- Expose records for recovery and analysis flows

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage