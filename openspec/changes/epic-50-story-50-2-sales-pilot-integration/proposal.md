# Proposal: Sales Pilot Integration

## Background
Validate the common Agent runtime in the sales scenario.

## Scope
### In Scope
- Bind sales tools and context into the common runtime
- Support customer summary and follow-up form fill workflows
- Write approved results into workbench and detail views
- Verify shared runtime behavior without a dedicated sales-only agent core

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 47.2
- Story 49.1
- Story 49.3