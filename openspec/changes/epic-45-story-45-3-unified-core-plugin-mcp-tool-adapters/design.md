# Design: Unified Core Plugin and MCP Tool Adapters

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Bridge core tools into the registry
- Bridge plugin tools into the registry
- Bridge MCP tools into the registry
- Keep adapter outputs consistent across tool sources

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage