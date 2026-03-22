# Design: Tool Result Normalization

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Define normalized success and failure result envelopes
- Map tool outputs into structured result payloads
- Preserve raw output references where needed
- Expose normalized results to downstream runtime layers

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage