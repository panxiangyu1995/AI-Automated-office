# Proposal: 提示词构建器 - 分层提示词整合

## 变更类型
- [x] 新功能 (new)

## 背景

当前 Agent 系统缺乏统一的提示词构建机制，系统提示词、角色提示词、个人记忆、企业知识库、错题集规则等分散管理，无法形成完整的上下文支撑体系。这导致 Agent 在执行任务时无法有效利用已积累的知识和经验。

需要创建 PromptBuilder 核心类，实现分层提示词加载策略，将上述各层信息统一整合到 Agent 的提示词上下文中，为 Agent 提供丰富的背景知识和执行指导。

## 目标

创建 PromptBuilder 核心类，实现分层提示词整合，满足以下验收标准：

1. 创建 PromptBuilder 核心类
2. 实现系统提示词与角色提示词的合并
3. 集成个人记忆（L1）到提示词上下文
4. 集成企业知识库（L2）检索结果
5. 实现错题集规则的自动注入

## 范围

### 包含
- 创建 `src-tauri/src/agent/prompt/mod.rs` 模块
- 创建 `PromptBuilder` Rust 结构体，实现分层提示词构建
- 实现系统提示词模板管理（基础指令、安全规则、格式要求）
- 实现角色提示词合并（多角色叠加、优先级处理）
- 集成个人记忆（L1）检索接口到提示词上下文
- 集成企业知识库（L2）检索结果到提示词上下文
- 实现错题集规则自动注入模块
- Tauri 命令暴露：`invoke_build_prompt` 命令

### 不包含
- 前端 UI 组件开发（由其他 Story 负责）
- 记忆存储实现（由 Epic 6 负责）
- 知识库检索实现（由 Epic 6 负责）
- 错题集存储实现（由 Epic 6 负责）

## 影响范围

### 前端
- 需要调用 Tauri 命令 `invoke_build_prompt` 获取构建后的提示词
- 需要集成 `useContextCompression` Hook（由 Story 53.2 扩展）

### 后端
- 新增 Rust 模块：`src-tauri/src/agent/prompt/mod.rs`
- 新增 Rust 模块：`src-tauri/src/agent/prompt/builder.rs`
- 新增 Rust 模块：`src-tauri/src/agent/prompt/layer.rs`
- 新增依赖：`promptcomparable`（如需要向量检索）

### 数据库
- 无直接数据库变更
- 通过接口调用记忆库和知识库（由 Epic 6 提供）

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101 提供基础架构，本 Story 依赖其完成 |
| 记忆/知识库接口未就绪 | 中 | 中 | 使用 Mock 接口进行初步开发，后续对接 |
| 提示词过长导致 Token 溢出 | 中 | 高 | 实现提示词长度监控，与 Story 53.2 上下文压缩联动 |
| 多层提示词优先级冲突 | 低 | 中 | 设计清晰的优先级规则，配置优先于自动 |

## 依赖

### 前置依赖
- Story 21.1 (用户对话上下文管理)
- Story 21.2 (对话状态维护)
- Story 6.1 (个人记忆存储)
- Story 6.2 (个人记忆检索)
- Story 6.6 (错题集存储)
- Task 101 (后端 Rust Agent 基础架构)

### 后置依赖
- Story 53.2 (上下文压缩触发与执行) - 依赖本 Story 提供的提示词构建能力
- Story 53.3 (错题集规则自动应用) - 依赖本 Story 的规则注入接口
- Story 53.4 (记忆检索与注入集成) - 依赖本 Story 的记忆集成接口

## 实现步骤

1. **创建 Rust 模块结构**
   - 创建 `src-tauri/src/agent/prompt/` 目录
   - 创建 `mod.rs` 模块入口
   - 创建 `layer.rs` 定义分层提示词结构

2. **实现 PromptBuilder 核心类**
   - 定义 `PromptLayer` 枚举（System、Role、MemoryL1、KnowledgeL2、CorrectionRule）
   - 定义 `PromptBuilder` 结构体
   - 实现分层构建逻辑

3. **实现系统提示词与角色提示词合并**
   - 实现系统提示词模板加载
   - 实现角色提示词叠加逻辑

4. **集成个人记忆（L1）**
   - 定义记忆检索接口
   - 实现记忆上下文注入

5. **集成企业知识库（L2）**
   - 定义知识库检索接口
   - 实现知识库结果注入

6. **实现错题集规则注入**
   - 定义规则检索接口
   - 实现规则提示词生成

7. **暴露 Tauri 命令**
   - 实现 `invoke_build_prompt` 命令
