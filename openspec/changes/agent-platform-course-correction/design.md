## Context

当前仓库已经出现“三套现实”并存的问题：

1. 铁律文档现实已经改变。
PRD、架构、Epic 已经收束到：
- 每用户一个主 Agent
- 可配置 Sub-Agent
- 部门只是上下文/权限/能力边界
- Tool Calling 2.0 采用少量、原子化、强能力优先的分层模型
- AI 只能暂存候选改动，最终接受/拒绝由用户执行
- 平台必须有内置 Skills 基线

2. 任务与 OpenSpec 治理现实不一致。
- `task.json`、`task-archived.json`、`task-archived-1.json` 全部显示通过。
- 但 `openspec list --json` 仍显示大量变更处于 `in-progress`，包括 Epic 4、5、6、7、9、10、11、21、30、32、35、36、37、49、50 等。
- 这意味着“任务清单已经结束”与“未归档变更仍在继续”的执行基线冲突。

3. 代码现实仍残留旧方向。
- `src/features/settings/components/SubAgentRegistry.tsx` 和相关 Sub-Agent 设置页仍以部门专属 mock 助手为主。
- `src/features/session/components/ToolHistory.tsx`、`AgentObservabilityPanel.tsx` 仍使用 `db_query`、`system_command` 等旧样例和旧默认暴露心智。
- `src/features/session/components/ModuleCapabilityStatus.tsx` 仍强调部门模块握手与模块化状态，而不是能力供给与作用域治理。
- `src/features/session/runtime/*writeback*.ts` 已经有较好的 writeback 适配器基础，但还没有统一成正式的“候选改动审阅流”。

## Goals / Non-Goals

**Goals:**
- 为纠偏重构建立唯一的新执行入口，停止继续沿用旧 backlog 心智。
- 定义现有实现的处置原则，明确哪些基础可保留，哪些必须重构。
- 先重构“主体模型、工具模型、审阅模型、能力供给模型”四类高杠杆偏差，再继续扩展业务能力。
- 最大化复用已经正确的基础设施，例如 workbench host、editor registry、schema runtime、tool registry、writeback adapters、permission precheck。

**Non-Goals:**
- 本变更不立即归档全部历史 OpenSpec changes。
- 本变更不重写所有部门业务模块。
- 本变更不要求一次性完成所有 UI 和运行时改造。
- 本变更不修改已归档任务历史，只建立新的纠偏执行基线。

## Decisions

### 1. 旧 backlog 采用“冻结 + 分类”治理，而不是直接删除

选择：
- 保留旧任务和旧变更作为历史输入。
- 新增纠偏重构变更与任务批次，作为新的默认执行入口。
- 在纠偏过程中逐项判断已有实现属于 `keep`、`rename/rebind`、`refactor`、`freeze/supersede`。

原因：
- 已有实现中有大量基础设施是正确资产，直接推倒会浪费。
- 当前问题不是“代码全错”，而是“叙事和边界错位”。

备选方案：
- 直接清空旧任务并重排。
未采用：会破坏历史记录，也不利于后续定位哪些实现能复用。

### 2. 主体模型优先级高于部门模型

选择：
- 后续所有配置、会话、观察、权限和 UI 文案，统一改为“用户主 Agent -> Sub-Agent”。
- 部门只保留为上下文边界、权限边界、能力边界和数据边界。

原因：
- 这是当前 PRD/架构/Epic 的根基。
- 如果主体模型不先收正，后续 MCP、Skill、消息、知识、写回都会继续做成“部门 Agent”。

备选方案：
- 保留现有部门化 Sub-Agent mock，只在文档层解释。
未采用：会持续误导实现和测试。

### 3. Tool Calling 2.0 采用“重绑和限权”而不是“推翻现有 runtime”

选择：
- 保留现有 `toolRegistry`、descriptor、permission precheck、result normalization、executor 等基础。
- 通过重命名样例、更新默认分层、下放受限工具、增加平台工具分组来纠偏。

原因：
- `src/features/session/tools/*` 已经具备可复用基础。
- 现阶段问题主要是默认心智和展示样例，而非注册/执行框架本身。

备选方案：
- 重新实现一套工具运行时。
未采用：收益低，重构成本高。

### 4. 审阅式写回优先复用现有 writeback adapters

选择：
- 复用 `formWritebackAdapter.ts`、`detailSectionWriteback.ts`、`editorTemplateWriteback.ts`、`workbenchCardWriteback` 等现有写回基础。
- 在其上统一抽象“候选改动包”“变更清单”“用户接受/拒绝”边界。

原因：
- 现有适配器已经证明页面写回基础存在。
- 缺的不是底层 apply 逻辑，而是统一 review contract 和 UI 表达。

备选方案：
- 新建完全独立的 staged-change runtime。
未采用：会重复建设并增加迁移复杂度。

### 5. 平台内置 Skills 基线先从配置与展示入口落地

选择：
- 先在 Skill 配置、能力状态、运行时候选能力模型中显式区分：
  - platform builtin
  - department builtin
  - user installed
- 再逐步把默认内置 Skills 接到真实运行时。

原因：
- 当前最大问题是“平台只有 Skill 兼容和安装心智，没有平台默认能力心智”。
- 先把入口和来源模型立住，可以减少后面继续把平台做成纯扩展容器。

## Risks / Trade-offs

- [旧变更数量过多，治理成本高] → 先冻结默认执行入口，只为实际受影响的变更做 keep/refactor/supersede 分类。
- [UI 表层先改但状态模型没跟上] → 先建立共享的主 Agent/Sub-Agent state contract，再连接各设置页。
- [writeback 语义与审批语义混淆] → 将“审批 reject”和“候选改动 reject”明确区分为不同域模型。
- [测试样例继续强化旧默认值] → 同步重写 ToolHistory、Observability、Sub-Agent mock 数据与断言。
- [未来执行仍误用旧 task.json] → 单独创建纠偏任务批次文件，并在最终输出中明确其优先级。

## Migration Plan

1. 建立纠偏重构 OpenSpec 变更和任务批次。
2. 盘点已完成实现与未归档变更，形成 keep/refactor/freeze/supersede 清单。
3. 先处理主体模型和工具模型，再处理审阅式写回和能力供给。
4. 将 mock-heavy 设置页逐步接入共享状态与真实运行时。
5. 完成后，再决定哪些旧 OpenSpec changes 应归档、哪些应标记 superseded。

## Open Questions

- 纠偏任务未来是否要继续并回 `task.json`，还是长期使用独立的 `task-course-correction.json`。
- 旧的未归档 OpenSpec 变更是否需要批量补一个 superseded 标记策略。
- 平台内置 Skills 的第一批真实实现范围是否只做平台级，还是同步带上招投标/合同/纪要三个高频领域。
