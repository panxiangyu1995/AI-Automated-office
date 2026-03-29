# Proposal: 路由模式与YOLO Mode

## Why

不同用户场景需要不同的自动化程度：新手需要逐项审批确认，高级用户需要完全自动执行以提升效率。当前审批机制只有二元状态（需要确认/不需要确认），缺少灵活的场景化配置和 YOLO 完全自动模式。

**参考来源：** cline 研究（ADR-056），其 Manual/Auto/Yolo/Hybrid 四档路由模式已被验证可满足不同用户需求。

## What Changes

- 新增 **路由模式四档设计**：
  - 🔒 **Manual（手动）**：每个工具调用都需要用户确认
  - ⚖️ **Auto（自动）**：按敏感度评估自动决定是否需要审批
  - 🚀 **Yolo（完全自动）**：所有工具调用自动执行，无任何阻止
  - 🔀 **Hybrid（混合）**：根据工具类型自动选择模式
- Yolo 模式安全增强：
  - 开启时显示安全警告，需要二次确认
  - 支持设置生效时间限制（单次/1小时/本日/自定义）
- Yolo 模式使用日志记录
- 管理员可禁用 Yolo 模式（强制 Auto/Manual）
- 企业级默认路由策略配置

## Capabilities

### New Capabilities

- `routing-mode`: 路由模式四档控制能力
  - Manual 模式：所有工具调用需用户确认
  - Auto 模式：按敏感度（Low/Medium/High/Critical）自动决定
  - Yolo 模式：完全自动执行，无阻止
  - Hybrid 模式：读取类 Auto，写入类 Manual

- `yolo-mode-security`: YOLO 模式安全控制能力
  - 开启安全警告和二次确认
  - 生效时间限制（TTL）
  - 使用日志审计

- `routing-policy-enterprise`: 企业级路由策略能力
  - 管理员可强制禁用 Yolo 模式
  - 可设置企业默认路由模式

### Modified Capabilities

- `tool-approval-policy`: 现有工具审批策略能力需要扩展，支持路由模式驱动

## Impact

### 前端

- 设置页面新增路由模式选择器（4档）
- Yolo 模式开启的安全确认对话框
- 生效时间选择器组件

### 后端

- `RoutingMode` 枚举：`Manual / Auto / Yolo / Hybrid`
- `AgentConfig` 添加 `routing_mode` 字段
- `ToolPipeline` 根据路由模式决定审批流程
- Yolo 模式日志记录到审计表

### 数据库

- `agent_config` 表添加 `routing_mode` 字段
- `audit_log` 表支持 Yolo 模式事件记录

### 依赖

- 依赖现有 Tool Pipeline 敏感度评估
- 依赖现有审计日志机制

### 影响范围

- 主要影响：`src-tauri/src/agent/tools/pipeline.rs`
- 次要影响：`src/features/settings/components/` 前端配置 UI
