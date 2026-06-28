//! 应用初始化模块
//!
//! 将 lib.rs 中的服务初始化逻辑提取为独立函数，降低 lib.rs 行数。

use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Manager, App};

use crate::commands;
use crate::{
    agent, approval, capability, department, export, finance, hr,
    knowledge, load_balancing, management, marketplace, marketing, message,
    sales, security, service, session, sla, storage,
    tender, tenant, warehouse, webhook, workspace,
};

/// Get the application data directory
pub fn get_app_data_dir() -> PathBuf {
    directories::ProjectDirs::from("com", "AI-Automated", "Office")
        .map(|dirs| dirs.data_dir().to_path_buf())
        .unwrap_or_else(|| {
            std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."))
        })
}

/// Initialize all application services (called inside tauri::async_runtime::block_on)
pub async fn init_services(app: &App, app_data_dir: PathBuf) {
    // 初始化数据库和认证服务
    let pool = storage::sqlite::create_pool("default").await.expect("无法创建数据库连接池");
    storage::migrations::run_migrations(&pool).await.expect("无法运行数据库迁移");

    // 管理数据库连接池状态（供 Dashboard 等命令使用）
    app.manage(Arc::new(tokio::sync::RwLock::new(Some(pool.clone()))));

    let auth_service = crate::auth::AuthService::new(pool.clone());
    auth_service.ensure_default_user("default").await.expect("无法初始化默认用户");
    app.manage(auth_service);

    // Initialize session cache
    let session_cache = session::SessionCache::new(app_data_dir.clone())
        .await
        .expect("无法初始化会话缓存");
    app.manage(session_cache);
    app.manage(agent::AgentRuntimeState::new());
    app.manage(agent::tools::ToolExecutionPipeline::new());
    app.manage(agent::tools::ToolVisibilityService::new());
    app.manage(agent::heartbeat::create_heartbeat_manager());
    app.manage(agent::delivery::DeliveryStrategyService::new());

    // Initialize Prompt Guardrails Service (Task 198 - ADR-041)
    let prompt_guardrails = Arc::new(agent::prompt_guardrails::PromptGuardrailsService::new());
    app.manage(prompt_guardrails);

    // Initialize Webhook Service (Task 204)
    let webhook_service = Arc::new(webhook::WebhookService::new());
    app.manage(webhook_service.clone());

    // Initialize Audit SIEM Bridge (J4)
    let siem_bridge = Arc::new(agent::audit_siem::AuditSiemBridge::new(
        webhook_service,
        agent::audit_siem::SiemConfig::default(),
    ));
    app.manage(siem_bridge);

    // Initialize Subagent system (Task 199 - ADR-059)
    commands::subagent::init_subagent_commands();

    // Initialize WebSocket connection manager (Task 136)
    let ws_manager = Arc::new(agent::websocket::WebSocketConnectionManager::new());
    app.manage(ws_manager);

    let provider_config_state = commands::provider_config::ProviderConfigState::default();
    app.manage(provider_config_state.clone());
    app.manage(commands::provider_config::RoutingModeState::new());
    app.manage(commands::failover::FailoverState::new());
    app.manage(commands::resource_security::ResourceSecurityState::new());
    app.manage(commands::config_cache::ConfigCacheState::new());
    app.manage(load_balancing::LoadBalancingState::new());
    app.manage(export::ExportMigrationState::new());
    app.manage(Arc::new(tokio::sync::RwLock::new(export::TenantDataService::new())));
    app.manage(sla::SlaMonitoringState::new());

    // Initialize LLM provider
    init_llm_provider(&provider_config_state, app).await;

    // Initialize Token Refresh Service (Phase 8: T8.2)
    use agent::llm_provider::TokenRefreshService;
    use commands::token_refresh::TokenRefreshState;
    let token_refresh_service = Arc::new(TokenRefreshService::with_default_config());
    let refresh_service_clone = token_refresh_service.clone();
    refresh_service_clone.start_background_refresh();
    let token_refresh_state = TokenRefreshState::new(token_refresh_service);
    app.manage(token_refresh_state);
    tracing::info!("Token refresh service initialized");

    // Initialize memory & embedding services
    init_memory_and_embedding(app).await;

    // Initialize capability package services
    init_capability_services(app, &app_data_dir).await;

    // Initialize business department modules
    init_department_modules(app, &app_data_dir, &pool).await;

    // Initialize infrastructure modules
    init_infrastructure_modules(app).await;
}

/// Initialize LLM provider from configuration or environment
async fn init_llm_provider(
    provider_config_state: &commands::provider_config::ProviderConfigState,
    app: &App,
) {
    let provider_result = provider_config_state.service
        .get_active_config(Some("default"), None, "openai-compatible")
        .await;

    match provider_result {
        Ok(Some(config)) => {
            use agent::llm_provider::LlmProviderManager;
            if let Ok(real_provider) = LlmProviderManager::create_provider(&config) {
                let agent_state = app.state::<agent::AgentRuntimeState>();
                agent_state.set_llm_provider(real_provider).await;
                tracing::info!("Real LLM provider initialized from config: {}", config.provider_type);
            }
        }
        _ => {
            tracing::info!("No provider config found, attempting to initialize with OpenRouter provider");
            use agent::llm_provider::LlmProviderManager;
            let openrouter_api_key = std::env::var("OPENROUTER_API_KEY")
                .unwrap_or_else(|_| {
                    tracing::warn!("OPENROUTER_API_KEY not set. Set it to enable default LLM provider.");
                    String::new()
                });
            if !openrouter_api_key.is_empty() {
                let openrouter_provider = LlmProviderManager::create_openai_compatible_provider(
                    "https://openrouter.ai/api/v1",
                    Some(&openrouter_api_key),
                    "nvidia/nemotron-3-super-120b-a12b:free",
                );
                if let Ok(provider) = openrouter_provider {
                    let agent_state = app.state::<agent::AgentRuntimeState>();
                    agent_state.set_llm_provider(provider).await;
                    tracing::info!("Real LLM provider initialized with OpenRouter (from env)");
                }
            } else {
                tracing::warn!("Skipping OpenRouter initialization: OPENROUTER_API_KEY not configured");
            }
        }
    }
}

