# Proposal: Unified Core Plugin and MCP Tool Adapters

## Background
Expose core, plugin, and MCP tools through one execution protocol.

## Scope
### In Scope
- Bridge core tools into the registry
- Bridge plugin tools into the registry
- Bridge MCP tools into the registry
- Keep adapter outputs consistent across tool sources

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 45.1
- Story 45.2