# Agent模块unwrap消除

## Overview

消除Agent模块中的unwrap()滥用问题，将200+处unwrap改为?或match错误处理，避免运行时panic。

## Motivation

代码扫描发现Agent模块中有200+处使用`.unwrap()`而无错误处理：
- 当数据不符合预期时会直接panic
- 影响用户体验，可能导致应用崩溃
- 违反Rust错误处理最佳实践

## Files to Modify

### Backend Files
- `src-tauri/src/agent/subagent/manager.rs` - Arc::cloneunwrap
- `src-tauri/src/agent/failover.rs` - providers.get_mut().unwrap()
- `src-tauri/src/agent/routing.rs` - and_hms_opt().unwrap()
- `src-tauri/src/agent/monitoring.rs` - 密集unwrap操作
- `src-tauri/src/agent/tools/browser.rs` - read().unwrap()
- `src-tauri/src/agent/tools/registry.rs` - lock().unwrap()
- `src-tauri/src/agent/subagent/personal_loader.rs` - 大量unwrap
- `src-tauri/src/agent/context_compression.rs` - 部分unwrap
- `src-tauri/src/agent/correction.rs` - 部分unwrap

## Specification

### 1. 建立统一错误类型

创建 `src-tauri/src/agent/error.rs`:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AgentError {
    #[error("Subagent not found: {0}")]
    SubagentNotFound(String),
    
    #[error("Provider not available: {0}")]
    ProviderNotAvailable(String),
    
    #[error("Routing error: {0}")]
    RoutingError(String),
    
    #[error("Tool execution error: {0}")]
    ToolExecutionError(String),
    
    #[error("Registry error: {0}")]
    RegistryError(String),
    
    #[error("Lock error: {0}")]
    LockError(String),
    
    #[error("Parse error: {0}")]
    ParseError(String),
    
    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
    
    #[error("Database error: {0}")]
    DatabaseError(String),
}
```

### 2. unwrap消除模式

**模式1: Option处理**
```rust
// 之前
let value = map.get(key).unwrap();

// 之后
let value = map.get(key)
    .ok_or(AgentError::NotFound(format!("key {} not found", key)))?;
```

**模式2: Result处理**
```rust
// 之前
let value = result.unwrap();

// 之后
let value = result?;
```

**模式3: lock()处理**
```rust
// 之前
let data = data.lock().unwrap();

// 之后
let data = data.lock()
    .map_err(|_| AgentError::LockError("Failed to acquire lock".to_string()))?;
```

### 3. 优先级排序

按影响范围从高到低处理：

1. **p0_failsafe**: 会导致panic的核心路径
2. **p1_improved**: 可改进但不紧急
3. **p2_defer**: 可延后的测试文件

---

## Testing

1. 运行 `cargo clippy -- -D warnings`
2. 运行 `cargo test`
3. 手动测试关键路径
