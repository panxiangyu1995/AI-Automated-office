# Proposal: Replan and Failure Strategy

## Background
Support bounded replanning and standardized failure handling in the Agent runtime.

## Scope
### In Scope
- Define bounded replanning rules
- Handle tool or permission failures with runtime decisions
- Record replan attempts and outcomes
- Surface actionable failure states to the host

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.2
- Story 44.3