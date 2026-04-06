# Design: Complete Agent Tools Integration

## Overview

本变更旨在将已实现的 `memory`、`sessions`、`media`、`automation` 模块完全集成到工具系统中，确保它们能够通过标准工具注册表被发现、注册和使用。

## Architecture

### Current State

```
src-tauri/src/agent/tools/
├── mod.rs                    # [TO MODIFY] 需要添加新模块声明
├── pipeline.rs               # [OK] 已导入并注册所有模块
├── descriptor.rs             # [OK] 提供类型定义
├── registry.rs               # [OK] 提供注册表功能
├── profile.rs                # [OK] 提供 Profile 工具筛选
├── memory/                   # [EXISTS] 语义记忆模块
│   ├── mod.rs
│   ├── memory_search.rs
│   └── memory_get.rs
├── sessions/                 # [EXISTS] 会话管理模块
│   ├── mod.rs
│   ├── sessions_list.rs
│   ├── sessions_history.rs
│   ├── sessions_send.rs
│   ├── sessions_spawn.rs
│   ├── sessions_yield.rs
│   └── session_status.rs
├── media/                    # [EXISTS] 媒体处理模块
│   ├── mod.rs
│   ├── image_understand.rs
│   └── tts_speak.rs
└── automation/               # [EXISTS] 自动化模块
    ├── mod.rs
    ├── cron_schedule.rs
    ├── cron_list.rs
    └── cron_cancel.rs
```

### Target State

所有模块通过 `mod.rs` 统一导出，并通过 `pipeline.rs` 中的注册函数进行注册。

## Implementation Details

### 1. 修改 mod.rs

在 `src-tauri/src/agent/tools/mod.rs` 中添加：

```rust
//! Tool execution pipeline for the Agent runtime.

pub mod browser;
pub mod core;
pub mod descriptor;
pub mod document;
pub mod enterprise;
pub mod filesystem;
pub mod finance;
pub mod memory;      // NEW
pub mod permission;
pub mod pipeline;
pub mod profile;
pub mod registry;
pub mod sensitivity;
pub mod sessions;    // NEW
pub mod media;       // NEW
pub mod automation;  // NEW
pub mod shell;
pub mod web;

pub use descriptor::*;
pub use pipeline::*;
pub use profile::*;
pub use registry::*;
```

### 2. 验证模块依赖

检查各模块的 `mod.rs` 文件，确保正确导入：

#### memory/mod.rs

```rust
use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::{ToolExecutionContext, ToolExecutionError, ToolExecutor};
use crate::agent::tools::registry::ToolRegistry;
```

#### sessions/mod.rs

```rust
use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;
```

#### media/mod.rs

```rust
use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;
```

#### automation/mod.rs

```rust
use crate::agent::tools::descriptor::{
    ToolCapabilities, ToolCategory, ToolDescriptor, ToolExecutionMode, ToolMetadata,
};
use crate::agent::tools::pipeline::ToolExecutor;
use crate::agent::tools::registry::ToolRegistry;
```

### 3. Profile 工具映射

在 `profile.rs` 中补充新工具到各 Profile：

```rust
// profile.rs 中的工具列表

const MINIMAL_TOOLS: &[&str] = &[
    "session_status",
    "system_get_app_version",
    // ... existing
];

const CODING_TOOLS: &[&str] = &[
    // ... existing
    "memory_search",
    "memory_get",
    "sessions_list",
    "sessions_history",
    "image_understand",
    "tts_speak",
    "cron_schedule",
    "cron_list",
    "cron_cancel",
];

const MESSAGING_TOOLS: &[&str] = &[
    // ... existing
    "sessions_list",
    "sessions_history",
    "sessions_send",
    "session_status",
];
```

### 4. 工具清单

| 工具 ID | 名称 | 类别 | Profile | 状态 |
|---------|------|------|---------|------|
| `memory_search` | Memory Search | Memory | coding | 已实现 |
| `memory_get` | Memory Get | Memory | coding | 已实现 |
| `sessions_list` | Sessions List | Session | messaging | 已实现 |
| `sessions_history` | Sessions History | Session | messaging | 已实现 |
| `sessions_send` | Sessions Send | Session | messaging | 已实现 |
| `sessions_spawn` | Sessions Spawn | Session | coding | 已实现 |
| `sessions_yield` | Sessions Yield | Session | coding | 已实现 |
| `session_status` | Session Status | Session | minimal | 已实现 |
| `image_understand` | Image Understand | Media | coding | 已实现 |
| `tts_speak` | TTS Speak | Media | coding | 已实现 |
| `cron_schedule` | Cron Schedule | Automation | coding | 已实现 |
| `cron_list` | Cron List | Automation | coding | 已实现 |
| `cron_cancel` | Cron Cancel | Automation | coding | 已实现 |

## Error Handling

### 模块加载失败

如果模块加载失败，应记录错误日志并继续加载其他模块：

```rust
// mod.rs
match register_memory_tools(&mut registry, &mut executors) {
    Ok(_) => info!("Memory tools registered successfully"),
    Err(e) => error!("Failed to register memory tools: {}", e),
}
```

### 工具执行失败

各工具的 Executor 应返回标准化的错误：

```rust
ToolExecutionError {
    code: ToolErrorCode::ExecutionError,
    message: "...".to_string(),
    details: None,
    recoverable: true,
    retryable: true,
}
```

## Testing Strategy

### 单元测试

每个工具文件已包含单元测试：
- `memory_search.rs`: `test_cosine_similarity`, `test_mock_memory_store_search`, `test_memory_search_executor`
- `sessions_list.rs`: 需补充

### 集成测试

创建 `tests/tools/integration_tests.rs`：

```rust
#[tokio::test]
async fn test_tool_pipeline_with_memory_tools() {
    // 验证 memory 工具通过 pipeline 正确注册和执行
}

#[tokio::test]
async fn test_tool_pipeline_with_sessions_tools() {
    // 验证 sessions 工具通过 pipeline 正确注册和执行
}

#[tokio::test]
async fn test_tool_pipeline_with_media_tools() {
    // 验证 media 工具通过 pipeline 正确注册和执行
}

#[tokio::test]
async fn test_tool_pipeline_with_automation_tools() {
    // 验证 automation 工具通过 pipeline 正确注册和执行
}
```

### 配置文件测试

```rust
#[test]
fn test_memory_tool_descriptor() {
    // 验证 memory 工具描述符正确
}

#[test]
fn test_sessions_tool_descriptors() {
    // 验证所有 sessions 工具描述符正确
}
```

## Security Considerations

### 权限检查

所有工具都定义了所需的权限：

| 工具 | 权限 |
|------|------|
| `memory_search` | `memory:read` |
| `memory_get` | `memory:read` |
| `sessions_list` | `sessions:read` |
| `sessions_history` | `sessions:read` |
| `sessions_send` | `sessions:write` |
| `sessions_spawn` | `sessions:admin` |
| `sessions_yield` | `sessions:admin` |
| `session_status` | `sessions:read` |
| `image_understand` | `media:read` |
| `tts_speak` | `media:write` |
| `cron_schedule` | `automation:write` |
| `cron_list` | `automation:read` |
| `cron_cancel` | `automation:write` |

### 敏感度评估

高风险操作需要确认：
- `sessions_send`: `requires_confirmation: true`
- `sessions_spawn`: `requires_confirmation: true`
- `sessions_yield`: `requires_confirmation: true`
- `cron_cancel`: `requires_confirmation: true`
