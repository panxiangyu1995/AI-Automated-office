# Proposal: Step Executor

## Background
Execute planner steps through a common runtime executor.

## Scope
### In Scope
- Map plan steps to runtime actions
- Invoke tool runtime through executor contracts
- Handle synchronous and streaming step results
- Update state and message parts after each step

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.1
- Story 44.2