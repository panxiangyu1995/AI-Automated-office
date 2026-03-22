# Proposal: Sensitive Action Detection

## Background
Detect high-risk actions that require additional runtime control.

## Scope
### In Scope
- Define sensitive action classification rules
- Flag runtime steps that target protected tools or fields
- Attach risk metadata to planned steps
- Prevent automatic execution of high-risk actions

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 46.1