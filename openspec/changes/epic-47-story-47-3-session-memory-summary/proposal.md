# Proposal: Session Memory Summary

## Background
Provide memory summary and key fact extraction for active sessions.

## Scope
### In Scope
- Summarize recent session history into reusable memory entries
- Extract key facts for future steps
- Store summary artifacts with the session
- Refresh memory after important runtime milestones

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 43.2
- Story 47.1