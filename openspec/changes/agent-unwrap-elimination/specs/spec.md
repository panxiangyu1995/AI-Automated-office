# Agent模块unwrap消除 - 规格说明

## Spec

### 1. 错误类型规格

| 错误类型 | 说明 |
|----------|------|
| AgentError | 统一错误枚举 |
| SubagentNotFound | 子代理未找到 |
| ProviderNotAvailable | 提供者不可用 |
| RoutingError | 路由错误 |
| ToolExecutionError | 工具执行错误 |
| RegistryError | 注册表错误 |
| LockError | 锁错误 |
| ParseError | 解析错误 |
| IoError | IO错误 |
| DatabaseError | 数据库错误 |

### 2. 消除标准

| 模式 | 处理方式 |
|------|---------|
| Option.unwrap() | 改为ok_or()? |
| Result.unwrap() | 改为? |
| lock().unwrap() | 改为map_err()? |
| as_ref().unwrap() | 改为ok_or()? |

### 3. 禁止模式

```rust
// 禁止
let x = map.get(key).unwrap();

// 允许
let x = map.get(key).ok_or(MyError::NotFound)?;
```

---

## 验收测试用例

| 场景 | 输入 | 期望输出 |
|------|------|---------|
| Option为None | get("notexist") | 返回错误，不是panic |
| lock()失败 | 并发访问 | 返回LockError |
| as_ref()为None | selected_sub_agent_id=None | 返回RoutingError |
