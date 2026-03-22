# Proposal: Structured Planner

## Background
Generate structured plans from user goals for the common Agent runtime.

## Scope
### In Scope
- Define plan output schema
- Generate linear multi-step plans
- Mark steps that require tools or confirmation
- Persist plans for audit and replay

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.1