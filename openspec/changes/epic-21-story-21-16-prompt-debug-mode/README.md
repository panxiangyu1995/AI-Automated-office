# Epic 21, Story 21.16: Prompt Debug Mode

## Overview
Create a debug console for prompt, rule, and safety behavior verification.

## Iron-Law Mapping
- FR: FR880, FR881, FR882, FR883, FR884, FR885, FR886, FR887, FR888
- NFR: NFR16
- ARCH: ADR-040, ADR-041, ADR-042
- UX: UX-02, UX-04

## Acceptance Scope
- Run test prompts against the Agent in debug mode
- Show triggered rules and prompt impact
- Display safety blocks and convergence strategy hits

## Traceability
| AC | Statement | Validation |
|---|---|---|
| AC-1 | Run test prompts against the Agent in debug mode | Scenario-1 in specs/spec.md |
| AC-2 | Show triggered rules and prompt impact | Scenario-2 in specs/spec.md |
| AC-3 | Display safety blocks and convergence strategy hits | Scenario-3 in specs/spec.md |

## Dependencies
- Story 21.15

## Input Documents
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/ux-design-specification.md`
- `_bmad-output/planning-artifacts/epics.md`
