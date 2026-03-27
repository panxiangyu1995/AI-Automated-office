# epic-55-story-55-4-security-hardening

## Story
- Epic: Epic 55
- Story: Story 55.4
- Task: Task 121
- Title: Backend-enforced security and confirmation
- Phase: Phase 3 - Reliability and Governance
- Priority: high

## Goal
Move sensitive action detection, input validation, field permissions, and confirmation flow into backend-enforced runtime guards.

## Requirements Mapping
- FR: FR609, FR610, FR611
- NFR: NFR20, NFR21
- ARCH: ADR-018, ADR-041
- UX: UX-01

## Dependencies
- Story 51.3
- Story 55.1
- Story 46.1
- Story 46.2
- Story 46.3
- Story 46.4

## Planned Steps
1. Move sensitive input and dangerous action checks into backend guards
2. Implement backend confirmation, rejection, and permission-denied flows
3. Add allow and block policy for system, path, and network tools
4. Add second-pass validation for risky writeback and outbound requests
5. Write security events into audit records