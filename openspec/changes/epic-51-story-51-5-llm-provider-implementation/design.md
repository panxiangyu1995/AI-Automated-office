# Design: 真实 LLM Provider 实现

## Architecture Alignment

- Phase: Phase 1 - Execution Spine (Epic 51)
- Backend Required: Yes
- Rebaseline Source: 本变更为 Epic 51 的后续 Story

## Directory Structure

```
src-tauri/src/agent/
├── provider/
│   ├── mod.rs                    # 模块入口，导出所有 Provider
│   ├── trait.rs                  # LlmProvider trait 定义
│   ├── error.rs                  # ProviderError 错误类型
│   ├── config.rs               # ProviderConfigService 配置服务
│   ├── quota.rs                 # QuotaService 配额服务
│   │
│   ├── zhipu.rs                 # Zhipu Provider 实现
│   ├── deepseek.rs              # DeepSeek Provider 实现
│   ├── minimax.rs              # Minimax Provider 实现
│   ├── openai_compatible.rs    # OpenAI 兼容 Provider (支持本地部署)
│   │
│   └── crypto.rs               # Cross-platform 加密工具
```

## File Specifications

### 1. provider/trait.rs - Provider Trait 定义

```rust
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::pin::Pin;

// ============ Request/Response Types ============

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmRequest {
    pub session_id: String,
    pub trace_id: String,
    pub messages: Vec<LlmMessage>,
    pub tools: Option<Vec<ToolDescriptor>>,
    pub stream: bool,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmMessage {
    pub role: String,           // "system" | "user" | "assistant"
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub function: ToolFunction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolFunction {
    pub name: String,
    pub arguments: String,       // JSON string
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDescriptor {
    pub id: String,
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmResponse {
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
    pub usage: TokenUsage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmStreamChunk {
    pub content: String,
    pub is_final: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub usage: Option<TokenUsage>,
}

// ============ Provider Trait ============

#[async_trait]
pub trait LlmProvider: Send + Sync {
    // Provider 标识
    fn provider_id(&self) -> &str;
    fn provider_name(&self) -> &str;

    // 健康检查
    async fn health_check(&self) -> Result<bool, ProviderError>;

    // 同步调用
    async fn complete(&self, request: LlmRequest) -> Result<LlmResponse, ProviderError>;

    // 流式调用
    async fn complete_stream(
        &self,
        request: LlmRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, ProviderError>> + Send>>, ProviderError>;

    // 能力查询
    fn supports_streaming(&self) -> bool { true }
    fn supports_tools(&self) -> bool { true }
    fn supported_models(&self) -> Vec<String>;
}

// ============ Provider Error ============

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("API key not configured")]
    ApiKeyNotConfigured,

    #[error("API request failed: {0}")]
    RequestFailed(String),

    #[error("API response parse error: {0}")]
    ResponseParseError(String),

    #[error("Authentication failed: {0}")]
    AuthFailed(String),

    #[error("Rate limit exceeded: {0}")]
    RateLimitExceeded(String),

    #[error("Token quota exceeded")]
    QuotaExceeded,

    #[error("Context length exceeded")]
    ContextLengthExceeded,

    #[error("Provider unavailable: {0}")]
    ProviderUnavailable(String),

    #[error("Timeout after {0}ms")]
    Timeout(u64),

    #[error("Stream interrupted")]
    StreamInterrupted,

    #[error("Invalid configuration: {0}")]
    InvalidConfig(String),
}
```

### 2. provider/zhipu.rs - Zhipu Provider

