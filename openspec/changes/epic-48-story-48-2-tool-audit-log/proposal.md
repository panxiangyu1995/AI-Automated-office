# Proposal: Tool Audit Log

## Background
Record normalized audit events for all tool calls.

## Scope
### In Scope
- Persist audit entries for each tool call
- Record input and result summaries
- Link permission and confirmation outcomes to tool events
- Make audit events available for future governance views

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 45.4
- Story 46.3
- Story 48.1