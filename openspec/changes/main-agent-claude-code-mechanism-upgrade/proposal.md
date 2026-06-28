# Proposal: 主通用Agent机制升级 - 基于Claude Code研究

## Why

当前AI-Automated-office的主Agent缺乏多层次类型体系、精细的工具过滤、生命周期Hook机制和完善的进度追踪能力。根据Claude Code源码研究的差距分析，项目需要从"基础LLM调用"升级到"具备完整工具过滤、Hook系统和进度追踪的多层次Agent架构"，以满足PRD中FR400-FR505系列的功能需求，提升企业级Agent应用的可用性、安全性和可观测性。

## What Changes

### 新增功能

1. **内置Agent类型体系**
   - 定义主通用Agent的builtin类型：`general-purpose`（全功能）、`explore`（只读搜索）、`plan`（规划模式）、`verification`（验证模式）
   - 每个类型有独立的工具权限和系统提示

2. **工具过滤与权限系统**
   - 增强`ToolRegistry`，支持白名单/黑名单过滤
   - 定义`ToolPermission`枚举：`All`、`Whitelist(Vec<String>)`、`Blacklist(Vec<String>)`
   - 实现`ToolAccessPolicy`结构，包含权限和确认要求

3. **生命周期Hook系统**
   - 实现`AgentHook` trait，支持`on_tool_call`、`on_tool_result`、`on_error`等生命周期事件
   - 定义`HookContext`包含agent_id、tool_name、tool_input、messages等上下文信息
   - 支持多Hook注册和按优先级执行

4. **进度追踪系统**
   - 实现`ProgressUpdate`结构，包含task_id、status、tool_use_count、token_count、last_activity等
   - 定义`TaskStatus`枚举：`Pending`、`Running`、`Completed`、`Failed`、`Cancelled`
   - 支持实时进度推送和后台任务通知

5. **三层记忆系统适配**
   - 适配`MemoryScope`枚举：`User`、`Project`、`Local`
   - 实现`LayeredMemory`，支持按作用域加载记忆
   - 支持记忆文件截断（200行/25KB限制）

## Capabilities

### New Capabilities

- `builtin-agent-types`: 主通用Agent的内置类型体系，定义general-purpose/explore/plan/verification四种类型及其工具权限
- `tool-filtering`: 工具过滤与权限系统，支持白名单/黑名单模式，用于Plan模式只读限制和权限控制
- `agent-hooks`: 生命周期Hook机制，支持工具调用前后、错误处理等扩展点
- `progress-tracking`: 进度追踪系统，实时反馈任务执行状态和资源消耗
- `layered-memory`: 三层记忆系统适配，User/Project/Local作用域的记忆加载

### Modified Capabilities

- `tool-registry`: 现有工具注册表扩展，增加`filter_for_agent`方法支持按Agent类型过滤

## Impact

### 后端 (Rust/Tauri)

| 模块 | 影响 |
|------|------|
| `src-tauri/src/agent/` | 新增`builtin_agent/`目录实现内置Agent类型 |
| `src-tauri/src/agent/tools/registry.rs` | 扩展工具过滤能力 |
| `src-tauri/src/agent/` | 新增`hooks/`模块实现Hook机制 |
| `src-tauri/src/agent/monitoring.rs` | 扩展进度追踪能力 |
| `src-tauri/src/agent/memory/` | 适配三层记忆架构 |

### 前端

| 模块 | 影响 |
|------|------|
| `src/features/agent/` | Agent类型选择UI、进度展示组件 |

### 数据

- 新增`builtin_agent_types`配置表存储内置Agent类型定义
- 新增`agent_hooks`配置表存储Hook注册信息
- 新增`agent_progress`记录表存储进度数据

### 依赖

- 无新增外部依赖
- 复用现有的`monitoring_types.rs`、`memory/`模块

### 约束

- 仅适配主通用Agent，部门Agent机制暂不涉及
- Hook系统设计需考虑性能影响，避免过度调用
- 进度追踪需控制数据量，避免内存泄漏