```rust
// API Endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions
// Model: glm-4-flash (默认)

pub struct ZhipuProvider {
    config: ZhipuConfig,
    http_client: reqwest::Client,
}

#[derive(Debug, Clone)]
pub struct ZhipuConfig {
    pub api_endpoint: String,
    pub api_key: String,
    pub model: String,
    pub timeout_ms: u64,
}

impl ZhipuProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            config: ZhipuConfig {
                api_endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions".to_string(),
                api_key,
                model: "glm-4-flash".to_string(),
                timeout_ms: 60000,
            },
            http_client: reqwest::Client::new(),
        }
    }

    pub fn with_config(config: ZhipuConfig) -> Self {
        Self {
            config,
            http_client: reqwest::Client::new(),
        }
    }
}

#[async_trait]
impl LlmProvider for ZhipuProvider {
    fn provider_id(&self) -> &str { "zhipu" }
    fn provider_name(&self) -> &str { "Zhipu AI (智谱AI)" }

    async fn health_check(&self) -> Result<bool, ProviderError> {
        // 发送一个简单的请求检查连通性
        let request = LlmRequest {
            session_id: "health_check".to_string(),
            trace_id: uuid::Uuid::new_v4().to_string(),
            messages: vec![LlmMessage {
                role: "user".to_string(),
                content: "hi".to_string(),
                tool_calls: None,
            }],
            tools: None,
            stream: false,
            metadata: None,
        };

        match self.complete(request).await {
            Ok(_) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    async fn complete(&self, request: LlmRequest) -> Result<LlmResponse, ProviderError> {
        let body = serde_json::json!({
            "model": self.config.model,
            "messages": request.messages,
            "tools": request.tools,
            "stream": false
        });

        let resp = self.http_client
            .post(&self.config.api_endpoint)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .timeout(Duration::from_millis(self.config.timeout_ms))
            .send()
            .await
            .map_err(|e| ProviderError::RequestFailed(e.to_string()))?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(ProviderError::RequestFailed(format!("{}: {}", status, body)));
        }

        let parsed: ZhipuResponse = resp
            .json()
            .await
            .map_err(|e| ProviderError::ResponseParseError(e.to_string()))?;

        Ok(LlmResponse {
            content: parsed.choices[0].message.content.clone(),
            tool_calls: parsed.choices[0].message.tool_calls.map(|tc| tc.into()),
            usage: TokenUsage {
                prompt_tokens: parsed.usage.prompt_tokens,
                completion_tokens: parsed.usage.completion_tokens,
                total_tokens: parsed.usage.total_tokens,
            },
            metadata: None,
        })
    }

    async fn complete_stream(&self, request: LlmRequest) -> Result<Pin<Box<dyn Stream<Item = Result<LlmStreamChunk, ProviderError>> + Send>>, ProviderError> {
        // SSE 流式实现
        let body = serde_json::json!({
            "model": self.config.model,
            "messages": request.messages,
            "tools": request.tools,
            "stream": true
        });

        let resp = self.http_client
            .post(&self.config.api_endpoint)
            .header("Authorization", format!("Bearer {}", self.config.api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .timeout(Duration::from_millis(self.config.timeout_ms))
            .send()
            .await
            .map_err(|e| ProviderError::RequestFailed(e.to_string()))?;

        // 使用 BroadcastStream 包装 SSE
        let stream = SseStream::new(resp.bytes_stream())
            .map_ok(|chunk| {
                // 解析 SSE chunk
                parse_sse_chunk(&chunk)
            })
            .map_err(|e| ProviderError::StreamInterrupted);

        Ok(Box::pin(stream))
    }

    fn supported_models(&self) -> Vec<String> {
        vec![
            "glm-4-flash".to_string(),
            "glm-4".to_string(),
            "glm-4-plus".to_string(),
            "glm-4-long".to_string(),
            "glm-4-alltools".to_string(),
        ]
    }
}
```

### 3. provider/deepseek.rs - DeepSeek Provider

```rust
// API Endpoint: https://api.deepseek.com/v1/chat/completions
// Model: deepseek-chat (默认)

pub struct DeepSeekProvider {
    config: DeepSeekConfig,
    http_client: reqwest::Client,
}

#[derive(Debug, Clone)]
pub struct DeepSeekConfig {
    pub api_endpoint: String,
    pub api_key: String,
    pub model: String,
    pub timeout_ms: u64,
}

impl DeepSeekProvider {
    pub fn new(api_key: String) -> Self {
        Self {
            config: DeepSeekConfig {
                api_endpoint: "https://api.deepseek.com/v1/chat/completions".to_string(),
                api_key,
                model: "deepseek-chat".to_string(),
                timeout_ms: 60000,
            },
            http_client: reqwest::Client::new(),
        }
    }
}
```

### 4. provider/minimax.rs - Minimax Provider

