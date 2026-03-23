# Design: Sub Agent Persistence

## Architecture Alignment
- Keep intent -> plan -> execute -> observe loop inside common runtime state machine
- Preserve explicit step boundaries and interruption/replan checkpoints
- For sub-agents, keep parent-agent orchestration as the single governance authority

## Affected Modules
- `src/features/agent/components/*`
- `src/features/agent/hooks/*`
- `src/features/agent/types/*`
- `src/stores/appStore.ts`
- `src/lib/tauri.ts`
- `src-tauri/src/commands/agent.rs`
- `src-tauri/src/agent/session/*`
- `src-tauri/src/agent/runtime/*`
- `src-tauri/src/agent/planner/*`
- `src-tauri/src/agent/executor/*`
- `src-tauri/src/agent/subagent/*`
- `src-tauri/src/agent/tools/registry.rs`

## Implementation Plan
### Intent and Input Processing
- Parse user intent with confidence scoring and fallback clarification strategy
- Normalize multimodal inputs into planner-ready representations where needed
### Planning and Execution
- Build structured plan graph with explicit preconditions and expected outputs
- Execute per-step with state persistence and resumable checkpoints
### Guardrails and Sub-Agent Orchestration
- Enforce loop detection, boundary controls, and safe termination conditions
- Route sub-agent tasks only when capability and policy checks pass

## Interface Contracts
- Planner contract: intent + context -> ordered executable steps with constraints
- Executor contract: step input -> status events + artifacts + normalized errors
- Sub-agent contract: parent request + scoped capability -> bounded result + trace

## Failure Handling
- On low confidence, request clarification instead of unsafe execution
- On repeated failure, trigger bounded replan with explicit stop policy
- On boundary violation, terminate execution and emit auditable policy event

## Test Strategy
- Unit: intent classification, planner constraints, loop detection rules
- Integration: planner/executor roundtrip and replan behavior
- Security: boundary enforcement and sub-agent scope isolation
