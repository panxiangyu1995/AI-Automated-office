# Proposal: Failure and Result Recording

## Background
Persist runtime results and failure causes for task-level analysis.

## Scope
### In Scope
- Record final result summary for each task
- Persist failure reasons and impacted step ids
- Store retry and replan outcomes
- Expose records for recovery and analysis flows

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.4
- Story 48.1