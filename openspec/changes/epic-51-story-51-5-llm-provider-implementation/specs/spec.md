## ADDED Requirements

### Requirement: Story 51.5 - 真实 LLM Provider 实现

The system SHALL deliver this story scope aligned with FR(FR400, FR401, FR402, FR403, FR404) and ARCH(ADR-054, ADR-017).

#### Scenario: Provider 模块骨架完成
- **GIVEN** 实现遵循 task.json 和本设计文档
- **WHEN** 代码和测试完成
- **THEN** `LlmProvider` trait 正确定义
- **AND** `ProviderError` 覆盖所有错误场景
- **AND** 所有 Provider 实现 `complete()` 和 `complete_stream()`

#### Scenario: Zhipu Provider 可用
- **GIVEN** ZhipuProvider 已实现
- **WHEN** 调用 `complete()` 或 `complete_stream()`
- **THEN** 正确调用 Zhipu API
- **AND** 流式输出正确解析 SSE chunk
- **AND** Token 使用量正确返回

#### Scenario: DeepSeek/Minimax Provider 可用
- **GIVEN** DeepSeekProvider 和 MinimaxProvider 已实现
- **WHEN** 调用对应的 Provider
- **THEN** 正确调用各自 API
- **AND** 响应格式正确解析

#### Scenario: OpenAI 兼容 Provider 可用
- **GIVEN** OpenAICompatibleProvider 已实现
- **WHEN** 用户配置自定义 API Endpoint
- **THEN** 正确调用用户指定的 API
- **AND** 支持无 API Key 模式 (本地部署)

#### Scenario: 配置服务正常工作
- **GIVEN** ProviderConfigService 已实现
- **WHEN** 用户保存 Provider 配置
- **THEN** API Key 使用 Cross-platform 加密存储
- **AND** 多租户数据正确隔离
- **AND** 配置 CRUD 操作正常

#### Scenario: 配额服务正常工作
- **GIVEN** QuotaService 已实现
- **WHEN** 使用平台官方 API 调用 LLM
- **THEN** 配额正确扣减
- **AND** 配额超限时返回 `QuotaExceeded` 错误
- **AND** 用户自配置 API 用量仅记录不限制

#### Scenario: AgentOrchestrator 使用真实 Provider
- **GIVEN** MockProvider 已从 `AgentRuntimeState::new()` 移除
- **WHEN** 调用 `execute_agent`
- **THEN** 使用配置的 Provider 而非 MockProvider
- **AND** Provider 选择遵循优先级：用户指定 > 租户级 > 平台官方

#### Scenario: 官方 API Token 自动刷新
- **GIVEN** 官方 API Token 管理已实现
- **WHEN** Token 过期或即将过期
- **THEN** 启动时自动刷新
- **AND** 定期轮询检查过期时间
- **AND** Token 过期后自动获取新 Token

---

## MODIFIED Requirements

### Requirement: Story 51.1 - Rust agent core and orchestrator (扩展)

**原需求**: 使用 MockProvider 作为测试
**修改为**: AgentRuntimeState 支持注入真实 Provider

#### Scenario: Provider 注入
- **GIVEN** AgentRuntimeState 的构造函数接受 Provider 配置
- **WHEN** 创建 AgentRuntimeState 实例
- **THEN** 使用配置的 Provider 而非硬编码 MockProvider
- **AND** 支持动态切换 Provider

---

## VERIFIED Requirements

以下需求在本变更中保持不变，通过现有测试验证：

| FR | 描述 | 验证方式 |
|----|------|---------|
| FR400 | Agent 理解用户自然语言请求 | 现有单元测试 |
| FR401 | Agent 分解任务 | 现有单元测试 |
| FR402 | Agent 选择工具 | 现有单元测试 |
| FR403 | Agent 检测循环并终止 | 现有单元测试 |
| FR404 | Agent 处理多模态输入 | 现有单元测试 |

---

## Constraints

### Technical Constraints

1. **Rust 版本**: 使用 Rust 2021 edition
2. **依赖管理**: 所有新增依赖必须添加到 `Cargo.toml`
3. **错误处理**: 所有异步操作必须正确处理错误
4. **线程安全**: Provider 必须是 `Send + Sync`

### Architecture Constraints

1. **ADR-054**: 必须遵循三级配置体系
2. **ADR-017**: 必须支持 Tool Calling 2.0
3. **Provider Trait**: 所有 Provider 必须实现 `LlmProvider` trait

### Security Constraints

1. **API Key 加密**: 用户自配置 API Key 必须加密存储
2. **多租户隔离**: 配置和配额数据必须按租户隔离
3. **无硬编码**: 禁止在代码中硬编码 API Key

---

## Acceptance Test Cases

### TC1: ZhipuProvider 完整调用

```rust
#[tokio::test]
async fn test_zhipu_provider_complete() {
    // Given
    let provider = ZhipuProvider::new(std::env::var("ZHIPU_API_KEY").unwrap());
    let request = LlmRequest {
        session_id: "test".to_string(),
        trace_id: uuid::Uuid::new_v4().to_string(),
        messages: vec![LlmMessage {
            role: "user".to_string(),
            content: "Hello".to_string(),
            tool_calls: None,
        }],
        tools: None,
        stream: false,
        metadata: None,
    };

    // When
    let response = provider.complete(request).await;

    // Then
    assert!(response.is_ok());
    let response = response.unwrap();
    assert!(!response.content.is_empty());
    assert!(response.usage.total_tokens > 0);
}
```

### TC2: ZhipuProvider 流式调用

```rust
#[tokio::test]
async fn test_zhipu_provider_stream() {
    // Given
    let provider = ZhipuProvider::new(std::env::var("ZHIPU_API_KEY").unwrap());
    let request = LlmRequest { /* ... */ };

    // When
    let stream = provider.complete_stream(request).await.unwrap();
    let chunks: Vec<LlmStreamChunk> = stream.collect().await;

    // Then
    assert!(chunks.len() > 1);
    let final_chunk = chunks.last().unwrap();
    assert!(final_chunk.is_final);
}
```

### TC3: 配额检查

```rust
#[tokio::test]
async fn test_quota_exceeded() {
    // Given
    let quota_service = QuotaService::new(db.clone());
    let tenant_id = "test_tenant";

    // Set quota to 0
    quota_service.set_quota(tenant_id, 0).await.unwrap();

    // When
    let result = quota_service.check_and_consume(
        tenant_id,
        None,
        "zhipu",
        "glm-4-flash",
        &TokenUsage {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
        },
    ).await;

    // Then
    assert!(result.is_err());
    assert!(matches!(result.unwrap_err(), QuotaError::QuotaExceeded));
}
```

### TC4: 官方 API Token 刷新

```rust
#[tokio::test]
async fn test_official_token_refresh() {
    // Given
    let token_manager = OfficialTokenManager::new();
    let initial_token = token_manager.get_cached_token().await.unwrap();

    // When: Simulate token expiry
    token_manager.set_expired().await;
    let new_token = token_manager.get_cached_token().await;

    // Then
    assert!(new_token.is_ok());
    assert_ne!(initial_token, new_token.unwrap()); // Token should be refreshed
}
```
