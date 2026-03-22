# Design: Tool Descriptor and Registry

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define tool descriptor schema
- Register core, plugin, and MCP tool metadata
- Support lookup by tool id and capability
- Validate registry uniqueness and availability

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage