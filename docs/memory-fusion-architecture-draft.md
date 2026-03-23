# Memory Fusion Architecture Draft

## 1. 背景与范围

本草案定义 AI-Automated-office 的记忆系统融合架构，目标是把：
- `claude-mem` 的 Hook 生命周期采集能力
- `brain-mcp-cli` 的认知状态重建能力

统一落地到当前项目的 Agent Core 中，并与 PRD/Architecture/Epics 一致。

## 1.1 铁律对齐声明

- 实现主路径必须遵循 `Tauri + Rust`，记忆核心放在 `src-tauri`。  
- MVP 默认向量方案为 `sqlite-vec`，不以 LanceDB 为默认依赖。  
- LanceDB 仅作为 Post-MVP 可选扩展适配，不影响当前迭代交付。  
- 业务语义坚持 PRD 三层记忆模型（L1/L2/L3），技术四层仅用于实现分解。  

## 2. 设计原则

1. Rust-First：核心实现放在 `src-tauri`。  
2. Local-First：本地优先存储，后续可增量同步。  
3. Non-Blocking：Hook 失败不阻塞主链路。  
4. Tenant-Safe：租户、插件、会话三元隔离。  
5. Progressive Retrieval：按 token 预算渐进式披露。  

## 2.1 三层业务模型与四层实现模型映射

| 业务层（PRD） | 实现层（技术） | 对应能力 |
|---|---|---|
| L1 个人记忆 | Raw + Summary + Cognitive | 会话、偏好、关键事实 |
| L2 企业知识库 | Raw + Vector + Summary | 租户共享知识与检索 |
| L3 图记忆（Post-MVP） | Cognitive 扩展 + 图谱后端 | 实体关系与推理 |

约束：四层实现模型不得改变三层业务权限边界。

## 3. 逻辑架构

### 3.1 Ingestion Layer（摄入层）

组件：
- HookRegistry
- HookDispatcher
- HookHandlers

职责：
- 捕获生命周期事件
- 执行预处理（噪声过滤、隐私剥离、领域分类）
- 异步入队，避免阻塞响应

事件：
- SessionStart
- UserPromptSubmit
- PostToolUse
- Stop
- SessionEnd

### 3.2 Storage Layer（存储层）

MVP：
- SQLite（会话、消息、观察、摘要、认知状态）
- FTS5（全文检索）
- sqlite-vec（嵌入式向量检索）

Post-MVP：
- 向量检索层（LanceDB 或等价）

关键要求：
- 表结构全部包含 `tenant_id`、`plugin_id`、`session_key`
- 所有检索接口默认附加租户过滤

### 3.3 Cognitive Layer（认知层）

能力：
- 领域状态建模（DomainState）
- 思维阶段识别（thinking_stage）
- 思维轨迹维护（ThinkingTrajectory）
- 切换成本计算（SwitchingCost）

输出接口：
- `tunnel_state(domain)`
- `thinking_trajectory(session_key)`
- `switching_cost(from_domain, to_domain)`

### 3.4 Retrieval Layer（检索层）

检索策略：
- 索引层：返回简要条目（低 token）
- 时间线层：返回前后文
- 详情层：返回完整内容

融合策略（Post-MVP）：
- 全文检索 + 语义检索
- RRF 融合与可选重排

### 3.5 Tool Layer（工具层）

MVP 工具：
- `agent_memory_search`
- `agent_memory_update`
- `agent_cognitive_tunnel_state`

要求：
- 工具命名、权限、审计对齐现有规则
- 高风险操作走审批路径

## 4. 物理模块映射

建议目录：

`src-tauri/src/agent/memory/`
- `mod.rs`
- `types.rs`
- `hooks/`
- `storage/`
- `retrieval/`
- `cognitive/`
- `tools/`
- `service.rs`

`src-tauri/src/commands/`
- `memory.rs`（Tauri 命令桥接）

前端：
- `src/features/agent/components/MemoryInspector.tsx`
- `src/features/settings/components/MemoryConfig.tsx`

## 5. 数据模型（MVP）

### 5.1 主表

- `memory_sessions`
- `memory_messages`
- `memory_observations`
- `memory_summaries`
- `memory_cognitive_states`

### 5.2 索引

- `idx_{table}_tenant_plugin_session`
- `idx_{table}_created_at`
- FTS5 虚拟表与触发器同步

## 5.3 权限与隔离硬约束

- 每条记录必须绑定 `tenant_id`、`plugin_id`、`session_key`、`user_id`。  
- 个人记忆查询必须附带用户隔离条件。  
- 企业知识查询必须附带租户隔离条件。  
- Sub-Agent 记忆访问必须遵循独立隔离策略（FR923）。  
- 所有跨层读取记录审计日志。  

## 6. 执行流程（端到端）

1. 用户请求进入会话。  
2. `SessionStart` Hook 加载相关记忆并注入上下文。  
3. 对话与工具调用期间由 `PostToolUse` 持续记录观察。  
4. 结束阶段由 `Stop` 生成摘要并更新认知状态。  
5. `memory_search` 与 `tunnel_state` 对后续轮次提供上下文支持。  

## 7. 非功能与治理

### 7.1 性能目标
- 本地检索 P95 < 200ms
- 状态重建 < 3s

### 7.2 稳定性目标
- Hook 异常不影响主链路
- 异步任务具备重试与超时机制

### 7.3 安全目标
- 数据库级租户隔离
- 敏感数据摄入剥离
- 全量审计

## 8. 分阶段实施计划

### Phase 1（基础）
- SQLite/FTS5
- sqlite-vec
- Hook 框架
- `agent_memory_search`

### Phase 2（核心）
- observation/summary pipeline
- `agent_memory_update`

### Phase 3（认知）
- 认知状态管理
- `agent_cognitive_tunnel_state`
- 轨迹与切换成本

### Phase 4（优化）
- 向量检索
- 混合检索融合
- 指标监控与调优

## 9. 风险与缓解

1. 技术栈漂移（Node/Bun 方案与 Rust 主路径冲突）  
- 缓解：核心逻辑全部 Rust，实现语言单一化。

2. 向量层引入过早导致复杂度过高  
- 缓解：MVP 不强依赖向量层，先保证全文检索闭环。

3. 记忆污染（低价值或敏感信息入库）  
- 缓解：摄入预处理 + 重要性阈值 + 隐私剥离。

4. 多租户串读风险  
- 缓解：统一查询守卫 + 集成测试 + 审计追踪。

## 10. 验收标准（架构级）

1. 可完整跑通 “采集-存储-检索-注入-重建” 主链路。  
2. 三个 MVP 工具可用并通过权限/审计检查。  
3. 多租户隔离测试通过。  
4. 性能指标达到目标阈值。  

## 11. FR 对齐清单

- FR14-4 / FR14-8 / FR14-9 / FR14-10 / FR14-11 / FR14-12  
- FR260-FR334（记忆层系统）  
- FR923（Sub-Agent 独立记忆隔离）  
