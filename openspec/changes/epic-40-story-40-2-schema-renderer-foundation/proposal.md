# Proposal: Schema Renderer Foundation

## Background
Build a minimum viable schema renderer for dynamic pages.

## Scope
### In Scope
- Define baseline page schema shape
- Render layout and baseline component nodes
- Implement renderer error boundary
- Expose renderer debug metadata

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 40.1
