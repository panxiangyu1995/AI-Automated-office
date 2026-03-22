# Proposal: Knowledge Retrieval Baseline

## Background
Connect the runtime to baseline knowledge retrieval for scoped business context.

## Scope
### In Scope
- Define retrieval request contract
- Resolve scoped knowledge sources by tenant and department
- Inject retrieval results into runtime context
- Keep retrieval references available for audit

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 47.1
- Story 47.2