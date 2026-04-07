# Design: 错误处理与故障恢复

## 错误分类

| 类别 | 处理方式 |
|------|----------|
| NetworkError | 重试 |
| AuthError | 切换Profile |
| TimeoutError | 重试 |
| LoopError | 熔断 |

## Tauri命令

```rust
#[tauri::command]
pub async fn classify_error(error: Error) -> Result<ErrorType, String>;
#[tauri::command]
pub async fn handle_error(error_id: String) -> Result<RecoveryAction, String>;
```
