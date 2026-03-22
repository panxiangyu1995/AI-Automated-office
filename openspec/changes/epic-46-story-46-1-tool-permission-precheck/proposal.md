# Proposal: Tool Permission Precheck

## Background
Check permissions before any runtime tool call is executed.

## Scope
### In Scope
- Resolve required permissions from tool descriptors
- Check user, department, and tenant permissions before execution
- Block unauthorized tool calls before runtime execution
- Publish permission decisions into the runtime stream

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 45.1
- Story 45.2
- Story 2.7