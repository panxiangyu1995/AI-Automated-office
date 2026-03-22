# Proposal: Template Permission and Safety Boundary

## Background
Add whitelist, permission checks, and audit boundary for template runtime.

## Scope
### In Scope
- Implement component whitelist
- Implement data source access control
- Implement action permission checks
- Emit template runtime audit events

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 40.2
- Story 2.6
