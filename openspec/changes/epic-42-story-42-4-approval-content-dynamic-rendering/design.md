# Design: Dynamic Approval Content Rendering

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Integrate dynamic sections into approval detail
- Keep action area fixed
- Bind flow state and field behavior
- Add approval permission checks

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
