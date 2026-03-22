# Proposal: Workbench Host Foundation

## Background
Upgrade Workbench into a unified page host supporting static, dynamic, and editor views.

## Scope
### In Scope
- Define page host interface
- Support static/dynamic/editor mode switching
- Add host lifecycle and error boundary
- Keep compatibility with existing fixed pages

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 1.4
- Story 1.5
