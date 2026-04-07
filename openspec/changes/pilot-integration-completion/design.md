# Design: Pilot部门集成完善

## 核心流程

```
用户输入 → Pilot路由 → 部门工具绑定 → 执行 → 结果转换 → UI展示
```

## Tauri命令

```rust
#[tauri::command]
pub async fn bind_pilot_tools(
    department: String,
    tools: Vec<String>,
) -> Result<(), String>;

#[tauri::command]
pub async fn execute_pilot(
    department: String,
    action: String,
    params: Value,
) -> Result<PilotResult, String>;
```
