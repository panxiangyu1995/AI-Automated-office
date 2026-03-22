# Proposal: Route Containerization

## Background
Route to page containers instead of binding routes directly to page components.

## Scope
### In Scope
- Create unified route container entry
- Define page context contract
- Apply permission check at container level
- Support route mapping for static and dynamic pages

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.1
