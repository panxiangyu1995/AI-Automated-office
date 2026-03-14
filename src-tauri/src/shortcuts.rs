//! 全局快捷键模块
//!
//! 实现系统级全局快捷键功能

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// 默认快捷键配置
pub const DEFAULT_SHOW_APP: &str = "CmdOrCtrl+Shift+A";
pub const DEFAULT_OPEN_AI_CHAT: &str = "CmdOrCtrl+Shift+D";
pub const DEFAULT_QUICK_SEARCH: &str = "CmdOrCtrl+Shift+F";

/// 注册默认快捷键
pub fn register_default_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = app.global_shortcut();

    // 解析快捷键字符串
    let show_shortcut: Shortcut = DEFAULT_SHOW_APP.parse()?;
    let chat_shortcut: Shortcut = DEFAULT_OPEN_AI_CHAT.parse()?;
    let search_shortcut: Shortcut = DEFAULT_QUICK_SEARCH.parse()?;

    // 注册显示/隐藏主窗口快捷键
    let app_clone = app.clone();
    shortcut.on_shortcut(show_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            tracing::info!("快捷键触发: {}", DEFAULT_SHOW_APP);
            if let Some(window) = app_clone.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                    tracing::info!("快捷键: 隐藏主窗口");
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                    tracing::info!("快捷键: 显示主窗口");
                }
            }
        }
    })?;

    // 注册 AI 对话快捷键 - 使用 app.emit() 发送应用级别事件
    let app_clone = app.clone();
    shortcut.on_shortcut(chat_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            tracing::info!("快捷键触发: {}", DEFAULT_OPEN_AI_CHAT);
            // 先显示窗口
            if let Some(window) = app_clone.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
            // 发送应用级别事件，前端所有窗口都能收到
            let _ = app_clone.emit("open-ai-chat", ());
            tracing::info!("快捷键: 已发送 open-ai-chat 事件");
        }
    })?;

    // 注册快速搜索快捷键 - 使用 app.emit() 发送应用级别事件
    let app_clone = app.clone();
    shortcut.on_shortcut(search_shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            tracing::info!("快捷键触发: {}", DEFAULT_QUICK_SEARCH);
            // 先显示窗口
            if let Some(window) = app_clone.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
            // 发送应用级别事件，前端所有窗口都能收到
            let _ = app_clone.emit("open-quick-search", ());
            tracing::info!("快捷键: 已发送 open-quick-search 事件");
        }
    })?;

    tracing::info!(
        "默认快捷键注册完成: {}, {}, {}",
        DEFAULT_SHOW_APP,
        DEFAULT_OPEN_AI_CHAT,
        DEFAULT_QUICK_SEARCH
    );
    Ok(())
}


#[cfg(test)]
mod tests {
    use super::*;

    /// 测试默认快捷键格式是否有效
    #[test]
    fn test_default_shortcuts_are_valid() {
        use tauri_plugin_global_shortcut::Shortcut;

        let shortcuts = vec![
            DEFAULT_SHOW_APP,
            DEFAULT_OPEN_AI_CHAT,
            DEFAULT_QUICK_SEARCH,
        ];

        for shortcut_str in shortcuts {
            assert!(
                shortcut_str.parse::<Shortcut>().is_ok(),
                "默认快捷键 '{}' 格式无效",
                shortcut_str
            );
        }
    }
}
