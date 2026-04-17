//! AI-Automated-office - AI赋能的企业ERP系统
//!
//! 本模块是 Tauri 应用的入口点，负责初始化应用和注册命令。

#![allow(dead_code)]
#![allow(unused_variables)]

mod shortcuts;
mod app_init;

mod auth;
mod agent;
pub mod approval;
pub mod capability;
pub mod crypto;
pub mod department;
pub mod finance;
pub mod hr;
pub mod management;
pub mod marketplace;
pub mod message;
pub mod sales;
pub mod tenant;
pub mod warehouse;
pub mod workcard;
pub mod webhook;
pub mod storage;
pub mod session;
pub mod sync;
pub mod network;
pub mod hardware;
pub mod http;
pub mod knowledge;
pub mod mcp;
pub mod self_healing;
pub mod utils;
pub mod tray;
pub mod vector;
pub mod cache;
pub mod load_balancing;
pub mod export;
pub mod sla;
pub mod service;
pub mod tender;
pub mod marketing;
pub mod workspace;
pub mod security;
pub mod workflow;

pub mod commands;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_websocket::init())
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

            // 初始化所有服务
            let app_data_dir = app_init::get_app_data_dir();
            tauri::async_runtime::block_on(async {
                app_init::init_services(app, app_data_dir).await;
            });

            // 注册默认快捷键
            shortcuts::register_default_shortcuts(app.handle()).expect("无法注册默认快捷键");

            network::status::start_monitor(app.handle().clone());

            tracing::info!("应用启动完成");
            Ok(())
        })
        .invoke_handler(crate::register_all_commands![])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时出错");
}
