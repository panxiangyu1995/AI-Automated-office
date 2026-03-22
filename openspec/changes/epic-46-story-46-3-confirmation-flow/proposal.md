# Proposal: Confirmation Flow

## Background
Add human confirmation flow for high-risk or policy-gated runtime steps.

## Scope
### In Scope
- Emit confirmation parts for gated steps
- Pause runtime until confirmation decision is provided
- Support approve reject and cancel outcomes
- Resume or terminate execution based on confirmation result

### Out of Scope
- Cross-tenant behavior changes outside this story
- Full platform hardening beyond MVP scope

## Risks
- Contract drift between runtime layers
- Regression in host and permission boundaries

## Dependencies
- Story 46.2
- Story 43.3