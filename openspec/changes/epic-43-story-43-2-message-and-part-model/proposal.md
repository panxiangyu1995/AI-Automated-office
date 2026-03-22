# Proposal: Message and Part Model

## Background
Implement the message and part model for structured Agent conversation records.

## Scope
### In Scope
- Define message and part schemas
- Support text, reasoning, tool_call, tool_result, confirmation, error, and ui_patch parts
- Persist ordered parts per message
- Expose serialization contract for frontend streaming

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 43.1