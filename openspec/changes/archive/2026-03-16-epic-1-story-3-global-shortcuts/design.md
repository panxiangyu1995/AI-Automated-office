# Design: 全局快捷键支持

## 技术方案

### Rust 后端实现

```rust
// src-tauri/src/shortcuts.rs
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

pub fn register_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = app.global_shortcut();
    
    // 注册唤起应用快捷键 (默认 Cmd/Ctrl + Shift + A)
    shortcut.register("CmdOrCtrl+Shift+A", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = _app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;
    
    // 注册 AI 对话快捷键 (默认 Cmd/Ctrl + Shift + D)
    shortcut.register("CmdOrCtrl+Shift+D", move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            // 唤起 AI 对话面板
            if let Some(window) = _app.get_webview_window("main") {
                let _ = window.emit("open-ai-chat", ());
            }
        }
    })?;
    
    Ok(())
}

#[tauri::command]
pub fn update_shortcut(
    app: AppHandle,
    old_shortcut: String,
    new_shortcut: String,
) -> Result<(), String> {
    let shortcut = app.global_shortcut();
    
    // 注销旧快捷键
    if let Ok(s) = old_shortcut.parse::<Shortcut>() {
        let _ = shortcut.unregister(s);
    }
    
    // 注册新快捷键
    shortcut.register(&new_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = _app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }).map_err(|e| e.to_string())?;
    
    Ok(())
}
```

### 前端实现

```typescript
// src/hooks/useGlobalShortcuts.ts
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface ShortcutConfig {
  showApp: string
  openAiChat: string
}

export function useGlobalShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>({
    showApp: 'CmdOrCtrl+Shift+A',
    openAiChat: 'CmdOrCtrl+Shift+D',
  })
  
  const updateShortcut = async (key: keyof ShortcutConfig, value: string) => {
    const oldValue = shortcuts[key]
    await invoke('update_shortcut', {
      oldShortcut: oldValue,
      newShortcut: value,
    })
    setShortcuts((prev) => ({ ...prev, [key]: value }))
  }
  
  useEffect(() => {
    const unlisten = listen('open-ai-chat', () => {
      // 打开 AI 对话面板
    })
    return () => {
      unlisten.then((fn) => fn())
    }
  }, [])
  
  return { shortcuts, updateShortcut }
}
```

## 默认快捷键配置

| 操作 | Windows | macOS |
|------|---------|-------|
| 唤起应用 | Ctrl+Shift+A | Cmd+Shift+A |
| AI 对话 | Ctrl+Shift+D | Cmd+Shift+D |
| 快速搜索 | Ctrl+Shift+F | Cmd+Shift+F |

## 组件设计

### 快捷键设置组件
```typescript
// src/features/settings/components/ShortcutSettings.tsx
interface ShortcutSettingProps {
  label: string
  value: string
  onChange: (value: string) => void
}
```

## 配置存储

```typescript
// src/stores/settingsStore.ts
interface SettingsState {
  shortcuts: ShortcutConfig
  setShortcuts: (shortcuts: ShortcutConfig) => void
}
```

## 性能考虑

1. 快捷键响应时间 < 100ms
2. 避免重复注册相同快捷键
3. 应用退出时自动注销快捷键

## 安全考虑

1. 快捷键配置存储加密
2. 敏感操作需要二次确认
