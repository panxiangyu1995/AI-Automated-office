# Proposal: Interrupt Retry and Checkpoint Recovery

## Background
Add interrupt, retry, and checkpoint recovery to the session runtime.

## Scope
### In Scope
- Support runtime interruption requests
- Persist step checkpoints for resume
- Allow controlled retry from checkpoint or step start
- Record recovery decisions in runtime history

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 43.1
- Story 43.3