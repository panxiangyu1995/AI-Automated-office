//! AI-Automated-office - AI赋能的企业ERP系统
//!
//! 本模块是 Tauri 应用的入口点，负责初始化应用和注册命令。

mod auth;
mod agent;
mod commands;
pub mod crypto;
mod hardware;
mod http;
mod network;
pub mod session;
mod shortcuts;
mod storage;
mod sync;
mod tray;
mod utils;
pub mod vector;

use std::path::PathBuf;
use tauri::Manager;
use directories::ProjectDirs;

/// Get the application data directory
fn get_app_data_dir() -> PathBuf {
    ProjectDirs::from("com", "AI-Automated", "Office")
        .map(|dirs| dirs.data_dir().to_path_buf())
        .unwrap_or_else(|| {
            // Fallback to current directory
            std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
        })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
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
            
            // 初始化数据库和认证服务
            tauri::async_runtime::block_on(async {
                let pool = storage::sqlite::create_pool("default").await.expect("无法创建数据库连接池");
                storage::migrations::run_migrations(&pool).await.expect("无法运行数据库迁移");
                
                let auth_service = auth::AuthService::new(pool);
                auth_service.ensure_default_user().await.expect("无法初始化默认用户");
                
                app.manage(auth_service);
                
                // Initialize session cache
                let app_data_dir = get_app_data_dir();
                let session_cache = session::SessionCache::new(app_data_dir)
                    .await
                    .expect("无法初始化会话缓存");
                app.manage(session_cache);
                app.manage(agent::AgentRuntimeState::new());
                app.manage(agent::tools::ToolExecutionPipeline::new());
            });
            
            // 注册默认快捷键
            shortcuts::register_default_shortcuts(app.handle()).expect("无法注册默认快捷键");

            network::status::start_monitor(app.handle().clone());
            
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
            commands::network::get_network_status,
            commands::shortcuts::update_shortcut,
            commands::shortcuts::check_shortcut_available,
            commands::shortcuts::get_registered_shortcuts,
            commands::hardware::list_scanners,
            commands::hardware::scan_document,
            commands::hardware::list_printers,
            commands::hardware::print_document,
            commands::hardware::print_preview,
            commands::update::check_update,
            commands::update::download_and_install,
            commands::auth::login,
            commands::auth::register,
            commands::auth::logout,
            commands::auth::get_current_user,
            commands::agent::start_agent_session,
            commands::agent::execute_agent,
            commands::agent::interrupt_agent_session,
            commands::agent::retrieve_knowledge,
            commands::agent::retrieve_knowledge_cached,
            commands::agent::format_knowledge_for_planner,
            commands::agent::format_knowledge_for_runtime,
            commands::agent::format_knowledge_for_tool,
            commands::tools::list_tools,
            commands::tools::execute_tool,
            // Session cache commands
            commands::session::save_session_metadata,
            commands::session::get_session_metadata,
            commands::session::clear_session_cache,
            commands::session::has_session_cache,
            http::commands::http_request,
            http::commands::http_get,
            http::commands::http_post,
            sync::offline_queue::enqueue_request,
            sync::offline_queue::get_pending_requests,
            sync::offline_queue::process_pending_requests,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时出错");
}
