# Proposal: Page and Resource Context

## Background
Inject current page and resource context into the common runtime.

## Scope
### In Scope
- Define page context contract from host runtime
- Attach active resource references to runtime context
- Resolve context per static dynamic and editor modes
- Expose context safely to planner and tool runtime

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 41.4
- Story 47.1