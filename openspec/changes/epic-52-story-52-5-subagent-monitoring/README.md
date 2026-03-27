# epic-52-story-52-5-subagent-monitoring

## Story
- Epic: Epic 52
- Story: Story 52.5
- Task: Task 127
- Title: Sub-Agent monitoring and diagnostics
- Phase: Phase 4 - Advanced Common Agent
- Priority: low

## Goal
After real Sub-Agent execution exists, add monitoring, linked traces, metrics, and diagnostics for multi-agent execution.

## Requirements Mapping
- FR: FR924, FR938
- NFR: NFR1, NFR16, NFR23
- ARCH: ADR-013, ADR-023
- UX: UX-01, UX-04

## Dependencies
- Story 52.4
- Story 55.3
- Story 21.23

## Planned Steps
1. Add metrics for Sub-Agent latency, failure rate, and token usage
2. Connect Sub-Agent monitoring to the shared telemetry and trace stack
3. Support inspection by main session, child call, and role template
4. Emit diagnostics for multi-agent troubleshooting
5. Verify monitoring does not create new permission leaks