# Design: Interrupt Retry and Checkpoint Recovery

## Architecture Alignment
- Presentation: React + TypeScript shell
- Runtime: Rust + Tauri agent runtime services
- Security: permission and audit boundary reuse

## Technical Design
- Support runtime interruption requests
- Persist step checkpoints for resume
- Allow controlled retry from checkpoint or step start
- Record recovery decisions in runtime history

## Interfaces
- Runtime contract
- Host and context contract
- Audit and permission hooks

## Test Focus
- Contract compatibility
- Failure and fallback behavior
- Permission and audit coverage