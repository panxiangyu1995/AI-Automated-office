# Design: Editor Host Integration

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Support editor tab open
- Show save status
- Support editor instance switching
- Hook into host lifecycle

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
