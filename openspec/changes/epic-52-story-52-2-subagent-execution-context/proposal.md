# Proposal: Sub-Agent执行上下文 - 隔离环境

## 变更类型
- [x] 新功能 (new)

## 背景

在多智能体Agent系统中，主Agent需要能够调用多个专业化的Sub-Agent来协同完成复杂任务。每个Sub-Agent是为特定领域（如财务分析、客服对话、数据查询等）设计的专业助手，它们必须在独立的执行上下文中运行，以确保：

1. **隔离性**：Sub-Agent之间的记忆、工具集、权限配置互不干扰，防止数据泄露和权限混乱
2. **可配置性**：主Agent可以根据任务需求动态配置Sub-Agent的执行上下文
3. **一致性**：Sub-Agent的执行结果可以正确返回并整合到主Agent的上下文中

当前系统缺少Sub-Agent执行上下文的隔离机制，需要创建`SubAgentExecutionContext`来实现这一核心能力。

## 目标

实现Sub-Agent执行上下文隔离环境，使主Agent能够安全、可控地调用多个Sub-Agent，具体目标包括：

- 创建`SubAgentExecutionContext`类作为Sub-Agent执行的核心抽象
- 实现基于配置的记忆注入机制，控制Sub-Agent可访问的记忆范围
- 实现工具集的动态过滤，确保Sub-Agent仅能使用授权的工具
- 实现权限上下文的隔离与继承，保证安全边界清晰
- 创建Sub-Agent专用的系统提示词构建器，实现角色和能力的定制

## 范围

### 包含

- `SubAgentExecutionContext`核心类的设计与实现
- Sub-Agent独立记忆注入机制（基于配置的记忆范围）
- 工具集的动态过滤（仅允许配置的工具）
- 权限上下文的隔离与继承机制
- Sub-Agent专用的系统提示词构建器（`SubAgentSystemPromptBuilder`）
- Rust后端实现（`src-tauri/src/agent/subagent/context.rs`）
- 前端类型定义与接口

### 不包含

- Sub-Agent的创建和注册流程（由Story 52.1覆盖）
- Sub-Agent嵌套调用控制逻辑（由Story 52.3覆盖）
- Sub-Agent结果返回机制（由Story 52.4覆盖）
- 前端UI界面实现（由其他Story覆盖）

## 影响范围

### 前端

- **新增文件**：
  - `src/features/agent/types/subagent-context.types.ts` - SubAgentExecutionContext类型定义
  - `src/features/agent/components/SubAgentContextConfig.tsx` - 上下文配置组件（可选）
- **修改文件**：
  - `src/features/agent/types/index.ts` - 导出SubAgent相关类型
- **影响范围**：前端定义Sub-Agent上下文的类型接口，供后续Story使用

### 后端

- **新增文件**：
  - `src-tauri/src/agent/subagent/mod.rs` - SubAgent子模块入口
  - `src-tauri/src/agent/subagent/context.rs` - SubAgentExecutionContext核心实现
  - `src-tauri/src/agent/subagent/memory.rs` - 记忆注入实现
  - `src-tauri/src/agent/subagent/tools.rs` - 工具过滤实现
  - `src-tauri/src/agent/subagent/permission.rs` - 权限上下文实现
  - `src-tauri/src/agent/subagent/prompt.rs` - 系统提示词构建器
  - `src-tauri/src/agent/subagent/commands.rs` - Tauri命令接口
- **修改文件**：
  - `src-tauri/src/agent/mod.rs` - 添加SubAgent子模块导出
  - `src-tauri/src/agent/commands.rs` - 添加SubAgent相关命令
- **影响范围**：后端Sub-Agent执行上下文的核心逻辑实现

### 数据库

- **变更说明**：本Story不涉及数据库直接变更
- **间接影响**：如启用记忆存储，需依赖现有的memory模块数据表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 后端基础设施缺失 | 高 | 高 | Task 101已完成后端基础架构创建，本Story依赖其提供的基础模块 |
| 记忆注入范围控制不严 | 中 | 高 | 实现严格的记忆范围白名单机制，确保只注入授权的记忆片段 |
| 工具过滤绕过 | 中 | 高 | 在工具执行前进行二次权限校验，确保工具使用符合上下文配置 |
| 循环依赖导致栈溢出 | 低 | 高 | 在嵌套调用控制Story中添加循环检测，本Story仅负责上下文隔离 |
| 配置错误导致Sub-Agent行为异常 | 中 | 中 | 提供配置验证机制，在执行前校验上下文配置的合法性 |

## 依赖

### 前置依赖

- **Story 52.1** (Sub-Agent路由引擎)：提供Sub-Agent的基本触发和选择机制
- **Story 21.18** (记忆模块接口定义)：提供记忆存储和检索的基础接口
- **Story 21.19** (权限模块接口定义)：提供权限检查的基础接口
- **Task 101** (后端Rust Agent基础架构)：提供`src-tauri/src/agent/`基础目录结构

### 后置依赖

- **Story 52.3** (Sub-Agent嵌套调用控制)：依赖本Story提供的上下文隔离机制
- **Story 52.4** (Sub-Agent结果汇总与回传)：依赖本Story创建的执行上下文
- **Story 52.5** (Sub-Agent执行监控与诊断)：依赖本Story提供的执行上下文信息

### 同期依赖

- **Story 52.1**：Sub-Agent路由与执行上下文的初始化需协同工作

## 实现步骤

1. **创建SubAgentExecutionContext核心类**
   - 定义上下文数据结构（记忆范围、工具列表、权限级别等）
   - 实现上下文的序列化和反序列化
   - 实现上下文验证和配置检查

2. **实现Sub-Agent独立的记忆注入**
   - 基于配置的记忆范围过滤检索记忆
   - 实现记忆片段的注入和裁剪
   - 支持记忆注入的前缀标记

3. **实现工具集的动态过滤**
   - 基于配置的工具白名单过滤可用工具
   - 实现工具描述符的脱敏处理
   - 支持工具参数的默认填充

4. **实现权限上下文的隔离与继承**
   - 创建独立的权限上下文实例
   - 实现权限的继承和覆盖机制
   - 添加权限边界检查

5. **创建Sub-Agent专用的系统提示词构建器**
   - 实现角色定义的系统提示词组装
   - 支持能力描述和限制说明的注入
   - 实现上下文信息的自动注入
