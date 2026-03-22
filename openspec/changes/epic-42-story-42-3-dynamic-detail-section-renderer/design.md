# Design: Dynamic Detail Section Renderer

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define detail section contract
- Render field sections
- Render attachment and relation sections
- Support section-level conditional display

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
