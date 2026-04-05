//! AI-Automated-office - AI赋能的企业ERP系统
//!
//! 本模块是 Tauri 应用的入口点，负责初始化应用和注册命令。

mod auth;
mod agent;
mod commands;
pub mod crypto;
mod hardware;
mod http;
pub mod knowledge;
pub mod capability;
mod network;
pub mod session;
mod shortcuts;
mod storage;
mod sync;
mod tray;
mod utils;
pub mod vector;

use std::path::PathBuf;
use std::sync::Arc;
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
            
            // 初始化数据库和认证服务
            tauri::async_runtime::block_on(async {
                let pool = storage::sqlite::create_pool("default").await.expect("无法创建数据库连接池");
                storage::migrations::run_migrations(&pool).await.expect("无法运行数据库迁移");
                
                let auth_service = auth::AuthService::new(pool);
                auth_service.ensure_default_user().await.expect("无法初始化默认用户");
                
                app.manage(auth_service);
                
                // Initialize session cache
                let app_data_dir = get_app_data_dir();
                let session_cache = session::SessionCache::new(app_data_dir.clone())
                    .await
                    .expect("无法初始化会话缓存");
                app.manage(session_cache);
                app.manage(agent::AgentRuntimeState::new());
                app.manage(agent::tools::ToolExecutionPipeline::new());
                app.manage(agent::heartbeat::create_heartbeat_manager());
                
                // Initialize WebSocket connection manager (Task 136)
                let ws_manager = Arc::new(agent::websocket::WebSocketConnectionManager::new());
                app.manage(ws_manager);
                
                let provider_config_state = commands::provider_config::ProviderConfigState::default();
                app.manage(provider_config_state.clone());
                app.manage(commands::provider_config::RoutingModeState::new());

                // Initialize real LLM provider from configuration (Phase 7: T7.4)
                // Priority: User config > Tenant config > Official config
                // First, try to get a configured provider
                let provider_result = provider_config_state.service
                    .get_active_config(Some("default"), None, "openai-compatible")
                    .await;

                match provider_result {
                    Ok(Some(config)) => {
                        use agent::llm_provider::LlmProviderManager;
                        if let Ok(real_provider) = LlmProviderManager::create_provider(&config) {
                            let agent_state = app.state::<agent::AgentRuntimeState>();
                            let llm_agent_provider = agent::llm_agent_provider::LlmAgentProvider::new(real_provider);
                            agent_state.set_provider(Arc::new(llm_agent_provider)).await;
                            tracing::info!("Real LLM provider initialized from config: {}", config.provider_type);
                        }
                    }
                    _ => {
                        // No config found, initialize with default OpenRouter API key for testing
                        tracing::info!("No provider config found, initializing with default OpenRouter provider");
                        use agent::llm_provider::LlmProviderManager;
                        let openrouter_provider = LlmProviderManager::create_openai_compatible_provider(
                            "https://openrouter.ai/api/v1",
                            Some("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"),
                            "nvidia/nemotron-3-super-120b-a12b:free",
                        );
                        if let Ok(provider) = openrouter_provider {
                            let agent_state = app.state::<agent::AgentRuntimeState>();
                            let llm_agent_provider = agent::llm_agent_provider::LlmAgentProvider::new(provider);
                            agent_state.set_provider(Arc::new(llm_agent_provider)).await;
                            tracing::info!("Real LLM provider initialized with OpenRouter (default)");
                        }
                    }
                }

                // Initialize Token Refresh Service (Phase 8: T8.2)
                use agent::llm_provider::TokenRefreshService;
                let token_refresh_service = Arc::new(TokenRefreshService::with_default_config());
                // Start background refresh task for OAuth tokens
                let refresh_service_clone = token_refresh_service.clone();
                refresh_service_clone.start_background_refresh();
                app.manage(token_refresh_service);
                tracing::info!("Token refresh service initialized");

                // Initialize memory service
                let memory_config = agent::memory::MemoryConfig::default();
                let memory_service = agent::memory::MemoryService::new(
                    memory_config,
                    vector::embedding::EmbeddingService::new(vector::config::EmbeddingConfig::default())
                        .expect("无法初始化Embedding服务"),
                );
                app.manage(std::sync::Arc::new(memory_service));

                // Initialize skill services
                let skill_registry = agent::skill::SkillRegistry::new();
                app.manage(std::sync::Arc::new(skill_registry));
                let skill_discovery = agent::skill::SkillDiscoveryService::new();
                app.manage(std::sync::Arc::new(skill_discovery));
                let skill_loader = agent::skill::SkillLoader::new();
                app.manage(std::sync::Arc::new(skill_loader));

                // Initialize knowledge base RAG services
                let embedding_service = std::sync::Arc::new(vector::embedding::EmbeddingService::new(
                    vector::config::EmbeddingConfig::default()
                ).expect("无法初始化Embedding服务"));
                let pipeline = knowledge::DocumentPipeline::new(embedding_service.clone());
                app.manage(std::sync::Arc::new(pipeline));
                let context_builder = knowledge::RagContextBuilder::new(embedding_service);
                app.manage(std::sync::Arc::new(context_builder));

                // Initialize capability package services
                let capability_storage = Arc::new(capability::FilePackageStorage::new(
                    app_data_dir.clone().join("capability"),
                ));
                let permission_service = Arc::new(capability::SimplePermissionService::new());
                let audit_logger = Arc::new(capability::SimpleAuditLogger::new());
                let permission_controller = Arc::new(capability::PackagePermissionController::new(
                    permission_service,
                    audit_logger,
                ));
                let dependency_resolver = Arc::new(capability::DependencyResolver::new(
                    capability_storage.clone(),
                ));
                let registry_config = capability::RegistryConfig {
                    current_user: "system".to_string(),
                    tenant_id: "default".to_string(),
                    department_id: None,
                    packages_dir: app_data_dir.join("packages"),
                };
                let capability_registry = Arc::new(capability::CapabilityPackageRegistry::new(
                    registry_config,
                    capability_storage,
                    dependency_resolver,
                    permission_controller,
                ));
                app.manage(capability_registry);

                let package_loader = Arc::new(capability::PackageLoader::new());
                app.manage(package_loader);
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
            agent::heartbeat::start_heartbeat,
            agent::heartbeat::stop_heartbeat,
            agent::heartbeat::trigger_heartbeat_now,
            agent::heartbeat::get_heartbeat_status,
            agent::heartbeat::update_heartbeat_config,
            // Memory commands
            agent::memory::memory_search,
            agent::memory::memory_add,
            agent::memory::memory_update,
            agent::memory::memory_delete,
            agent::memory::memory_stats,
            agent::memory::memory_sync,
            agent::memory::memory_hook_event,
            // Skill commands
            agent::skill::skill_list,
            agent::skill::skill_get,
            agent::skill::skill_execute,
            agent::skill::skill_discover,
            agent::skill::skill_loading_progress,
            agent::skill::skill_search,
            agent::skill::skill_validate,
            // Knowledge commands
            knowledge::knowledge_upload_document,
            knowledge::knowledge_search,
            knowledge::knowledge_document_status,
            knowledge::knowledge_delete_document,
            knowledge::knowledge_rebuild_index,
            // Capability package commands
            capability::install_capability_package,
            capability::uninstall_capability_package,
            capability::list_installed_packages,
            capability::search_marketplace,
            capability::check_package_updates,
            capability::update_capability_package,
            capability::enable_capability_package,
            capability::disable_capability_package,
            capability::import_clawhub_package,
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
            // Provider config commands (Task 134)
            commands::provider_config::save_provider_config,
            commands::provider_config::get_provider_config,
            commands::provider_config::get_tenant_provider_configs,
            commands::provider_config::delete_provider_config,
            commands::provider_config::update_provider_config,
            commands::provider_config::get_routing_config,
            commands::provider_config::get_current_mode,
            commands::provider_config::switch_mode,
            // Routing mode commands (Task 135)
            commands::provider_config::get_routing_mode,
            commands::provider_config::set_routing_mode,
            commands::provider_config::activate_yolo_mode,
            commands::provider_config::deactivate_yolo_mode,
            commands::provider_config::get_yolo_status,
            // WebSocket commands (Task 136)
            agent::websocket::create_websocket_connection,
            agent::websocket::get_websocket_connection_state,
            agent::websocket::is_websocket_connected,
            agent::websocket::close_websocket_connection,
            agent::websocket::send_websocket_message,
            agent::websocket::get_active_websocket_sessions,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时出错");
}
