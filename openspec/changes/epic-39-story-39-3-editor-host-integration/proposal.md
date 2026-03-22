# Proposal: Editor Host Integration

## Background
Integrate built-in editors into Workbench host and tab model.

## Scope
### In Scope
- Support editor tab open
- Show save status
- Support editor instance switching
- Hook into host lifecycle

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.1
- Story 39.1
