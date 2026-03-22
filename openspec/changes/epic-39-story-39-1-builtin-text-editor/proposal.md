# Proposal: Built-in Text Editor Capability

## Background
Provide built-in text and rich-text editor baseline capability.

## Scope
### In Scope
- Implement load/save for text content
- Provide baseline toolbar
- Support read-only and editable modes
- Hook into unified save state indicator

### Out of Scope
- Full low-code designer UX in this story
- Cross-tenant behavior changes

## Risks
- Regression in fixed UI route behavior
- Permission boundary drift in dynamic rendering

## Dependencies
- Story 41.1
