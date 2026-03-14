//! 快捷键命令

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// 更新快捷键
#[tauri::command]
pub fn update_shortcut(
    app: AppHandle,
    action: String,
    new_shortcut: String,
) -> Result<(), String> {
    let shortcut = app.global_shortcut();

    // 获取旧快捷键
    let old_shortcut = match action.as_str() {
        "show_app" => crate::shortcuts::DEFAULT_SHOW_APP,
        "open_ai_chat" => crate::shortcuts::DEFAULT_OPEN_AI_CHAT,
        "quick_search" => crate::shortcuts::DEFAULT_QUICK_SEARCH,
        _ => return Err(format!("未知操作: {}", action)),
    };

    // 注销旧快捷键
    if let Ok(s) = old_shortcut.parse::<Shortcut>() {
        let _ = shortcut.unregister(s);
    }

    // 解析新快捷键
    let s: Shortcut = new_shortcut.parse().map_err(|e| format!("无效的快捷键: {}", e))?;

    // 注册新快捷键
    let app_handle = app.clone();
    let action_clone = action.clone();
    shortcut
        .on_shortcut(s, move |_app, _shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                    match action_clone.as_str() {
                        "show_app" => {}
                        "open_ai_chat" => {
                            let _ = window.emit("open-ai-chat", ());
                        }
                        "quick_search" => {
                            let _ = window.emit("open-quick-search", ());
                        }
                        _ => {}
                    }
                }
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// 检查快捷键是否可用
#[tauri::command]
pub fn check_shortcut_available(_app: AppHandle, shortcut_str: String) -> Result<bool, String> {
    // 尝试解析快捷键
    match shortcut_str.parse::<Shortcut>() {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("无效的快捷键: {}", e)),
    }
}

/// 获取所有已注册的快捷键
#[tauri::command]
pub fn get_registered_shortcuts(_app: AppHandle) -> Result<Vec<String>, String> {
    // 返回默认快捷键列表
    Ok(vec![
        crate::shortcuts::DEFAULT_SHOW_APP.to_string(),
        crate::shortcuts::DEFAULT_OPEN_AI_CHAT.to_string(),
        crate::shortcuts::DEFAULT_QUICK_SEARCH.to_string(),
    ])
}
