# Proposal: Dynamic Detail Section Renderer

## Background
Render dynamic sections for detail page main content.

## Scope
### In Scope
- Define detail section contract
- Render field sections
- Render attachment and relation sections
- Support section-level conditional display

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 40.3
