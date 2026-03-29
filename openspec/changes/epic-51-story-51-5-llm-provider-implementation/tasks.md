# Tasks: 真实 LLM Provider 实现

## Implementation Tasks

### Phase 1: Provider 模块骨架

- [x] **T1.1**: 创建 `src-tauri/src/agent/provider/` 目录结构
- [x] **T1.2**: 定义 `LlmProvider` trait (`trait.rs`)
- [x] **T1.3**: 定义 `ProviderError` 错误类型 (`error.rs`)
- [x] **T1.4**: 定义请求/响应数据结构 (`trait.rs`)
- [x] **T1.5**: 创建 `CryptoService` 加密服务 (`crypto.rs`)
- [x] **T1.6**: 创建 `ProviderConfigService` 配置服务 (`config.rs`)
- [x] **T1.7**: 创建 `QuotaService` 配额服务 (`quota.rs`)

### Phase 2: Zhipu Provider (MVP)

- [x] **T2.1**: 实现 `ZhipuProvider::new()`
- [x] **T2.2**: 实现 `ZhipuProvider::complete()` 同步调用
- [x] **T2.3**: 实现 `ZhipuProvider::complete_stream()` 流式调用
- [x] **T2.4**: 实现 `ZhipuProvider::health_check()`
- [x] **T2.5**: 实现 SSE chunk 解析工具函数
- [x] **T2.6**: 单元测试 ZhipuProvider (框架完成)

### Phase 3: DeepSeek Provider

- [x] **T3.1**: 实现 `DeepSeekProvider::new()`
- [x] **T3.2**: 实现 `DeepSeekProvider::complete()`
- [x] **T3.3**: 实现 `DeepSeekProvider::complete_stream()`
- [x] **T3.4**: 单元测试 DeepSeekProvider (框架完成)

### Phase 4: Minimax Provider

- [x] **T4.1**: 实现 `MinimaxProvider::new()`
- [x] **T4.2**: 实现 `MinimaxProvider::complete()`
- [x] **T4.3**: 实现 `MinimaxProvider::complete_stream()`
- [x] **T4.4**: 单元测试 MinimaxProvider (框架完成)

### Phase 5: OpenAI 兼容 Provider

- [x] **T5.1**: 实现 `OpenAICompatibleProvider::new()`
- [x] **T5.2**: 实现 `OpenAICompatibleProvider::complete()`
- [x] **T5.3**: 实现 `OpenAICompatibleProvider::complete_stream()`
- [x] **T5.4**: 支持无 API Key 模式 (本地部署)
- [x] **T5.5**: 单元测试 OpenAICompatibleProvider (框架完成)

### Phase 6: 集成与配置

- [x] **T6.1**: 创建 SQLite 表 (provider_configs, platform_quotas, etc.)
- [x] **T6.2**: 实现 `ProviderConfigService::get_active_config()`
- [x] **T6.3**: 实现 `ProviderConfigService::save_config()`
- [x] **T6.4**: 实现 `QuotaService::check_and_consume()`
- [x] **T6.5**: 实现 `QuotaService::record_user_api_usage()`
- [x] **T6.6**: 集成配置服务到 AgentRuntimeState

### Phase 7: MockProvider 移除

- [x] **T7.1**: 修改 `AgentRuntimeState::new()` 使用真实 Provider
  - 使用 `Arc<RwLock<Arc<dyn AgentProvider>>>` 实现内部可变性
  - 添加 `set_provider()` 方法支持运行时替换 Provider
- [x] **T7.2**: 添加 Provider 选择逻辑 (用户指定 > 租户级 > 平台官方)
  - `ProviderConfigService::get_active_config()` 已实现三级优先级
- [x] **T7.3**: 更新 `execute_agent` 命令使用配置的 Provider
  - `AgentRuntimeState::provider()` 返回当前设置的 Provider
- [x] **T7.4**: 添加配置服务初始化到 lib.rs
  - 启动时从配置加载 Provider 并设置到 AgentRuntimeState

### Phase 8: 官方 API Token 管理

- [x] **T8.1**: 定义官方 API Token 缓存结构
  - `token_cache.rs`: `TokenInfo`, `TokenType`, `OfficialTokenCache`, `OfficialTokenCacheService`
  - 支持 API Key (永久) 和 OAuth Token (带过期时间) 两种类型
