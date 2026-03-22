# Design: Template Version and Publish Baseline

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define template version and status model
- Implement publish action
- Implement rollback action
- Support default template selection

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
