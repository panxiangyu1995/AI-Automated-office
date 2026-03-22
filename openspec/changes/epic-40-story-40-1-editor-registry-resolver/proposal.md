# Proposal: Editor Registry and Resolver

## Background
Build editor registry and resolver to select editors by resource type.

## Scope
### In Scope
- Define EditorDescriptor contract
- Implement EditorRegistry registration
- Implement resource-to-editor resolver
- Implement fallback and conflict rule

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.4
- Story 39.3
