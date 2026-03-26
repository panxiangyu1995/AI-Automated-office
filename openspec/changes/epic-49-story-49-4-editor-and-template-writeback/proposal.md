# Proposal: Editor and Template Writeback

> Status: Standalone execution direction superseded by `agent-platform-course-correction`.
> Keep this change as historical foundation traceability only. Ongoing implementation for editor/template writeback must route through the corrective staged-review contract and updated iron-law documents.

## Background
Write Agent output into editor and template hosts through controlled contracts.

## Scope
### In Scope
- Define editor writeback contract
- Support template content updates through host APIs
- Preserve dirty state and version boundaries
- Record writeback decisions for audit and rollback

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 39.1
- Story 40.5
- Story 45.4
