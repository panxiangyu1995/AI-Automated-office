# Design: Dynamic Form Field Contract

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Editor and schema runtime
- Security: permission and audit boundary reuse

## Technical Design
- Define field types and layout props
- Define default value and validation rules
- Define visibility and editability rules
- Define field-level permission mapping

## Interfaces
- Route and host contract
- Page context contract
- Permission hook contract

## Test Focus
- Route compatibility
- Permission checks
- Runtime fallback and error boundary
