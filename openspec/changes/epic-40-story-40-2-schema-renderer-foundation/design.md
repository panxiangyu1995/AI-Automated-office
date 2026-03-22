# Design: Schema Renderer Foundation

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define baseline page schema shape
- Render layout and baseline component nodes
- Implement renderer error boundary
- Expose renderer debug metadata

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
