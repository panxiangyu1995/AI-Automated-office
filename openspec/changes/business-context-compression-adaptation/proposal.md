## Why

现有上下文压缩机制基于 Claude Code 的 9 段式设计，但未针对办公场景进行充分适配。AI-Automated-office 作为企业级 ERP 系统，需要处理审批流、文档、多部门协作等复杂业务场景，需要专门的业务压缩策略来保留业务关键信息（如审批状态、部门上下文、关联文档等）。

## What Changes

- 将现有 9 段式压缩结构扩展为 9+X 段式，新增业务专用段（部门上下文、审批链、关联文档等）
- 实现 4 层渐进式压缩策略（业务记忆压缩 → 微压缩 → 业务压缩 → 响应式压缩）
- 新增办公场景专用触发条件（部门切换、审批状态变更、时效阈值）
- 定义 Never Compress 类型（待审批项、表单草稿、审批链状态等）
- 实现业务实体恢复机制，支持按需恢复压缩内容

## Capabilities

### New Capabilities

- `business-memory-compact`: 业务记忆压缩层 - 基于会话记忆优先使用轻量级压缩
- `business-micro-compact`: 业务微压缩层 - 清理过期的业务查询结果、通知等
- `business-context-compact`: 业务全量压缩层 - LLM 生成 9+X 段式摘要
- `business-reactive-compact`: 业务响应式压缩层 - API 错误时的最后防线
- `business-never-compress`: 业务永不压缩规则 - 定义必须保留的业务实体类型
- `business-compression-recovery`: 业务压缩恢复机制 - 支持业务实体按需恢复
- `business-compact-trigger`: 业务压缩触发器 - 部门切换、审批变更、时效阈值

### Modified Capabilities

- `context-compression`: 扩展压缩触发条件和保留规则，支持办公场景

## Impact

**前端 (React/TypeScript):**
- `src/features/agent/services/compact/` - 新增业务压缩服务目录
- `src/features/agent/types/compact.types.ts` - 新增业务压缩类型定义
- `src/features/agent/services/memory/` - 新增业务记忆存储

**后端 (Rust):**
- `src-tauri/src/agent/context_compression.rs` - 扩展支持业务压缩策略
- `src-tauri/src/agent/memory/` - 新增业务记忆模块

**数据库:**
- 新增 `business_context_preserved` 表 - 存储压缩时保留的业务上下文
- 新增 `business_compression_history` 表 - 压缩历史记录

**触发条件:**
- 自动阈值：Token > 上下文窗口 - 15,000
- 部门切换时触发轻量级压缩
- 审批状态变更时触发微压缩
- 30 分钟无操作后首次交互触发

**保留规则:**
- Never Compress: pending_approval, form_draft, current_department_context, user_permission_context
- Compressible: historical_data_query, report_preview, search_results, notification, activity_log