```rust
// API Endpoint: https://api.minimax.chat/v1/chat/completions
// Model: MiniMax-Text-01 (默认)

pub struct MinimaxProvider {
    config: MinimaxConfig,
    http_client: reqwest::Client,
}

#[derive(Debug, Clone)]
pub struct MinimaxConfig {
    pub api_endpoint: String,
    pub api_key: String,
    pub model: String,
    pub group_id: String,         // Minimax 特定
    pub timeout_ms: u64,
}
```

### 5. provider/openai_compatible.rs - OpenAI 兼容 Provider

```rust
// 支持本地部署 (Ollama 等)
// API Endpoint: 用户自定义

pub struct OpenAICompatibleProvider {
    config: OpenAICompatibleConfig,
    http_client: reqwest::Client,
}

#[derive(Debug, Clone)]
pub struct OpenAICompatibleConfig {
    pub api_endpoint: String,     // 用户自定义端点
    pub api_key: String,          // 可选
    pub model: String,
    pub timeout_ms: u64,
}

impl OpenAICompatibleProvider {
    pub fn new(api_endpoint: String, api_key: Option<String>) -> Self {
        Self {
            config: OpenAICompatibleConfig {
                api_endpoint,
                api_key: api_key.unwrap_or_default(),
                model: "gpt-3.5-turbo".to_string(),
                timeout_ms: 120000,  // 本地部署可能需要更长时间
            },
            http_client: reqwest::Client::new(),
        }
    }
}
```

### 6. provider/config.rs - 配置服务

```rust
pub struct ProviderConfigService {
    db: Arc<Database>,
    crypto: Arc<CryptoService>,
}

impl ProviderConfigService {
    // 获取当前用户的有效 Provider 配置
    pub async fn get_active_config(
        &self,
        tenant_id: &str,
        user_id: Option<&str>,
        provider_type: Option<&str>,
    ) -> Result<Option<ActiveProviderConfig>, ConfigError> {
        // 优先级：用户指定 > 租户级 > 平台官方
        // ...
    }

    // 保存 Provider 配置
    pub async fn save_config(
        &self,
        input: ProviderConfigInput,
    ) -> Result<String, ConfigError> {
        // 1. 加密 API Key
        let encrypted_key = self.crypto.encrypt(&input.api_key)?;

        // 2. 存储到 SQLite
        // ...
    }

    // 获取并解密 API Key (仅内存中使用)
    pub async fn get_api_key(
        &self,
        config_id: &str,
    ) -> Result<String, ConfigError> {
        // ...
    }
}
```

### 7. provider/quota.rs - 配额服务

```rust
pub struct QuotaService {
    db: Arc<Database>,
}

impl QuotaService {
    // 检查配额并扣减
    pub async fn check_and_consume(
        &self,
        tenant_id: &str,
        user_id: Option<&str>,
        provider_type: &str,
        model_name: &str,
        usage: &TokenUsage,
    ) -> Result<(), QuotaError> {
        // 1. 如果是平台官方 API，检查平台配额
        // 2. 检查租户配额
        // 3. 检查用户配额
        // 4. 检查模型配额
        // 5. 扣减配额
        // ...
    }

    // 记录用户自配置 API 的用量（不限制）
    pub async fn record_user_api_usage(
        &self,
        tenant_id: &str,
        user_id: &str,
        provider_type: &str,
        model_name: &str,
        usage: &TokenUsage,
    ) -> Result<(), QuotaError> {
        // 仅记录，不限制
        // ...
    }
}
```

### 8. provider/crypto.rs - 加密服务

```rust
pub struct CryptoService {
    // Cross-platform 加密实现
    // Windows: DPAPI
    // macOS: Keychain
    // Linux: libsecret
}

impl CryptoService {
    // 加密 API Key
    pub fn encrypt(&self, plaintext: &str) -> Result<String, CryptoError> {
        // 1. 生成随机 salt
        // 2. 使用系统密钥链中的主密钥加密
        // 3. 返回 "salt:encrypted_data" 格式
        // ...
    }

    // 解密 API Key
    pub fn decrypt(&self, encrypted: &str) -> Result<String, CryptoError> {
        // ...
    }
}
```

### 9. provider/mod.rs - 模块入口

