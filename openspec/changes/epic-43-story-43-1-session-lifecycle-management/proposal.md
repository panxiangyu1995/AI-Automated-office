# Proposal: Session Lifecycle Management

## Background
Create the session lifecycle baseline for the common Agent runtime.

## Scope
### In Scope
- Define session states and transitions
- Create session create/resume/close APIs
- Persist session ownership and runtime metadata
- Integrate session lifecycle with host context

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 41.1
- Story 41.4