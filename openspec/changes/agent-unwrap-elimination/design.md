# 设计文档: Agent模块-unwrap消除

## 1. 问题分析

### 1.1 现状

代码扫描发现 Agent 模块中有 200+ 处使用 `.unwrap()` 而无错误处理：

| 文件 | 问题 | 严重性 |
|------|------|--------|
| manager.rs | Arc::clone unwrap | 高 |
| failover.rs | providers.get_mut unwrap | 高 |
| routing.rs | and_hms_opt unwrap | 中 |
| monitoring.rs | 密集 unwrap 操作 | 高 |
| browser.rs | read unwrap | 高 |
| registry.rs | lock unwrap | 高 |
| personal_loader.rs | 大量 unwrap | 高 |

### 1.2 影响

- 当数据不符合预期时会直接 panic
- 影响用户体验，可能导致应用崩溃
- 违反 Rust 错误处理最佳实践

## 2. 解决方案

### 2.1 统一错误类型

创建 `src-tauri/src/agent/error.rs`:

```rust
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

### 2.2 unwrap 消除模式

**模式 1: Option 处理**

```rust
// 之前
let value = map.get(key).unwrap();

// 之后
let value = map.get(key)
    .ok_or(AgentError::NotFound(format!("key {} not found", key)))?;
```

**模式 2: Result 处理**

```rust
// 之前
let value = result.unwrap();

// 之后
let value = result?;
```

**模式 3: lock() 处理**

```rust
// 之前
let data = data.lock().unwrap();

// 之后
let data = data.lock()
    .map_err(|_| AgentError::LockError("Failed to acquire lock".to_string()))?;
```

## 3. 修改计划

### 3.1 优先级排序

按影响范围从高到低处理：

| 优先级 | 文件 | 说明 |
|--------|------|------|
| P0 | manager.rs, failover.rs | 核心路径，影响稳定性 |
| P1 | routing.rs, monitoring.rs | 重要路径 |
| P2 | browser.rs, registry.rs | 工具相关 |
| P2 | personal_loader.rs | 已部分处理 |

### 3.2 验证方法

1. `cargo clippy -- -D warnings` 无警告
2. `cargo test` 全部通过
3. `grep -rn "\.unwrap()" src-tauri/src/agent/ --include="*.rs" | grep -v "_test.rs"` 无匹配

## 4. 验收标准

- [ ] AgentError 类型定义完成
- [ ] manager.rs 无 unwrap
- [ ] failover.rs 无 unwrap
- [ ] routing.rs 无 unwrap
- [ ] browser.rs 无 unwrap
- [ ] registry.rs 无 unwrap
- [ ] personal_loader.rs 无 unwrap
- [ ] cargo clippy 无警告
- [ ] cargo test 通过
