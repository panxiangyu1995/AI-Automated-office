# Proposal: Prompt builder and provider request path

## Change Type
- new

## Background
Create the real prompt assembly and provider request path for the common Agent runtime.

This story is aligned to the agent-runtime-rebaseline plan and replaces earlier sequencing assumptions for this runtime area.

## Scope
### In Scope
- Define provider traits and request-response contracts
- Implement PromptBuilder with system prompt, runtime context, and tool visibility
- Support provider selection, timeout, retry, and error mapping
- Connect PromptBuilder to AgentOrchestrator
- Persist model outputs through the runtime pipeline

### Out of Scope
- Work outside this story boundary
- Business pilot or skill expansion that is not named in this story
- Rebuilding archived Story 43.1 through Story 49.4 foundations from scratch

## Risks
- Backend and frontend contracts may drift during integration
- Placeholder, mock, or UI-only behavior may survive in the execution path
- Dependency stories may not be stable enough when implementation begins

## Dependencies
- Story 51.1