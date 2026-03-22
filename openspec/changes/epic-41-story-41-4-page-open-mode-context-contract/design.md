# Design: Page Open Mode and Context Contract

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define page open mode protocol
- Define page context shape
- Define data source and permission context fields
- Define host lifecycle callbacks

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
