# Design: Workbench Host Foundation

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define page host interface
- Support static/dynamic/editor mode switching
- Add host lifecycle and error boundary
- Keep compatibility with existing fixed pages

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
