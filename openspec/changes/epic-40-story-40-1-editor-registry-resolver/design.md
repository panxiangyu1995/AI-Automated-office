# Design: Editor Registry and Resolver

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define EditorDescriptor contract
- Implement EditorRegistry registration
- Implement resource-to-editor resolver
- Implement fallback and conflict rule

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