/// Initialize memory service and embedding services
async fn init_memory_and_embedding(app: &App) {
    let memory_config = agent::memory::MemoryConfig::default();
    let embedding_instance = crate::vector::embedding::EmbeddingService::new(
        crate::vector::config::EmbeddingConfig::default()
    ).expect("无法初始化Embedding服务");
    let memory_service = agent::memory::MemoryService::new(
        memory_config,
        embedding_instance.clone(),
    );
    app.manage(Arc::new(memory_service));

    // Initialize skill services
    let skill_registry = agent::skill::SkillRegistry::new();
    app.manage(Arc::new(skill_registry));
    let skill_discovery = agent::skill::SkillDiscoveryService::new();
    app.manage(Arc::new(skill_discovery));
    let skill_loader = agent::skill::SkillLoader::new();
    app.manage(Arc::new(skill_loader));

    // Initialize knowledge base RAG services
    let knowledge_state = knowledge::commands::KnowledgeState::new();
    app.manage(knowledge_state);
    let embedding_service = Arc::new(embedding_instance);
    let pipeline = knowledge::DocumentPipeline::new(embedding_service.clone());
    app.manage(Arc::new(pipeline));
    let context_builder = knowledge::RagContextBuilder::new(embedding_service);
    app.manage(Arc::new(context_builder));

    // Initialize Vector Service for hybrid search
    let vector_config = crate::vector::config::VectorConfig::load();
    let mut vector_service = crate::vector::VectorService::new(vector_config);
    if let Err(e) = vector_service.initialize().await {
        tracing::warn!("[VectorService] 初始化失败，使用降级模式: {}", e);
    }
    let vector_state_inner: crate::knowledge::search::VectorServiceState = 
        Arc::new(tokio::sync::RwLock::new(Some(vector_service)));
    app.manage(vector_state_inner);
}

/// Initialize capability package services
async fn init_capability_services(app: &App, app_data_dir: &PathBuf) {
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

    // Initialize Version Manager Service (Task 197)
    let version_manager = Arc::new(capability::VersionManagerService::new());
    app.manage(version_manager);
}

/// Initialize business department modules
async fn init_department_modules(app: &App, _app_data_dir: &PathBuf, pool: &sqlx::SqlitePool) {
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
    app.manage(approval::attachment::AttachmentService::new());

    // Initialize Approval Template Service (Task 201 - FR132-FR136)
    let template_service = Arc::new(approval::template::TemplateService::new());
    app.manage(template_service);

    // Initialize Sales module
    let sales_state = sales::SalesState::new();
    app.manage(sales_state.db.clone());

    // Initialize Finance module
    let finance_state = finance::FinanceState::new();
    app.manage(finance_state.db.clone());

    // Initialize Warehouse module
    let warehouse_state = warehouse::WarehouseState::new();
    app.manage(warehouse_state.db.clone());

    // Initialize Service module (Task 231 - Epic 15 Story 15.1)
    let service_state = service::ServiceState::new();
    app.manage(service_state.db.clone());

    // Initialize Tender module (Task 234 - Epic 16 Story 16.1)
    let tender_state = tender::TenderState::new();
    app.manage(tender_state.db.clone());

    // Initialize Marketing module (Task 237 - Epic 17 Story 17.1)
    let marketing_state = marketing::MarketingState::new();
    app.manage(marketing_state.db.clone());

    // Initialize Marketplace module
    let marketplace_state = marketplace::MarketplaceState::new();
    app.manage(marketplace_state);

    // Initialize Workspace module (Task 240 - Epic 18 Story 18.1)
    let workspace_state = workspace::WorkspaceState::new();
    app.manage(workspace_state.db.clone());

    // Initialize Security module (Epic 19 Story 19.1)
    let security_state = security::SecurityState::new();
    app.manage(security_state.db.clone());

    // Initialize Management module
    let management_state = management::ManagementState::new();
    app.manage(management_state);

    // Initialize Message module
    let message_state = message::MessageState::new();
    app.manage(message_state);

    // Initialize Tenant module with SQLite persistence
    let tenant_state = tenant::TenantState::new(pool.clone());
    tenant::init_default_tenant(&tenant_state).await
        .expect("无法初始化默认租户");
    app.manage(tenant_state);
}

/// Initialize infrastructure modules (monitoring, cache stats, etc.)
async fn init_infrastructure_modules(app: &App) {
    // Initialize WorkCard module
    let workcard_state = commands::workcard::WorkCardState::default();
    app.manage(workcard_state);

    // Initialize Monitoring module
    let monitoring_state = commands::monitoring::MonitoringState::default();
    app.manage(monitoring_state);

    // Initialize Cache Stats module (Task 205)
    let cache_stats_state = commands::cache_stats::CacheStatsState::new();
    app.manage(cache_stats_state);
}
