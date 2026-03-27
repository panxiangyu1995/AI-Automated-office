# Proposal: Agent runtime rebaseline

## Background
The current codebase already contains frontend runtime shells for session lifecycle, planning, execution, tools, trace models, and writeback adapters.
The main missing capability is the backend execution spine in Rust and the bridge that turns those shells into real runtime behavior.

## Scope
### In Scope
- Rebaseline the generic Agent roadmap around the real backend runtime path
- Keep task sequencing consistent with the current codebase instead of rebuilding already completed foundations
- Establish one planning entry point for Task 111 through Task 127

### Out of Scope
- Direct implementation of every story in this change
- Rebuilding archived Story 43.1 through Story 49.4 from scratch
- Pulling business pilot or skill-market work ahead of the generic Agent runtime

## Risks
- Teams may continue following obsolete sequencing and rebuild finished foundations
- Mock-only paths may still be mistaken for completed runtime capability
- Sub-Agent work may start before the main Agent loop is actually stable

## Dependencies
- task-archived-1.json completed runtime foundations
- PRD, architecture, and epics remain the governing constraints