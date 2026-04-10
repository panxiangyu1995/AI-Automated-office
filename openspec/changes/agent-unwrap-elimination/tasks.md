# Agent模块unwrap消除 - 实施任务

## Task ID
- **Task 212**: Agent模块-unwrap消除

## 实施步骤

### Step 1: 创建统一错误类型

1. **创建错误模块**
   - 文件: `src-tauri/src/agent/error.rs`
   - 定义 AgentError 枚举
   - 添加 thiserror 依赖

2. **在 mod.rs 中导出**
   ```rust
   pub mod error;
   pub use error::AgentError;
   ```

### Step 2: 消除subagent/manager.rs中的unwrap

**位置**: `src-tauri/src/agent/subagent/manager.rs`

```rust
// 行76 - Arc::clone(loaders.get(user_id).unwrap())
// 重构为:
let loader = loaders.get(user_id)
    .ok_or_else(|| AgentError::SubagentNotFound(user_id.to_string()))?;
Ok(Arc::clone(loader))
```

### Step 3: 消除failover.rs中的unwrap

**位置**: `src-tauri/src/agent/failover.rs:349-354`

```rust
// 行349 - providers.get_mut(from_provider_id).unwrap()
// 重构为:
let from_provider = providers.get_mut(from_provider_id)
    .ok_or_else(|| AgentError::ProviderNotAvailable(from_provider_id.to_string()))?;
from_provider.status = ProviderStatus::Failed;
from_provider.failover_count += 1;
from_provider.last_failover = Some(Utc::now().timestamp());
```

### Step 4: 消除routing.rs中的unwrap

**位置**: `src-tauri/src/agent/routing.rs:66`

```rust
// 行66 - midnight = now.date_naive().and_hms_opt(23, 59, 59).unwrap()
// 重构为:
midnight = now.date_naive()
    .and_hms_opt(23, 59, 59)
    .ok_or_else(|| AgentError::ParseError("Invalid time".to_string()))?;
```

**位置**: `src-tauri/src/agent/routing.rs:770`

```rust
// 行770 - selected_sub_agent_id.as_ref().unwrap()
// 重构为:
let subagent_id = selected_sub_agent_id
    .as_ref()
    .ok_or_else(|| AgentError::RoutingError("No subagent selected".to_string()))?;
```

### Step 5: 消除tools/browser.rs中的unwrap

**位置**: `src-tauri/src/agent/tools/browser.rs`

```rust
// 行83 - BROWSER_STATE.read().unwrap()
// 重构为:
let state = BROWSER_STATE.read()
    .map_err(|_| AgentError::LockError("Failed to read browser state".to_string()))?;
```

### Step 6: 消除tools/registry.rs中的unwrap

**位置**: `src-tauri/src/agent/tools/registry.rs`

```rust
// 所有 lock().unwrap() 改为:
self.tools.lock()
    .map_err(|_| AgentError::LockError("Failed to acquire tools lock".to_string()))?
```

### Step 7: 消除subagent/personal_loader.rs中的unwrap

**位置**: `src-tauri/src/agent/subagent/personal_loader.rs`

将所有unwrap改为?操作符，使用Result类型传播错误。

### Step 8: 验证

1. **运行clippy**
   ```bash
   cd src-tauri && cargo clippy -- -D warnings
   ```

2. **运行测试**
   ```bash
   cd src-tauri && cargo test
   ```

3. **检查是否还有unwrap**
   ```bash
   grep -rn "\.unwrap()" src-tauri/src/agent/ --include="*.rs" | grep -v "_test.rs"
   ```

---

## 验收标准

- [ ] AgentError 类型定义完成
- [ ] manager.rs 无unwrap
- [ ] failover.rs 无unwrap
- [ ] routing.rs 无unwrap
- [ ] browser.rs 无unwrap
- [ ] registry.rs 无unwrap
- [ ] personal_loader.rs 无unwrap
- [ ] cargo clippy 无警告
- [ ] cargo test 通过