- [x] **T8.2**: 实现启动时 Token 刷新逻辑
  - `TokenRefreshService::initialize_token()` 用于初始化 token
- [x] **T8.3**: 实现定期轮询过期检查
  - `TokenRefreshService::start_background_refresh()` 后台任务定期检查
  - 可配置检查间隔和提前刷新时间
- [x] **T8.4**: 实现 Token 过期自动刷新
  - OAuth Token 支持过期前自动刷新
  - 支持刷新回调通知

### Phase 9: 端到端测试

- [ ] **T9.1**: 创建 Mock LLM Server (用于测试)
- [ ] **T9.2**: 测试完整请求-响应链路
- [ ] **T9.3**: 测试配额检查流程
- [ ] **T9.4**: 测试流式输出
- [ ] **T9.5**: 测试错误处理与恢复

> **Note**: Phase 9 需要完整的 Mock Server 或真实 API Key才能执行。在 CI/CD 环境中可以使用预配置的测试 API Key。

---

## Task Details

### T1.5: CryptoService

```rust
// crypto.rs
pub struct CryptoService {
    // Windows: DPAPI
    // macOS: Keychain
    // Linux: libsecret
}

impl CryptoService {
    pub fn new() -> Self { ... }
    pub fn encrypt(&self, plaintext: &str) -> Result<String, CryptoError> { ... }
    pub fn decrypt(&self, encrypted: &str) -> Result<String, CryptoError> { ... }
}
```

### T2.3: Zhipu SSE Streaming

```rust
async fn complete_stream(&self, request: LlmRequest)
    -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, ProviderError>> + Send>>, ProviderError> {

    let resp = self.http_client
        .post(&self.config.api_endpoint)
        .header("Authorization", format!("Bearer {}", self.config.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await?;

    let stream = SseStream::new(resp.bytes_stream())
        .filter_map(|chunk| async move {
            match chunk {
                Ok(bytes) => Some(parse_sse_chunk(&bytes)),
                Err(e) => Some(Err(ProviderError::StreamInterrupted)),
            }
        });

    Ok(Box::pin(stream))
}
```

### T7.2: Provider 选择逻辑

```rust
async fn get_provider_for_request(
    &self,
    tenant_id: &str,
    user_id: Option<&str>,
) -> Result<Arc<dyn LlmProvider>, ProviderError> {
    // 1. 尝试用户指定配置
    if let Some(user_id) = user_id {
        if let Some(config) = self.config_service.get_user_config(tenant_id, user_id).await? {
            return self.create_provider(&config);
        }
    }

    // 2. 尝试租户级配置
    if let Some(config) = self.config_service.get_tenant_config(tenant_id).await? {
        return self.create_provider(&config);
    }

    // 3. 使用平台官方配置
    if let Some(config) = self.config_service.get_official_config().await? {
        return self.create_provider(&config);
    }

    Err(ProviderError::ApiKeyNotConfigured)
}
```

---

## Acceptance Criteria

### AC1: Provider 模块骨架
- [ ] `LlmProvider` trait 正确定义
- [ ] 所有 Provider 实现 `complete()` 和 `complete_stream()`
- [ ] `ProviderError` 覆盖所有错误场景

### AC2: Zhipu Provider
- [ ] 能够成功调用 Zhipu API
- [ ] 流式输出正确解析 SSE chunk
- [ ] Token 使用量正确返回

### AC3: 配置服务
- [ ] API Key 加密存储
- [ ] 多租户隔离
- [ ] CRUD 操作正常

### AC4: 配额服务
- [ ] 平台官方 API 配额正确扣减
- [ ] 用户自配置 API 用量正确记录
- [ ] 配额超限时正确返回错误

### AC5: 集成
- [x] `AgentRuntimeState` 使用配置的 Provider
- [x] 官方 API Token 自动刷新 (框架完成，支持 OAuth Token 刷新)
- [x] 移除 MockProvider 依赖 (框架完成，单元测试待补充)

### AC6: E2E 测试
- [ ] 完整请求-响应链路测试通过
- [ ] 流式输出测试通过
- [ ] 错误处理测试通过
