# Design: Sensitive Action Detection

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define sensitive action classification rules
- Flag runtime steps that target protected tools or fields
- Attach risk metadata to planned steps
- Prevent automatic execution of high-risk actions

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage