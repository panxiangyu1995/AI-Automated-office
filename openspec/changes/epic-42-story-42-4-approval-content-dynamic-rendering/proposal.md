# Proposal: Dynamic Approval Content Rendering

## Background
Render approval detail content dynamically while keeping action area fixed.

## Scope
### In Scope
- Integrate dynamic sections into approval detail
- Keep action area fixed
- Bind flow state and field behavior
- Add approval permission checks

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 42.2
- Story 42.3
