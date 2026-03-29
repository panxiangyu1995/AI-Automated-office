# Proposal: LLM Provider Plan/Act 双配置模式

## Why

当前 LLM Provider 配置只有一个全局设置，但 AI Agent 在不同阶段对模型能力要求不同：Plan 阶段需要高精度理解任务结构，Act 阶段需要高吞吐执行能力。单一配置无法满足不同阶段的优化需求，且无法实现成本优化（Plan 阶段可用低成本模型）。

**参考来源：** cline 研究（ADR-055），其 Plan/Act 双配置模式已被验证可有效提升 Agent 效率并降低成本。

## What Changes

- 新增 **Plan 模式 Provider 配置**：独立的 Provider、Model、API Key 选择
- 新增 **Act 模式 Provider 配置**：独立的 Provider、Model、API Key 选择
- Plan 模式工具限制：仅允许读取类工具（read、search），禁止写入/执行
- Act 模式工具限制：允许全部工具，按敏感度评估审批
- UI 显示当前所处模式（Plan/Act）
- 后端实现 `RoutingConfig` 结构支持双配置

## Capabilities

### New Capabilities

- `plan-act-dual-config`: LLM Provider Plan/Act 双配置能力
  - 支持分别为 Plan 和 Act 模式配置独立的 Provider/Model/API Key
  - Plan 模式自动限制仅允许读取类工具
  - Act 模式支持全部工具，按敏感度评估审批
  - 运行时根据任务阶段自动切换使用的配置

### Modified Capabilities

- `llm-provider-config`: 现有 LLM Provider 配置能力需要扩展以支持 Plan/Act 双配置结构

## Impact

### 前端

- 设置页面新增 Plan/Act 双配置 UI
- 模型选择器支持按模式筛选
- 当前模式状态显示组件

### 后端

- `ProviderConfig` 结构扩展：`plan_mode_config` / `act_mode_config`
- `LlmAgentProvider` 根据当前阶段选择对应配置
- Tool Pipeline 根据模式限制可用工具

### 数据库

- `provider_config` 表结构变更，添加 `plan_mode_settings` / `act_mode_settings` JSON 字段

### 依赖

- 依赖现有 LLM Provider trait 和 Tool Registry
- 依赖 Tool Pipeline 的敏感度评估机制

### 影响范围

- 主要影响：`src-tauri/src/agent/llm_provider/`
- 次要影响：`src/features/settings/components/` 前端配置 UI
