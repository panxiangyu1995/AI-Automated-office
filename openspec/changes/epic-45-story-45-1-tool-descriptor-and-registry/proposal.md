# Proposal: Tool Descriptor and Registry

## Background
Create the unified descriptor and registry model for all runtime tools.

## Scope
### In Scope
- Define tool descriptor schema
- Register core, plugin, and MCP tool metadata
- Support lookup by tool id and capability
- Validate registry uniqueness and availability

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 44.2