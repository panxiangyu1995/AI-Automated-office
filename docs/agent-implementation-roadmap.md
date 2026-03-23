# Agent Implementation Roadmap

## Purpose

This document defines the full Agent-first delivery route after reviewing:

- `task.json`
- `task-archived.json`
- `_bmad-output/planning-artifacts/prd.md`
- `_bmad-output/planning-artifacts/architecture.md`
- `_bmad-output/planning-artifacts/epics.md`

The target is clear:

- Finish all platform-level Agent capabilities first
- Push department-specific business development to the end
- Keep the route aligned with the current iron-law documents

## Planning Position

This roadmap is not only a follow-up to the previous partial plan.
It is the complete remaining Agent development route under the current iron-law baseline.

It follows three planning assumptions:

1. Runtime and UI host foundations already implemented in completed tasks should not be rebuilt.
2. Remaining work should prioritize Agent platform capability over department business capability.
3. Department-specific pilot integration is the last Agent step, not the first.

## Completed Baseline

Based on `task.json` and `task-archived.json`, the following foundation is already in place and should be treated as completed baseline:

- Desktop shell, layout, auth, permissions, editor host, schema runtime, and dynamic page host foundations
- Dynamic form/detail/card runtime targets from Epic 42
- Common Agent runtime foundations from Epic 43-49:
  - Session lifecycle
  - Message / part model
  - Streaming sync
  - Runtime state machine
  - Structured planner
  - Step executor
  - Unified tool registry / executor / result normalization
  - Permission precheck and confirmation flow
  - Context assembly and memory MVP baseline
  - Trace / audit / metrics baseline
  - Dynamic UI writeback adapters

This means the next work should focus on productizing, governing, extending, and operationalizing the Agent platform instead of rebuilding the runtime core.

## Iron-Law Constraints

The remaining Agent route must keep the following constraints:

- Prompt governance follows `FR850-FR863`
- Skill loading is progressive and on-demand; budget overflow downgrades to summary/index loading
- SOUL templates are read-only by default; persistent edits require user confirmation and audit trail
- Heartbeat and Cron cannot bypass sensitive-operation confirmation or approval
- Memory MVP stays local-first with `SQLite + FTS5 + sqlite-vec`
- `agent_cognitive_tunnel_state` is allowed but must stay behind permission and audit gates
- Core runtime continues to use the current Tauri + Rust + React + TypeScript stack

## In Scope

The remaining Agent-related scope includes:

- Agent user-facing product surfaces
- Tool governance and runtime control plane
- Memory and knowledge productization
- ClawHub compatibility for Skill / SOUL / Plugin resource ingestion
- Connectors and external capability supply
- Scheduling, reliability, failover, and operational governance
- Channel / gateway / multi-party Agent collaboration capability
- Observability expansion
- Final business pilot validation through the common Agent runtime

## Out Of Scope For Now

The following should be deferred until the Agent platform route below is completed:

- Department business modules as primary implementation target
- Department market and module commercial packaging as primary priority
- Department-specific UI build-out that is not required for Agent platform validation

## Recommended Delivery Order

### Wave 0: Baseline Reconciliation

Goal:
Confirm that the already completed runtime foundation is usable as the single source of truth for all later Agent work.

Primary epics:

- Epic 4: AI Agent framework core
- Epic 5: Tool system and call mechanism
- Epic 6: Memory layer system
- Epic 7: Perception and decision layer

Why first:

- `task.json` shows the common runtime foundation exists
- `epics.md` still contains earlier product-facing Agent stories under Epic 4-7
- Before adding more governance surfaces, the team should reconcile runtime implementation with the product stories and fill only missing product-facing gaps

Focus:

- Chat session UX, history, checkpoint UX, retry and recovery UX
- Tool call cards, tool detail view, retry and manual fallback
- Memory UI and memory management surface
- Planner, tool selection, loop detection, and runtime explanation exposure

Exit criteria:

- No duplicate runtime path exists
- Product-facing Agent UI uses the common runtime
- Epic 4-7 gaps are either implemented or explicitly marked as already covered by Epic 43-49 foundations

### Wave 1: Agent Control Plane

Goal:
Turn the existing runtime into a configurable, governable, inspectable Agent product.

Primary epics:

- Epic 21: LLM provider and MCP configuration management
- Remaining productized memory / knowledge management surfaces from Epic 6 and Epic 9

Focus:

- LLM provider management
- MCP service lifecycle and tool approve policies
- Skill management with progressive loading
- System prompt management with L1/L2/L3 loading
- Rules management
- Prompt debug console
- Sub-Agent registry, persona, routing, binding, model selection
- Knowledge base registry, scope binding, review flow
- Memory data management and preference controls

Dependencies:

- Wave 0 baseline reconciliation completed

Exit criteria:

- Main Agent and Sub-Agent can be configured without code changes
- Runtime decisions are governable through UI and persisted configuration
- Memory and knowledge surfaces are usable by end users and admins

### Wave 2: Ecosystem Compatibility And External Capability Supply

Goal:
Make the Agent platform extensible through external resources and external systems.

Primary epics:

- Epic 10: ClawHub ecosystem compatibility
- Epic 30: Integrations and connectors

Focus:

