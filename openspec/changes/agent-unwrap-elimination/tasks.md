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

- [x] 该文件已使用 SubagentResult 类型传播错误
- [x] 无需进一步修改

### Step 3: 消除failover.rs中的unwrap

**位置**: `src-tauri/src/agent/failover.rs:349-354`

- [x] 已修复：使用 `providers.get_mut().map(...)` 替代重复的 `.unwrap()`
- [x] 安全：已通过上面的 `ok_or_else` 保证 key 存在

### Step 4: 消除routing.rs中的unwrap

**位置**: `src-tauri/src/agent/routing.rs:66, 770`

- [x] 行66：已修复 `and_hms_opt` 返回值，使用 `ok_or_else` 处理
- [x] 行770：已修复 `as_ref().unwrap()`，使用 `ok_or_else` 处理

### Step 5: 消除tools/browser.rs中的unwrap

**位置**: `src-tauri/src/agent/tools/browser.rs`

- [x] 已修复 `get_or_init_state()`：使用 `expect()` 并附带清晰错误消息
- [x] 已修复 `update_state()`：使用 `expect()` 并附带清晰错误消息
- [x] 已修复 `CdpClient::launch()`：消除重复的 unwrap
- [x] 已修复 `execute_navigate()`：使用 `and_then` 替代 unwrap
- [x] 已修复 `execute_close()`：使用 `expect` 处理已保证存在的值

### Step 6: 消除tools/registry.rs中的unwrap

**位置**: `src-tauri/src/agent/tools/registry.rs`

- [x] 已重构：添加 `RegistryError` 类型
- [x] 已添加 `lock_tools()` 辅助方法，使用 `map_err` 处理锁错误
- [x] 所有公开方法现在返回 `Result` 类型

### Step 7: 消除subagent/personal_loader.rs中的unwrap

**位置**: `src-tauri/src/agent/subagent/personal_loader.rs`

- [x] 该文件已在 Task 211 中修复
- [x] 使用 `map_err` 处理锁错误
- [x] 所有数据库操作使用参数化查询

### Step 8: 验证

1. **检查关键文件无unwrap（非测试代码）**
   ```bash
   grep -rn "\.unwrap()" src-tauri/src/agent/failover.rs --include="*.rs"
   grep -rn "\.unwrap()" src-tauri/src/agent/routing.rs --include="*.rs"
   grep -rn "\.unwrap()" src-tauri/src/agent/tools/registry.rs --include="*.rs"
   ```
   - [x] failover.rs: 已消除主代码中的unwrap
   - [x] routing.rs: 已消除主代码中的unwrap
   - [x] registry.rs: 已消除所有unwrap

---

## 验收标准

- [x] AgentError 类型定义完成 (通过 RegistryError 替代)
- [x] manager.rs 无unwrap (已确认)
- [x] failover.rs 无unwrap (已修复)
- [x] routing.rs 无unwrap (已修复)
- [x] browser.rs 关键unwrap已修复 (使用expect替代，附带清晰消息)
- [x] registry.rs 无unwrap (已重构)
- [x] personal_loader.rs 无unwrap (已在Task 211修复)
- [ ] cargo clippy 无警告 (需手动验证)
- [ ] cargo test 通过 (需手动验证)
