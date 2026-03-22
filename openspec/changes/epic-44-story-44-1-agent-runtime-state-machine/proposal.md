# Proposal: Agent Runtime State Machine

## Background
Implement the common runtime state machine for planning, running, confirmation, completion, and failure.

## Scope
### In Scope
- Define runtime state model
- Enforce valid state transitions
- Expose state changes to session events
- Persist step and task status consistently

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 43.1
- Story 43.2