- SKILL.md parsing and lifecycle
- SOUL.md import, selection, versioning, and read-only governance
- Plugin adaptation and security scanning
- Resource marketplace integration and private-market policy
- Connector framework, auth, health check, retry, and downgrade

Dependencies:

- Wave 1 control plane completed

Exit criteria:

- External capabilities can enter the platform through controlled, auditable paths
- Connectors and imported resources use the same permission and audit chain as native runtime capabilities

### Wave 3: Collaboration And Multi-Channel Agent Operations

Goal:
Enable Agent-to-human and Agent-to-Agent collaboration on top of the governed runtime.

Primary epics:

- Epic 11: Unified messaging and Agent collaboration
- Epic 37: Channel and plugin runtime quality

Focus:

- Agent messaging to employees and other Agents
- Work card generation and delivery
- Group participation rules for Agents
- Agent communication permission boundaries
- Channel routing, offline queue, re-delivery, and audit
- Plugin health check, isolation, self-healing, and quality gates

Dependencies:

- Wave 1 completed
- Wave 2 preferred before broad external channel rollout

Exit criteria:

- Agent collaboration is transparent, permission-bound, and auditable
- Multi-channel operation does not create side paths outside the common runtime

### Wave 4: Scheduling, Reliability, And Platform Operations

Goal:
Make the Agent platform stable for long-running automation and production operation.

Primary epics:

- Epic 32: Observability
- Epic 35: Heartbeat and scheduling
- Epic 36: Error and reliability

Focus:

- Unified log center, trace, metrics, alerting
- Heartbeat precheck, `HEARTBEAT_OK`, active-window policy, quiet handling
- Cron center with retry, backoff, mutex, timeout, and approval gates
- Error classification and user-facing recovery guidance
- LLM failover, auth rotation, downgrade, switchback
- Session repair, context repair, replay, and diagnostic export

Dependencies:

- Wave 1 control plane completed

Exit criteria:

- Long-running automation is observable and policy-controlled
- Failure paths are recoverable and diagnosable
- Scheduling does not bypass human-in-the-loop controls

### Wave 5: Final Agent Platform Hardening

Goal:
Close remaining cross-cutting platform risks before business-scale rollout.

Primary scope:

- Security hardening across imported resources, connectors, channels, and scheduling
- Performance hardening against NFR targets
- Audit completeness and exportability
- Permission consistency across runtime, writeback, messaging, and scheduling
- Regression testing across common Agent workflows

Suggested validation set:

- Multi-session runtime stability
- Cross-provider failover drills
- Tool permission and confirmation regression suite
- Memory retrieval and writeback consistency
- Channel delivery and retry behavior
- Heartbeat and Cron quiet-mode behavior

Exit criteria:

- Platform is ready to support business pilots without reworking core runtime behavior

### Wave 6: Business Pilot Validation Only

Goal:
Validate the common Agent platform in real business scenarios without turning department development into the main track yet.

Primary epic:

- Epic 50: Business pilot integration

Pilot order:

1. Approval
2. Sales
3. Finance

Rules:

- Reuse the same runtime, tool protocol, permission gate, memory chain, and audit chain
- Do not create department-specific Agent kernels
- Treat this wave as platform validation, not department feature expansion

Exit criteria:

- The same Agent platform completes read -> analyze -> generate/fill -> confirm -> execute loops in at least three business scenarios

## Practical Execution Sequence

If the team wants a concrete implementation sequence, use this order:

1. Wave 0 gap reconciliation for Epic 4-7
2. Epic 21 full control plane
3. Epic 9 knowledge governance surfaces and Epic 6 remaining memory product surfaces
4. Epic 10 ClawHub compatibility
5. Epic 30 connectors
6. Epic 11 Agent collaboration
7. Epic 32 observability
8. Epic 35 heartbeat and scheduling
9. Epic 36 reliability and failover
10. Epic 37 channels and plugin runtime quality
11. Wave 5 hardening
12. Epic 50 business pilot validation

## What Should Not Be Scheduled Early

Do not schedule these before the route above is finished:

- Department module feature expansion as the main roadmap
- Large-scale department workflow customization
- Department-specific Agent branching that bypasses the common runtime
- Business pilot rollout before control plane, scheduling, reliability, and observability are ready

## Definition Of Done For The Full Agent Route

The full Agent route should only be considered complete when all conditions below are true:

- The common runtime is the only runtime path used by Agent product surfaces
- Main Agent and Sub-Agent are fully configurable through UI and persisted policy
- Prompt, Skill, SOUL, MCP, connector, and scheduling capabilities all share the same permission and audit model
- Memory and knowledge are productized, not only runtime-internal
- Collaboration, channels, and automation are policy-bound and observable
- At least three business pilots run through the common runtime without department-specific runtime forks

## Summary

The previous roadmap covered only one slice of remaining Agent work.
The complete Agent-first route should now be understood as:

1. Reconcile product-facing Agent gaps against the completed runtime baseline
2. Finish Agent control plane and governance
3. Finish ecosystem compatibility and external capability supply
4. Finish collaboration, channels, scheduling, and reliability
5. Harden the platform
6. Validate with business pilots only after the platform is ready

That is the shortest route that satisfies your priority:

- Agent first
- Department later
- No duplicate runtime
- No premature business expansion
