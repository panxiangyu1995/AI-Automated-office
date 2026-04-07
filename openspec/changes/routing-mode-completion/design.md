# Design: 路由模式四档完善

## 四档模式

| 模式 | 描述 |
|------|------|
| Manual | 逐项审批 |
| Auto | 智能评估 |
| Yolo | 完全自动 |
| Hybrid | 混合模式 |

## Tauri命令

```rust
#[tauri::command]
pub async fn get_routing_mode() -> Result<RoutingMode, String>;
#[tauri::command]
pub async fn set_routing_mode(mode: RoutingMode) -> Result<(), String>;
```
