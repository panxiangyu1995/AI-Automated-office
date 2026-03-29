# Proposal: 真实 LLM Provider 实现

## Change Type
- feature

## Background

Story 51.1-51.4 已实现真实的 Agent 执行循环框架，但目前使用 MockProvider 返回预设模拟内容。本变更旨在实现真实的 LLM Provider接入，使 Agent 能够调用真实的 LLM API。

本变更遵循 ADR-054（LLM API三级配置体系）和 ADR-017（Tool Calling 2.0）的架构决策。

## Scope

### In Scope

1. **Provider 模块骨架**
   - 创建 `src-tauri/src/agent/provider/` 目录
   - 定义 `LlmProvider` trait（支持同步/流式调用）
   - 定义 `ProviderError` 错误类型

2. **Zhipu Provider 实现** (MVP)
   - 实现 `ZhipuProvider`
   - 支持 Chat Completions API
   - 支持 Tool Calling 2.0

3. **DeepSeek Provider 实现**
   - 实现 `DeepSeekProvider`
   - OpenAI 兼容格式

4. **Minimax Provider 实现**
   - 实现 `MinimaxProvider`

5. **OpenAI 兼容 Provider 实现**
   - 支持本地部署（Ollama 等）
   - 支持自定义 API Endpoint

6. **Provider 配置管理**
   - `ProviderConfigService`：配置 CRUD + 加密存储
   - SQLite 本地存储（API Key 加密）
   - Cross-platform 可逆加密（密钥存系统密钥链）

7. **官方 API Token 管理**
   - 云端 Token 缓存
   - 启动时刷新 + 定期轮询机制

8. **配额服务**
   - `QuotaService`：平台官方 API 配额检查与扣减
   - 三级配额：平台配额 / 租户配额 / 用户配额 / 模型配额
   - 用户自配置 API：仅记录用量，不限制

9. **MockProvider 移除**
   - 从 `AgentRuntimeState::new()` 移除 MockProvider
   - 保留 MockProvider 代码（测试用）

### Out of Scope

- 前端 SettingsProviders UI（另起 Epic）
- LLM 调用日志持久化（另起 Epic）
- 多 Provider 自动 Fallback 策略（未来版本）

## Architecture

### 三级配置体系 (ADR-054)

```
Level 1: 平台官方 API
  └─ 云端管理 Token，租户启动时获取
Level 2: 租户级配置
  └─ 租户管理员统一配置 API Key
Level 3: 用户级配置
  └─ 员工自选，API Key 存本地
```

### Provider 选择优先级

用户指定 > 租户级固定 > 平台官方

### 数据模型

```sql
-- Provider 配置表
CREATE TABLE provider_configs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT,               -- NULL = 平台官方
    user_id TEXT,                 -- NULL = 租户级
    provider_type TEXT NOT NULL,   -- 'zhipu' | 'minimax' | 'deepseek' | 'custom'
    provider_name TEXT NOT NULL,
    api_endpoint TEXT,            -- 自定义 provider 必须
    api_key_encrypted TEXT,       -- Cross-platform 加密存储
    is_enabled INTEGER DEFAULT 1,
    is_official INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 100,
    config_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    is_deleted INTEGER DEFAULT 0
);

-- 平台官方 API 配额表
CREATE TABLE platform_quotas (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    monthly_limit_tokens INTEGER NOT NULL,
    monthly_used_tokens INTEGER DEFAULT 0,
    reset_day INTEGER DEFAULT 1,
    last_reset_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 租户内用户配额表
CREATE TABLE tenant_user_quotas (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    monthly_limit_tokens INTEGER NOT NULL,
    monthly_used_tokens INTEGER DEFAULT 0,
    reset_day INTEGER DEFAULT 1,
    last_reset_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(tenant_id, user_id)
);

-- 模型级配额表
CREATE TABLE model_quotas (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    model_name TEXT NOT NULL,
    monthly_limit_tokens INTEGER NOT NULL,
    monthly_used_tokens INTEGER DEFAULT 0,
    reset_day INTEGER DEFAULT 1,
    last_reset_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    UNIQUE(tenant_id, provider_type, model_name)
);

-- 用户自配置 API 用量记录表
CREATE TABLE user_api_usage (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    provider_type TEXT NOT NULL,
    model_name TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    recorded_at INTEGER NOT NULL
);
```

## Technical Design

### Provider Trait

```rust
#[async_trait]
pub trait LlmProvider: Send + Sync {
    fn provider_id(&self) -> &str;
    fn provider_name(&self) -> &str;
    async fn health_check(&self) -> Result<bool, ProviderError>;
    async fn complete(&self, request: LlmRequest) -> Result<LlmResponse, ProviderError>;
    async fn complete_stream(&self, request: LlmRequest) -> Result<Box<dyn Stream<Item = Result<LlmStreamChunk, ProviderError>> + Send>, ProviderError>;
    fn supports_streaming(&self) -> bool { true }
    fn supports_tools(&self) -> bool { true }
}
```

### 流式输出

- 协议：Server-Sent Events (SSE)
- 参考：kilocode streaming.md
- 实现：`tokio_stream::wrappers::BroadcastStream` 或自定义 SSE 解析

### 加密策略

**用户自配置 API Key：**
- Cross-platform 可逆加密
- 加密密钥存储在系统密钥链（Windows: DPAPI 封装）
- 本地 SQLite 存储加密后的 Key

**官方 API Token：**
- 云端管理，本地缓存
- 启动时获取 + 定期轮询过期时间

### 配额检查流程

```
请求到达
    ↓
检查平台官方配额 (如果有)
    ↓
检查租户配额
    ↓
检查用户配额
    ↓
检查模型配额
    ↓
通过 → 扣减配额 → 调用 LLM
失败 → 返回 QuotaExceeded 错误
```

## Dependencies

- Story 51.1 (已完成)
- Story 51.2 (已完成)
- Story 51.3 (已完成)
- Story 51.4 (已完成)

## Risks

1. **Provider API 兼容性**
   - 不同 Provider 的 API 格式略有差异
   - 需要为每个 Provider 单独适配

2. **配额同步延迟**
   - 本地配额扣减后，云端同步可能有延迟
   - 需要处理并发情况下的配额超限

3. **Token 计算差异**
   - 不同 Provider 的 Token 计算方式可能不同
   - 需要以 Provider 返回的 usage 为准

## Testing Strategy

1. **单元测试**
   - 每个 Provider 的请求/响应解析
   - 配额计算逻辑
   - 加密/解密功能

2. **集成测试**
   - Provider 与 Orchestrator 的集成
   - 配置服务的 CRUD
   - 配额检查流程

3. **E2E 测试**
   - 使用 Mock Server 模拟 Provider 响应
   - 验证完整请求-响应链路
