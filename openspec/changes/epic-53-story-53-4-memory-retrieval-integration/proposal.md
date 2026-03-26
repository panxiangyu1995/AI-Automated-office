# Proposal: 记忆检索与注入集成

## 变更类型
- [x] 重构 (refactor)

## 背景

Agent 需要在执行任务时利用历史对话中积累的个人记忆，包括用户偏好、历史任务、常用操作等信息。目前记忆系统（Epic 6）已提供记忆存储和检索能力，但尚未与 Agent 执行流程深度集成。

需要实现记忆检索与注入集成，在 Agent 执行前自动检索相关记忆并注入到提示词上下文，实现记忆的主动应用，让 Agent 能够"记住"用户的历史偏好和上下文。

## 目标

实现记忆检索与注入集成，满足以下验收标准：

1. 集成 KnowledgeRetrieval 到 Agent 执行流程
2. 实现会话启动时的记忆预加载
3. 实现用户输入时的相关记忆检索
4. 添加记忆注入的优先级排序
5. 实现记忆来源的追踪与展示

## 范围

### 包含
- 创建 `src-tauri/src/agent/memory/mod.rs` 模块
- 创建 `MemoryInjector` Rust 结构体
- 实现会话启动时的记忆预加载逻辑
- 实现基于用户输入的记忆检索逻辑
- 实现记忆优先级排序（时间衰减、相关性、频率）
- 实现记忆来源追踪
- 实现记忆元数据注入
- 与 Agent 执行流程集成
- 与 PromptBuilder 集成（Story 53.1）
- Tauri 命令暴露：`invoke_get_relevant_memories`, `invoke_preload_session_memories`

### 不包含
- 记忆存储实现（由 Epic 6 负责）
- 记忆向量检索实现（由 Epic 6 负责）
- 前端 UI 展示（由其他 Story 负责）

## 影响范围

### 前端
- 需要显示记忆来源信息（可选）
- 可选：显示"记忆已应用"提示

### 后端
- 新增 Rust 模块：`src-tauri/src/agent/memory/mod.rs`
- 新增 Rust 模块：`src-tauri/src/agent/memory/injector.rs`
- 新增 Rust 模块：`src-tauri/src/agent/memory/prioritizer.rs`
- 修改：`src-tauri/src/agent/session/manager.rs` 集成记忆预加载
- 修改：`src-tauri/src/agent/prompt/mod.rs` 集成记忆注入

### 数据库
- 无直接数据库变更
- 通过接口调用记忆存储（由 Epic 6 提供）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 记忆检索接口未就绪 | 中 | 中 | 使用 Mock 接口开发，后续对接 |
| 记忆注入过多导致上下文膨胀 | 中 | 高 | 实现严格的优先级排序和数量限制 |
| 记忆相关性判断不准确 | 中 | 中 | 配置相关性阈值，提供手动调整 |
| 隐私信息泄露 | 低 | 高 | 实现敏感信息过滤 |

## 依赖

### 前置依赖
- Story 53.1 (提示词构建器) - 依赖其提供的记忆注入接口
- Story 6.3 (个人记忆检索)
- Story 9.1 (知识库检索)
- Task 101 (后端 Rust Agent 基础架构)

### 后置依赖
- Epic 54 业务模块 - 依赖记忆上下文增强

## 实现步骤

1. **创建记忆模块结构**
   - 创建 `src-tauri/src/agent/memory/` 目录
   - 创建 `mod.rs` 模块入口
   - 创建 `injector.rs` 实现记忆注入
   - 创建 `prioritizer.rs` 实现优先级排序

2. **实现记忆注入器**
   - 定义 `MemoryItem` 和 `MemoryContext` 结构
   - 实现基于用户输入的记忆检索
   - 实现记忆格式化

3. **实现优先级排序**
   - 实现时间衰减算法
   - 实现相关性评分
   - 实现使用频率加权
   - 实现综合排序

4. **实现记忆预加载**
   - 实现会话启动时的记忆预加载
   - 实现上下文初始化

5. **实现记忆来源追踪**
   - 定义记忆来源元数据结构
   - 实现来源信息注入

6. **集成到 Agent 执行流程**
   - 在会话管理器中集成记忆预加载
   - 在 PromptBuilder 中集成记忆注入

7. **暴露 Tauri 命令**
   - 实现 `invoke_get_relevant_memories` 命令
   - 实现 `invoke_preload_session_memories` 命令
