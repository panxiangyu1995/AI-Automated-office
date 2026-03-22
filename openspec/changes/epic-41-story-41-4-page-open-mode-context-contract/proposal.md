# Proposal: Page Open Mode and Context Contract

## Background
Define static/dynamic/editor open modes and a unified page context contract.

## Scope
### In Scope
- Define page open mode protocol
- Define page context shape
- Define data source and permission context fields
- Define host lifecycle callbacks

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.1
- Story 41.2
