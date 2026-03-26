## Why

四份铁律文档已经完成重定向，但现有实施基线仍然停留在旧叙事上：`task.json`、`task-archived.json`、`task-archived-1.json` 全部显示已完成，而大量未归档 OpenSpec 变更仍处于 `in-progress`；同时，代码里已经落地了一批会继续误导后续实现的旧模型、旧工具样例和 mock 配置。继续在这条轨道上迭代，只会把偏差固化得更深。

现在需要建立一个正式的纠偏重构变更，用来冻结旧执行心智、保留可复用基础、重构关键偏差，并为后续 refactor 提供唯一的新执行入口。

## What Changes

- 建立一份正式的 Agent 平台纠偏重构变更，作为后续 refactor 的唯一执行入口。
- 冻结旧的“部门 Agent / 场景专用工具 / 默认开放低层工具”叙事，改为“每用户主 Agent + Sub-Agent + 部门能力边界 + Tool Calling 2.0 + 审阅式写回”。
- 明确已有实现的四类处理方式：`保留`、`改名/重绑`、`重构`、`冻结/淘汰`。
- 将 Sub-Agent 相关 UI 从“部门专属 mock 助手”重构为“隶属于当前用户主 Agent 的可配置 Sub-Agent”。
- 将工具、能力供给、历史、观测、状态页中的旧样例和旧默认值，统一收束到新的 Tool Calling 2.0 和平台内置 Skills 基线。
- 将现有写回适配器提升为“AI 暂存写回 + 用户审阅接受/拒绝”的统一 review 流，而不是让工具调用卡片与页面变更语义混杂。
- 建立新的纠偏任务批次，供后续实现时替代旧的已完成任务批次继续推进。

## Capabilities

### New Capabilities
- `change-governance-rebaseline`: 为旧任务、旧 OpenSpec 变更和已有实现建立 keep/refactor/freeze/supersede 治理基线。
- `main-agent-sub-agent-ownership`: 将用户主 Agent / Sub-Agent 的主体模型落到配置 UI、状态模型和持久化入口。
- `tool-calling-2-baseline`: 将现有工具体系、样例、默认暴露范围收束到少量、原子化、分层的 Tool Calling 2.0 基线。
- `review-writeback-governance`: 将已有 writeback 能力统一到“AI 暂存候选改动 + 用户接受/拒绝”的审阅边界。
- `builtin-skill-capability-supply`: 在设置面和运行时显式区分平台内置 Skills、部门能力包 Skills 与用户安装 Skills。

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/features/settings/components/SubAgent*.tsx`
  - `src/features/session/components/ToolHistory.tsx`
  - `src/features/session/components/AgentObservabilityPanel.tsx`
  - `src/features/session/components/ModuleCapabilityStatus.tsx`
  - `src/features/session/runtime/*writeback*.ts`
  - `src/features/session/tools/*`
- Affected planning inputs:
  - `task.json`
  - legacy archived task files remain historical reference only
  - active `openspec/changes/*` backlog needs corrective governance
- Affected implementation workflow:
  - new work should no longer inherit old unfinished OpenSpec changes as default execution source
  - future refactor work should follow this change and its corrective task batch
