# Proposal: Workbench Card Writeback

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical foundation traceability only. Ongoing implementation for workbench-card writeback must route through the corrective staged-review contract and updated iron-law documents.

## Background
Generate and update workbench cards through the dynamic host runtime.

## Scope
### In Scope
- Define card writeback payload for dashboard content
- Create or update cards within approved containers
- Check visibility and placement permissions
- Expose card writeback events to the host

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 42.5
- Story 45.4
- Story 46.1
