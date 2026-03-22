# Proposal: User Tenant and Department Context

## Background
Assemble user, tenant, and department context for common runtime execution.

## Scope
### In Scope
- Define context envelope for user, tenant, and department
- Inject identity and organizational data into runtime context
- Normalize context payloads across departments
- Reuse existing permission model identifiers

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.1
- Story 2.7