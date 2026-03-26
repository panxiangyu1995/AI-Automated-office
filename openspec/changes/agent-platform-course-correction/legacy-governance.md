# Legacy Change Governance

## Default Rule

`agent-platform-course-correction` is the authoritative corrective baseline for refactor-affected Agent-platform work after the iron-law rebaseline.

Historical task batches and legacy unarchived OpenSpec changes remain as implementation traceability, but they are no longer authoritative starting points for new coding decisions in the affected areas below.

## Historical Task Batch Classification

| Artifact | Classification | Rule |
|---|---|---|
| `task.json` tasks `1-103` | `freeze` | Keep as completed implementation history only. |
| `task.json` task `104` | `completed` | Records the completed corrective rebaseline and remains as traceability, not an open execution queue. |
| `task-course-correction.json` | `completed` | Mirrors the completed corrective OpenSpec change and remains the focused audit trail for the rebaseline. |
| `task-archived.json` / `task-archived-1.json` | `freeze` | Keep as archived historical reference only. |

## Active OpenSpec Classification

| Area | Representative changes | Implemented code surfaces | Classification | Execution rule |
|---|---|---|---|---|
| Main-Agent / Sub-Agent ownership | `epic-21-story-21-17` to `epic-21-story-21-23`, `epic-7-story-7-8`, `epic-7-story-7-9` | `src/features/settings/components/SubAgent*.tsx`, `src/features/session/components/SubAgent*.tsx` | `rename-rebind + refactor` | Keep story traceability, but all ongoing work must follow “one main Agent per user + user-owned Sub-Agents + department as boundary”. |
| Tool history / observability / capability status | `epic-5-story-5-6`, `epic-5-story-5-12`, `epic-5-story-5-13` | `src/features/session/components/ToolHistory.tsx`, `src/features/session/components/AgentObservabilityPanel.tsx`, `src/features/session/components/ModuleCapabilityStatus.tsx` | `rename-rebind + refactor` | Keep the surfaces, but rebaseline examples and semantics to Tool Calling 2.0. |
| Capability supply / Skill layering | `epic-21-story-21-9`, `epic-21-story-21-19` | `src/features/settings/components/SubAgentToolBinding.tsx`, `src/features/settings/components/subAgentSettingsFixtures.ts` | `refactor` | Keep capability management surfaces, but enforce platform built-in / department built-in / user-installed separation. |
| Writeback adapters and review flow | `epic-49-story-49-1` to `epic-49-story-49-4`, `epic-4-story-4-1` | `src/features/session/runtime/*writeback*.ts`, `src/features/session/runtime/stagedReviewFlow.ts`, `src/features/agent/components/AgentChatPanel.tsx`, `src/features/agent/components/StagedReviewPanel.tsx` | `keep foundation + refactor` | Keep the adapters, but only execute them through the staged-review contract with user-only accept/reject/rollback. |
| Runtime / host / schema foundations | `epic-41`, `epic-42`, `epic-43`, `epic-44`, `epic-45`, `epic-46`, `epic-47`, `epic-48` | Workbench host, route container, session models, runtime state machine, tool registry, permission precheck, context and audit layers | `keep` | Continue to reuse as aligned foundations; do not fork them back into department-specific runtimes. |

## Superseded Legacy Changes

The following changes are explicitly superseded as standalone execution paths and should not be resumed independently:

- `epic-21-story-21-9-skill-configuration`
- `epic-21-story-21-17-sub-agent-registry`
- `epic-21-story-21-18-sub-agent-persona-config`
- `epic-21-story-21-19-sub-agent-tool-binding`
- `epic-21-story-21-20-sub-agent-permission-config`
- `epic-21-story-21-21-sub-agent-model-config`
- `epic-21-story-21-22-sub-agent-routing`
- `epic-21-story-21-23-sub-agent-execution-monitoring`
- `epic-5-story-5-6-module-capability-status`
- `epic-5-story-5-12-tool-history`
- `epic-5-story-5-13-agent-observability-panel`
- `epic-7-story-7-8-sub-agent-runtime-baseline`
- `epic-7-story-7-9-sub-agent-persistence`
- `epic-49-story-49-1-form-writeback-adapter`
- `epic-49-story-49-2-detail-section-writeback-adapter`
- `epic-49-story-49-3-workbench-card-writeback`
- `epic-49-story-49-4-editor-and-template-writeback`

## Operator Guidance

- Do not delete or rewrite historical OpenSpec artifacts unless there is a separate archival action.
- Do not start new implementation from the superseded changes above.
- When a historical story is needed for traceability, read it together with this governance file and the corrective change.
- Start new implementation from the updated iron-law documents and new change proposals, using the corrective change as reference rather than as an active backlog.
