# Proposal: Approval Pilot Integration

## Background
Validate the common Agent runtime in the approval scenario.

## Scope
### In Scope
- Bind approval tools and context into the common runtime
- Support approval summary generation and structured content fill
- Require confirmation for approval execution actions
- Verify end-to-end audit and writeback behavior

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 46.3
- Story 49.2
- Story 48.2