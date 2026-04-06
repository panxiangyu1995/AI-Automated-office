# Proposal: Complete Agent Tools Integration

## Why

当前 AI-Automated-office 的 Agent Tools 系统虽然已实现部分新模块（memory、sessions、media、automation），但这些模块尚未完全集成到工具系统中。主要问题包括：

1. **模块未在 mod.rs 中注册**：`memory`、`sessions`、`media`、`automation` 模块已在 `pipeline.rs` 中被导入，但 `mod.rs` 中缺少相应的 `pub mod` 声明
2. **模块依赖未声明**：新模块中使用了 `descriptor` 和 `pipeline` 中的类型，但可能缺少必要的依赖导入
3. **集成测试缺失**：需要完整的集成测试来验证各模块之间的交互
4. **与现有 OpenClaw 风格 Profile 系统的集成**：需要确保新模块与已实现的 Profile 驱动工具筛选机制完全兼容

## What Changes

### 1. 模块注册修复

在 `src-tauri/src/agent/tools/mod.rs` 中添加缺失的模块声明：

```rust
pub mod memory;      // 语义记忆搜索和检索
pub mod sessions;     // 完整会话生命周期管理
pub mod media;        // 图片理解和语音合成
pub mod automation;   // 定时任务调度
```

### 2. 模块间依赖梳理

确保各模块正确导入所需类型：
- `descriptor` 模块中的 `ToolDescriptor`、`ToolCategory`、`ToolCapabilities` 等
- `pipeline` 模块中的 `ToolExecutor`、`ToolExecutionContext`、`ToolExecutionError` 等

### 3. Profile 集成

将新工具注册到 Profile 系统：

| Profile | 新增工具 |
|---------|----------|
| `minimal` | `session_status` |
| `coding` | `memory_search`, `memory_get`, `sessions_list`, `sessions_history` |
| `messaging` | `sessions_list`, `sessions_history`, `sessions_send`, `session_status` |
| `full` | 所有工具 |

### 4. 测试补充

- 单元测试：各模块已有部分测试，需补充边界情况
- 集成测试：验证模块间的正确交互
- 端到端测试：验证通过 Agent 调用完整流程

## Capabilities

### New Capabilities

| Capability ID | 描述 | Profile |
|:--------------|:-----|:--------|
| `memory-tools` | 语义记忆搜索和检索 | coding |
| `sessions-tools` | 完整会话生命周期管理 | messaging |
| `media-tools` | 图片理解和语音合成 | coding |
| `automation-tools` | 定时任务调度 | coding |

## Impact

### 后端 (Rust/Tauri)

**修改文件**：
- `src-tauri/src/agent/tools/mod.rs` - 添加模块声明

**验证文件**：
- `src-tauri/src/agent/tools/memory/mod.rs`
- `src-tauri/src/agent/tools/sessions/mod.rs`
- `src-tauri/src/agent/tools/media/mod.rs`
- `src-tauri/src/agent/tools/automation/mod.rs`
- `src-tauri/src/agent/tools/pipeline.rs`

### 前端

无直接变更

## Alternatives Considered

### Alternative 1: 保持现状，不注册新模块

**缺点**: 新工具无法通过标准工具注册表被发现和使用

### Alternative 2: 重写所有模块

**缺点**: 浪费已有实现，延长开发周期

### Selected: 渐进式集成

**优点**:
1. 保留已有实现
2. 最小化代码变更
3. 快速验证功能
