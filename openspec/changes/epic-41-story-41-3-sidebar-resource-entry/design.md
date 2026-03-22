# Design: Sidebar Resource Entry Model

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Keep fixed navigation entries
- Add dynamic resource entry model
- Add editor entries and recent items
- Open all resources through host protocol

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
