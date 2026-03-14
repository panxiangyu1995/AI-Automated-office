//! 全局快捷键模块
//!
//! 实现系统级全局快捷键功能

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

/// 默认快捷键配置
pub const DEFAULT_SHOW_APP: &str = "CmdOrCtrl+Shift+A";
pub const DEFAULT_OPEN_AI_CHAT: &str = "CmdOrCtrl+Shift+D";
pub const DEFAULT_QUICK_SEARCH: &str = "CmdOrCtrl+Shift+F";

/// 注册默认快捷键
pub fn register_default_shortcuts(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = app.global_shortcut();

    // 注册唤起应用快捷键
    let app_handle = app.clone();
    shortcut.on_shortcut(DEFAULT_SHOW_APP, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    })?;

    // 注册 AI 对话快捷键
    let app_handle = app.clone();
    shortcut.on_shortcut(DEFAULT_OPEN_AI_CHAT, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("open-ai-chat", ());
            }
        }
    })?;

    // 注册快速搜索快捷键
    let app_handle = app.clone();
    shortcut.on_shortcut(DEFAULT_QUICK_SEARCH, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = app_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
                let _ = window.emit("open-quick-search", ());
            }
        }
    })?;

    tracing::info!("默认快捷键注册完成");
    Ok(())
}