```rust
pub mod trait;
pub mod error;
pub mod config;
pub mod quota;
pub mod crypto;
pub mod zhipu;
pub mod deepseek;
pub mod minimax;
pub mod openai_compatible;

pub use trait::{LlmProvider, LlmRequest, LlmResponse, TokenUsage, LlmStreamChunk};
pub use error::ProviderError;
pub use config::{ProviderConfigService, ActiveProviderConfig, ProviderConfigInput};
pub use quota::{QuotaService, QuotaError};
pub use crypto::CryptoService;

// Provider 工厂
pub enum ProviderType {
    Zhipu,
    DeepSeek,
    Minimax,
    OpenAICompatible,
}

impl ProviderType {
    pub fn create(&self, api_key: String, config: serde_json::Value) -> Arc<dyn LlmProvider> {
        match self {
            ProviderType::Zhipu => Arc::new(zhipu::ZhipuProvider::new(api_key)),
            ProviderType::DeepSeek => Arc::new(deepseek::DeepSeekProvider::new(api_key)),
            ProviderType::Minimax => Arc::new(minimax::MinimaxProvider::new(api_key)),
            ProviderType::OpenAICompatible => Arc::new(openai_compatible::OpenAICompatibleProvider::new(
                config["api_endpoint"].as_str().unwrap().to_string(),
                Some(api_key),
            )),
        }
    }
}
```

## Integration with AgentOrchestrator

### 修改 AgentRuntimeState

```rust
// src-tauri/src/agent/mod.rs

impl AgentRuntimeState {
    pub fn new(config: AgentRuntimeConfig) -> Self {
        // 根据配置创建 Provider
        let provider = Self::create_provider(config.provider_type, config.api_key);

        Self {
            provider,
            cancellations: Arc::new(RwLock::new(HashSet::new())),
        }
    }

    fn create_provider(provider_type: &str, api_key: String) -> Arc<dyn LlmProvider> {
        match provider_type {
            "zhipu" => Arc::new(zhipu::ZhipuProvider::new(api_key)),
            "deepseek" => Arc::new(deepseek::DeepSeekProvider::new(api_key)),
            "minimax" => Arc::new(minimax::MinimaxProvider::new(api_key)),
            "openai_compatible" => Arc::new(openai_compatible::OpenAICompatibleProvider::new(...)),
            _ => panic!("Unknown provider type: {}", provider_type),
        }
    }
}
```

## SSE Stream Parsing

参考 `kilocode/packages/kilo-vscode/src/services/autocomplete/continuedev/core/fetch/stream.ts`：

```rust
// SSE chunk 解析
fn parse_sse_chunk(line: &str) -> Result<LlmStreamChunk, ProviderError> {
    if line.starts_with("data:[DONE]") || line.starts_with("data: [DONE]") {
        return Ok(LlmStreamChunk {
            content: String::new(),
            is_final: true,
            usage: None,
        });
    }

    if line.starts_with("data:") {
        let json_str = line[5..].trim();
        let chunk: SseChunk = serde_json::from_str(json_str)
            .map_err(|e| ProviderError::ResponseParseError(e.to_string()))?;

        return Ok(LlmStreamChunk {
            content: chunk.choices[0].delta.content.unwrap_or_default(),
            is_final: chunk.choices[0].finish_reason.is_some(),
            usage: chunk.usage.map(|u| TokenUsage {
                prompt_tokens: u.prompt_tokens.unwrap_or(0),
                completion_tokens: u.completion_tokens.unwrap_or(0),
                total_tokens: u.total_tokens.unwrap_or(0),
            }),
        });
    }

    Err(ProviderError::ResponseParseError("Invalid SSE chunk".to_string()))
}
```

## Test Focus

1. **Provider 实现测试**
   - Zhipu/DeepSeek/Minimax 请求格式正确性
   - SSE chunk 解析正确性
   - 错误处理（超时、认证失败等）

2. **配置服务测试**
   - CRUD 操作
   - 加密/解密正确性
   - 多租户隔离

3. **配额服务测试**
   - 配额计算正确性
   - 配额扣减正确性
   - 并发情况处理

## Open Questions

无，所有设计决策已通过苏格拉底式问答确认。
