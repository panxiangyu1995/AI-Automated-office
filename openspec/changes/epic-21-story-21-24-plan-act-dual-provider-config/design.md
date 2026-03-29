## Context

当前 AI-Automated-office 的 LLM Provider 配置使用单一配置结构，所有任务阶段使用相同的 Provider 和 Model。但在实际使用中：

1. **Plan 阶段**：需要高精度理解任务结构、分解步骤、评估风险，适合使用高精度低成本模型
2. **Act 阶段**：需要高吞吐执行工具调用、写入文件、调用外部服务，适合使用高性能模型

当前单一配置导致用户必须选择：是使用高精度模型（成本高）还是高性能模型（理解能力可能不足）。

**参考 cline 的实现**：其 Plan/Act 双配置模式已被验证可有效提升 Agent 效率并降低成本。

## Goals / Non-Goals

**Goals:**
- 支持分别为 Plan 和 Act 模式配置独立的 Provider/Model/API Key
- Plan 模式自动限制仅允许读取类工具，禁止写入/执行等高风险操作
- Act 模式支持全部工具，按敏感度评估审批
- 运行时根据任务阶段自动切换使用的配置
- UI 清晰显示当前所处模式

**Non-Goals:**
- 不改变现有 LLM Provider trait 接口
- 不实现 Multi-Agent 协作模式
- 不实现模型动态路由（如根据任务复杂度自动选择）

## Decisions

### Decision 1: ProviderConfig 双配置结构

**选择：** 在 `ProviderConfig` 中添加 `plan_mode` 和 `act_mode` 两个子配置

**理由：**
- 保持向后兼容，现有配置自动作为 act_mode
- plan_mode 可选配置，简化迁移
- 配置集中管理，便于维护

```rust
pub struct ProviderConfig {
    pub plan_mode: Option<ModeConfig>,  // Plan 模式配置（可选）
    pub act_mode: ModeConfig,            // Act 模式配置（必填）
}

pub struct ModeConfig {
    pub provider: String,
    pub model_id: String,
    pub api_key: EncryptedString,
    pub base_url: Option<String>,
}
```

### Decision 2: 模式切换触发点

**选择：** 在 Task 引擎的 `start_task` 和 `execute_plan` 阶段切换

**理由：**
- Plan 阶段：调用 `create_plan` 时使用 plan_mode 配置
- Act 阶段：执行 `execute_tool` 时使用 act_mode 配置
- 清晰区分两个阶段的职责

### Decision 3: Plan 模式工具限制

**选择：** Tool Registry 为工具添加 `is_read_only` 标志，Plan 模式仅允许 `is_read_only=true` 的工具

**理由：**
- 集中管理工具属性，便于审核
- 动态计算可用工具集，而不是硬编码列表
- 与敏感度评估机制独立，互不干扰

```rust
pub struct ToolDescriptor {
    pub id: String,
    pub capabilities: ToolCapabilities {
        pub is_read_only: bool,  // Plan 模式可用
        pub requires_confirmation: bool,
        // ...
    },
}
```

### Decision 4: 前端配置 UI

**选择：** 在现有 Provider 配置页面添加 Plan/Act 模式切换 Tab

**理由：**
- 保持与现有 UI 一致性
- 用户可直观对比两种配置的差异
- 减少学习成本

## Risks / Trade-offs

| Risk |可能性 | 影响 | Mitigation |
|------|--------|------|------------|
| Plan 模式模型理解能力不足 | 低 | 生成的计划质量下降 | 提供足够的模型选项，默认使用 Claude Haiku |
| 配置复杂度增加 | 中 | 用户困惑 | 提供合理的默认配置，UI 清晰说明 |
| 模式切换延迟 | 低 | 任务执行变慢 | 预热两个配置的连接池 |
| API Key 管理复杂度 | 中 | 安全风险 | 统一加密存储，按需解密 |

## Migration Plan

1. **阶段1（向后兼容）**：
   - 添加 `plan_mode: Option<ModeConfig>` 字段，默认 None
   - None 时使用 act_mode 作为默认配置

2. **阶段2（UI 引导）**：
   - 配置页面添加 "Plan 模式配置" Tab（默认折叠）
   - 引导用户为 Plan 阶段选择独立配置

3. **阶段3（工具限制）**：
   - Tool Registry 添加 `is_read_only` 标志
   - Plan 模式执行时过滤可用工具集

## Open Questions

1. Plan 模式的上下文窗口如何设置？（与 Act 模式共用还是独立？）
2. 是否需要支持 Plan/Act 模式的手动切换（用户强制使用某模式）？
3. 两种配置的 API Key 是否可以共用？
