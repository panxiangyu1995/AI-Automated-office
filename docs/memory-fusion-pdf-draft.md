# AI-Automated-office 记忆系统融合方案（PDF草案）

## 1. 文档目的

本草案用于定义 AI-Automated-office 项目中记忆系统的融合方向：  
- 借鉴 `claude-mem` 的无感 Hook 生命周期采集机制  
- 借鉴 `brain-mcp-cli` 的类人脑认知状态重建设计  
- 在现有项目技术栈下以 Rust-First 方式落地

## 2. 融合目标

1. 无感采集：不改变主要交互流程，自动捕获关键上下文。  
2. 认知连续：不仅保存“发生了什么”，还可重建“当时在想什么”。  
3. 检索高效：支持全文检索 + 语义检索 + 渐进式披露。  
4. 安全合规：全程遵循多租户隔离、敏感数据处理和审计链路。  

## 2.1 铁律对齐声明（必须）

本草案严格对齐项目铁律文档（PRD/Architecture/Epics）：

- 技术主线：`Tauri + Rust`，记忆核心运行在 `src-tauri`。  
- MVP 默认向量方案：`sqlite-vec`（本地嵌入式），不以 LanceDB 作为默认实现。  
- LanceDB 仅作为 Post-MVP 可选扩展，不影响当前主路径交付。  
- 记忆能力遵循 PRD 三层业务模型：L1 个人记忆 / L2 企业知识库 / L3 图记忆（Post-MVP）。  

## 3. 架构定位

记忆系统作为 Agent 四层架构中的 Memory Layer，实现以下核心能力：

- 生命周期事件摄入（Hook）
- 结构化存储与摘要
- 认知状态管理
- 渐进式检索与上下文注入
- 记忆工具暴露（agent_memory_search / agent_memory_update / agent_cognitive_tunnel_state）

## 4. 三层业务模型与四层实现模型映射

| 业务层（铁律） | 实现层（本草案） | 说明 |
|---|---|---|
| L1 个人记忆层 | L1 原始数据 + L3 摘要 + L4 认知状态 | 用户会话、偏好、关键事实 |
| L2 企业知识库层 | L1 原始数据 + L2 向量 + L3 摘要 | 部门/租户共享知识与检索 |
| L3 图记忆层（Post-MVP） | L4 认知状态扩展 + 图谱存储扩展 | 实体关系与推理能力 |

说明：  
四层模型是技术实现分层，不替代 PRD 定义的三层业务分层。

## 5. 融合设计（核心）

### 5.1 借鉴 Claude-Mem：无感 Hook

MVP 生命周期钩子：
- `SessionStart`
- `UserPromptSubmit`
- `PostToolUse`
- `Stop`
- `SessionEnd`

设计原则：
- Hook 异步执行，失败降级，不阻塞主流程
- 敏感信息在摄入层剥离，避免入库污染
- 统一事件结构，便于审计和观测

### 5.2 借鉴 Brain-MCP-CLI：类人脑认知层

保留并适配以下认知能力：
- `tunnel_state`: 领域认知状态重建
- `thinking_trajectory`: 思维轨迹回放
- `switching_cost`: 上下文切换成本评估

认知状态核心字段：
- thinking_stage
- open_questions
- decisions
- domain_state

## 6. 存储与检索策略

### 6.1 MVP 存储（优先）

- SQLite 主存储
- FTS5 全文索引
- sqlite-vec 向量检索（默认）
- 结构化摘要表

### 6.2 Post-MVP 扩展

- 向量检索层（如 LanceDB 或等价方案）
- 混合检索 RRF 融合

### 6.3 渐进式检索

- Index 层：紧凑结果，低 token
- Timeline 层：时序上下文
- Detail 层：按需展开全文

## 7. 项目落地映射（Rust-First）

建议落地目录（后端）：

`src-tauri/src/agent/memory/`
- `hooks/`
- `storage/`
- `retrieval/`
- `cognitive/`
- `tools/`

前端建议目录：

`src/features/agent/components/`
- `MemoryInspector.tsx`（调试与可视化）

`src/features/settings/components/`
- `MemoryConfig.tsx`（配置管理）

## 8. MVP 工具范围（命名对齐 ADR-017）

首批仅实现：
1. `agent_memory_search`
2. `agent_memory_update`
3. `agent_cognitive_tunnel_state`

说明：先收敛工具数量，确保稳定性与可验证性，再扩展到更多认知工具。

## 9. 多租户与安全约束（硬约束）

每条记忆数据必须包含：
- `tenant_id`
- `plugin_id`
- `session_key`

约束要求：
- 查询必须带租户守卫
- 敏感字段支持脱敏策略
- 高风险动作进入审批与审计链路
- 个人记忆仅用户本人可访问
- Sub-Agent 支持独立记忆隔离策略
- 记忆同步策略可配置（仅本地 / 本地优先+云端备份）

## 10. FR 对齐清单

本草案覆盖以下关键需求范围：

- FR14-4：三层记忆架构  
- FR14-8：本地嵌入式向量 + 云端独立服务双模式  
- FR14-9：本地优先存储与增量同步  
- FR14-10：记忆智能更新（ADD/UPDATE/DELETE/NONE）  
- FR14-11：混合搜索（向量 + BM25）  
- FR14-12：用户可查看和管理记忆  
- FR260-FR334：记忆层系统主需求  
- FR923：Sub-Agent 独立记忆隔离  

## 11. 分阶段实施建议

### Phase A（1-2周）
- SQLite + FTS5
- Hook 调度框架
- `agent_memory_search`

### Phase B（1-2周）
- Observation/Summary 管线
- `agent_memory_update`

### Phase C（1-2周）
- 认知状态管理
- `agent_cognitive_tunnel_state`
- 调试可视化

## 12. 验收指标（MVP）

- Hook 不阻塞主流程（失败降级率 100%）
- 检索 P95 < 200ms（本地）
- 状态重建耗时 < 3s
- 多租户零串读（隔离测试通过）

## 13. 结论

该融合方案在保持现有架构一致性的前提下，将“无感机制”与“类人脑机制”结合为统一记忆能力，可作为 AI-Automated-office Agent 系统的核心基础设施推进实施。
