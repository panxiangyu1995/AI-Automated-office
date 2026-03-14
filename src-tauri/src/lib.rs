//! AI-Automated-office - AI赋能的企业ERP系统
//!
//! 本模块是 Tauri 应用的入口点，负责初始化应用和注册命令。

mod commands;
mod shortcuts;
mod tray;
mod utils;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            // 初始化日志
            utils::logger::init_logger();
            
            // 获取主窗口
            let window = app.get_webview_window("main").expect("无法获取主窗口");
            
            // 监听窗口关闭事件，实现最小化到托盘
            let window_clone = window.clone();
            window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    // 阻止默认关闭行为
                    api.prevent_close();
                    // 隐藏窗口而不是退出
                    let _ = window_clone.hide();
                    tracing::info!("窗口已最小化到托盘");
                }
            });
            
            // 初始化系统托盘
            tray::setup_tray(app.handle()).expect("无法初始化系统托盘");
            
            // 注册默认快捷键
            shortcuts::register_default_shortcuts(app.handle()).expect("无法注册默认快捷键");
            
            tracing::info!("应用启动完成");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::get_app_version,
            commands::system::get_platform,
            commands::config::get_config,
            commands::config::set_config,
            commands::storage::get_storage,
            commands::storage::set_storage,
            commands::storage::remove_storage,
            commands::network::check_network_status,
            commands::shortcuts::update_shortcut,
            commands::shortcuts::check_shortcut_available,
            commands::shortcuts::get_registered_shortcuts,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时出错");
}
