# Design: 系统托盘集成

## 技术方案

### Rust 后端实现

```rust
// src-tauri/src/tray.rs
use tauri::{
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder},
    Manager, Runtime,
};

pub fn setup_tray<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "设置", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[&show, &settings, &quit])?;
    
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "settings" => {
                // 打开设置页面
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    
    Ok(())
}
```

### 前端实现

```typescript
// src/hooks/useTray.ts
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'

export function useTray() {
  useEffect(() => {
    const unlisten = listen('tray-event', (event) => {
      console.log('Tray event:', event.payload)
    })
    
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])
}
```

## API 设计

### Tauri 命令

```rust
#[tauri::command]
fn toggle_window_visibility(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().map_err(|e| e.to_string())? {
            window.hide().map_err(|e| e.to_string())?;
        } else {
            window.show().map_err(|e| e.to_string())?;
            window.set_focus().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
fn update_tray_icon(status: String) -> Result<(), String> {
    // 更新托盘图标状态
    Ok(())
}
```

## 组件设计

### 托盘菜单结构
- 显示窗口
- 设置
- ---
- 退出

### 托盘图标状态
- 正常状态（默认图标）
- 有新消息（高亮图标）
- 离线状态（灰色图标）

## 配置文件

### Cargo.toml
```toml
[dependencies]
tauri = { version = "2.0", features = ["tray-icon", "image-png"] }
```

### 资源文件
```
assets/
├── icons/
│   ├── tray-icon.png      # 16x16 或 32x32
│   ├── tray-icon@2x.png   # 高清版本
│   └── tray-icon.ico      # Windows 专用
```

## 性能考虑

1. 托盘图标响应时间 < 500ms
2. 避免频繁更新托盘图标（防抖处理）
3. 托盘菜单渲染使用系统原生组件

## 安全考虑

1. 托盘菜单操作需验证用户身份
2. 敏感操作需二次确认
