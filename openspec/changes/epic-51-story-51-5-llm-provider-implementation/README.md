# Story 51.5: 真实 LLM Provider 实现

## 变更概述

本变更是 Epic 51 (Agent 核心能力) 的 Story 51.5，旨在实现真实的 LLM Provider 接入，移除 MockProvider，使 Agent 能够调用真实的 LLM API。

## 核心内容

1. **Provider 模块骨架**
   - `LlmProvider` trait 定义
   - `ProviderError` 错误类型
   - Provider 工厂模式

2. **四个 Provider 实现**
   - Zhipu Provider (MVP)
   - DeepSeek Provider
   - Minimax Provider
   - OpenAI 兼容 Provider (支持本地部署)

3. **配置与配额服务**
   - `ProviderConfigService`: 配置 CRUD + 加密存储
   - `QuotaService`: 平台官方 API 配额管理
   - `CryptoService`: Cross-platform API Key 加密

4. **MockProvider 移除**
   - 从 `AgentRuntimeState::new()` 移除 MockProvider
   - 支持动态 Provider 配置注入

## 架构遵循

- **ADR-054**: LLM API 三级配置体系
  - Level 1: 平台官方 API (云端管理)
  - Level 2: 租户级配置 (管理员统一)
  - Level 3: 用户级配置 (员工自选)

- **ADR-017**: Tool Calling 2.0
  - 所有 Provider 支持工具调用
  - 流式输出支持

## 技术决策

| 决策点 | 选择 |
|-------|------|
| 流式协议 | SSE (Server-Sent Events) |
| API Key 加密 | Cross-platform (DPAPI/Keychain/libsecret) |
| 配额控制 | 平台官方 API，配额超限拒绝 |
| 用户自配置 | 仅记录用量，不限制 |
| 本地部署 | OpenAI 兼容格式，无认证 |

## 文件结构

```
src-tauri/src/agent/provider/
├── mod.rs                    # 模块入口
├── trait.rs                  # LlmProvider trait
├── error.rs                  # ProviderError
├── config.rs               # ProviderConfigService
├── quota.rs                 # QuotaService
├── crypto.rs               # CryptoService
├── zhipu.rs                 # ZhipuProvider
├── deepseek.rs              # DeepSeekProvider
├── minimax.rs              # MinimaxProvider
└── openai_compatible.rs   # OpenAICompatibleProvider
```

## 依赖

- `reqwest`: HTTP 客户端
- `tokio-stream`: 流式处理
- `thiserror`: 错误处理
- `serde`: 序列化
- `uuid`: ID 生成

## 测试策略

1. **单元测试**: 每个 Provider 的请求/响应解析
2. **集成测试**: Provider 与 Orchestrator 的集成
3. **E2E 测试**: Mock LLM Server + 完整链路

## 状态

- [x] Proposal 已创建
- [x] Design 已创建
- [ ] Tasks 已创建
- [ ] Specs 已创建
- [ ] 实现中
- [ ] 测试中
- [ ] 完成

## 相关文档

- [ADR-054: LLM API 三级配置体系](../../../../planning-artifacts/architecture.md)
- [Story 51.1: Rust agent core and orchestrator](../epic-51-story-51-1-agent-orchestrator-core/README.md)
- [Story 51.4: Chat host integration](../epic-51-story-51-4-e2e-testing-framework/README.md)
