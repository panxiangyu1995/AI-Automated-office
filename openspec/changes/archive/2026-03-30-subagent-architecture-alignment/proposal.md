## Why

当前 AI-Automated-office 的 SubAgent 架构与 KiloCode 相比存在明显差距：配置管理不灵活、权限模型粗粒度、Agent 分类模糊、切换 UI 体验差。参考 KiloCode 的成熟设计，可以快速提升架构质量和用户体验。

**注意**：我们项目是 **AI 赋能的 ERP 办公系统**，而非代码开发工具。因此 Agent 类型需要适配办公场景，采用精简策略（1-2个核心 Agent），后续按需扩展。

## What Changes

**Phase 1: 基础设施（核心）**
- 新增轻量级 `ModeSwitcher` 组件，集成在聊天输入框旁，支持键盘导航
- 支持从 Markdown + YAML front matter 格式的配置文件加载 Agent 配置
- 引入明确的 Agent Mode 分类：`primary`（主Agent）、`subagent`（子Agent）
- 实现 `PermissionRuleset` 细粒度权限控制系统

**Phase 2: 核心办公 Agent（精简）**
- 定义 **通用助手** (`office-general`)：处理日常办公咨询、跨部门协调
- 定义 **领域专家** (`office-specialist`)：专注特定业务领域（人事/财务/销售等）
- 实现 Agent 模板系统（general/specialist 两种）
- 重构 Agent 注册表 UI

**Phase 3: 扩展能力**
- 实现多层配置合并机制（native → file → user）
- 提供完整的 Agent 创建/编辑/导入/导出 UI
- 后续按需扩展更多业务 Agent

## Capabilities

### New Capabilities

- `subagent-mode-switcher`: 轻量级 ModeSwitcher 组件，支持键盘导航和快捷切换
- `subagent-config-file`: 支持从 Markdown 配置文件加载 Agent 定义
- `subagent-mode-classification`: 明确的 Agent Mode 分类系统（primary/subagent）
- `subagent-permission-ruleset`: 细粒度 PermissionRuleset 权限控制
- `subagent-config-merge`: 多层配置优先级和合并逻辑
- `subagent-registry-ui`: 增强的 Agent 注册表管理界面
- `subagent-template-system`: Agent 模板系统（精简版：general/specialist）

### Modified Capabilities

（暂无现有 spec 需要修改）

## Impact

**后端 (Rust)**:
- `src-tauri/src/agent/routing.rs` - 路由服务重构
- `src-tauri/src/agent/nested.rs` - SubAgent 执行上下文
- 新增 `src-tauri/src/agent/permission.rs` - 权限规则集
- 新增 `src-tauri/src/agent/config_loader.rs` - 配置文件加载器
- 新增 `src-tauri/src/agent/office_agents.rs` - 办公场景 Agent 定义

**前端 (TypeScript/React)**:
- `src/features/chat/components/ModeSwitcher.tsx` - 新增
- `src/features/settings/components/SubAgentRegistry.tsx` - 重构
- `src/features/settings/components/SubAgentPermissionConfig.tsx` - 新增
- `src/features/settings/components/SubAgentTemplateConfig.tsx` - 新增

**配置文件**:
- `openspec/specs/subagent-*/spec.md` - 新增 spec 文档
- `.opencode/agents/*.md` - Agent 配置文件示例

**依赖**:
- 前端依赖：`lucide-react`（已有）、`@radix-ui/*`（已有）
- Rust 依赖：`serde_yaml`（需新增）、`glob`（已有）
