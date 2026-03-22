# Design: User Tenant and Department Context

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define context envelope for user, tenant, and department
- Inject identity and organizational data into runtime context
- Normalize context payloads across departments
- Reuse existing permission model identifiers

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage