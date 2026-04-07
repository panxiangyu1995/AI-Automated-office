//! AI-Automated-office - AI赋能的企业ERP系统
//!
//! 本模块是 Tauri 应用的入口点，负责初始化应用和注册命令。

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
pub mod crypto;

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

                // Initialize department module
                let department_state = department::DepartmentState::new();
                department_state.init_defaults();
                app.manage(department_state.registry.clone());
                app.manage(department_state.loader.clone());
                app.manage(department_state.message_bus.clone());

                // Initialize HR module
                let hr_state = hr::HrState::new();
                app.manage(hr_state.db.clone());

                // Initialize Approval module
                let approval_state = approval::ApprovalState::new();
                app.manage(approval_state.db.clone());

                // Initialize Sales module
                let sales_state = sales::SalesState::new();
                app.manage(sales_state.db.clone());

                // Initialize Finance module
                let finance_state = finance::FinanceState::new();
                app.manage(finance_state.db.clone());

                // Initialize Warehouse module
                let warehouse_state = warehouse::WarehouseState::new();
                app.manage(warehouse_state.db.clone());

                // Initialize Management module
                let management_state = management::ManagementState::new();
                app.manage(management_state);

                // Initialize Message module
                let message_state = message::MessageState::new();
                app.manage(message_state);

                // Initialize Tenant module
                let tenant_state = tenant::TenantState::new();
                app.manage(tenant_state);
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
            // Department commands (Task 146)
            department::department_create,
            department::department_list,
            department::department_get,
            department::department_update,
            department::department_delete,
            department::department_enable,
            department::department_disable,
            department::department_capabilities,
            department::department_load,
            department::department_unload,
            department::department_loaded_list,
            department::department_load_state,
            department::department_send_message,
            department::department_message_history,
            department::department_message_history_by_department,
            department::department_stats,
            // HR commands (Task 147)
            hr::hr_create_employee,
            hr::hr_list_employees,
            hr::hr_get_employee,
            hr::hr_update_employee,
            hr::hr_delete_employee,
            hr::hr_create_department,
            hr::hr_get_department_tree,
            hr::hr_get_department,
            hr::hr_update_department,
            hr::hr_delete_department,
            hr::hr_create_position,
            hr::hr_list_positions,
            hr::hr_get_position,
            hr::hr_update_position,
            hr::hr_delete_position,
            // Approval commands (Task 148)
            approval::approval_create_flow,
            approval::approval_list_flows,
            approval::approval_get_flow,
            approval::approval_update_flow,
            approval::approval_delete_flow,
            approval::approval_create_record,
            approval::approval_list_records,
            approval::approval_get_record,
            approval::approval_approve,
            approval::approval_reject,
            approval::approval_cancel,
            approval::approval_get_stats,
            // Sales commands (Task 149)
            sales::sales_create_customer,
            sales::sales_list_customers,
            sales::sales_get_customer,
            sales::sales_update_customer,
            sales::sales_delete_customer,
            sales::sales_list_quotes,
            sales::sales_get_quote,
            sales::sales_list_contracts,
            sales::sales_get_contract,
            sales::sales_get_stats,
            // Finance commands (Task 150)
            finance::finance_create_invoice,
            finance::finance_list_invoices,
            finance::finance_get_invoice,
            finance::finance_verify_invoice,
            finance::finance_create_ledger,
            finance::finance_list_ledger,
            finance::finance_get_ledger,
            finance::finance_record_payment,
            finance::finance_get_stats,
            // Warehouse commands (Task 151)
            warehouse::warehouse_list_inbounds,
            warehouse::warehouse_get_inbound,
            warehouse::warehouse_create_inbound,
            warehouse::warehouse_list_outbounds,
            warehouse::warehouse_get_outbound,
            warehouse::warehouse_create_outbound,
            warehouse::warehouse_list_inventory,
            warehouse::warehouse_get_stats,
            // Management commands (Task 152)
            management::management_get_dashboard,
            management::management_list_warnings,
            management::management_create_warning_rule,
            management::management_list_rules,
            management::management_get_stats,
            // Message commands (Task 153)
            message::message_send,
            message::message_list,
            message::message_get,
            message::message_mark_read,
            message::message_read_all,
            message::message_delete,
            message::message_unread_count,
            message::message_get_preferences,
            message::message_update_preferences,
            // Tenant commands (Task 154)
            tenant::tenant_get_current,
            tenant::tenant_list,
            tenant::tenant_get_config,
            tenant::tenant_update_config,
            tenant::tenant_get_stats,
        ])
        .run(tauri::generate_context!())
        .expect("启动 Tauri 应用时出错");
}
