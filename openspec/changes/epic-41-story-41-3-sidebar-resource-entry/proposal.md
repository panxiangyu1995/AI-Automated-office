# Proposal: Sidebar Resource Entry Model

## Background
Upgrade Sidebar to support fixed navigation, dynamic resources, and editor entries.

## Scope
### In Scope
- Keep fixed navigation entries
- Add dynamic resource entry model
- Add editor entries and recent items
- Open all resources through host protocol

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.1
