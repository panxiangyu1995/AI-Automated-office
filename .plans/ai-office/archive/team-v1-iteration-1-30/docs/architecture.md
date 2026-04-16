# ai-office - 架构

> 系统架构和关键设计决策。
> 维护者：team-lead, devs（架构变更后更新）

## 系统概览

AI-Automated-office 是一款 AI 赋能的 ERP 系统，采用部门化架构设计。
- 技术栈：Tauri + Rust (桌面端) + React + TypeScript (前端) + Shadcn/ui + Tailwind CSS
- 分层微内核架构：Presentation Layer → Agent Core Layer → Plugin Layer → Data Layer → Cloud Layer
- 核心部门（内置不可卸载）：人事部、审批中心、销售部、财务部、仓储部、管理层
- 扩展部门（按需安装）：售后服务、招投标、市场宣传

## 组件图

- **Presentation Layer**: React 组件 + Shadcn/ui + VSCode 风格四栏布局
  - 主题系统：colorRegistry + 3主题(darkModern/lightModern/highContrast) + 7组件级颜色文件
  - QuickAsk：Ctrl+L 唤起 AI 快捷提问，集成 CommandPalette
  - **ProblemCenter**（C2 新增）：问题中心面板，收集错误/警告/通知，集成BottomPanel
  - **AgentCollaboration**（C3 新增）：群聊Agent协作UI，入群/AI标识/@提及/静默
  - **MessageStatusIndicator**（C3 新增）：消息状态追踪UI（已发送/已送达/已读）
  - **部门路由集成**（C4 新增）：6核心部门(hr/finance/sales/warehouse/approval/knowledge)路由+Sidebar入口
  - **组件集成**（C4 新增）：SyncConflictDialog→SyncStatus, ProblemCenter→BottomPanel, GroupChat→路由
  - **TemplateDesigner UI**（C4 新增）：模板设计器前端(Canvas+图层+属性面板)，调用Tauri命令
- **Agent Core Layer**: LLM 适配器 + 工具系统 + 记忆系统 + 会话管理
  - LLM 适配器：OpenAI Compatible / DeepSeek / Minimax / Zhipu / **DashScope**（C1 新增）
  - 工具系统：6部门工具注册集（finance/hr/sales/approval/warehouse/service），每部门5工具(query/aggregate/mutate/action/export)
  - **群聊Agent协作**（C2 新增）：group_agent.rs 实现 FR634(入群)/FR639(AI标识)/FR641(@提及)/FR640(静默)
  - **SIEM审计**（C4 新增）：audit_siem.rs 桥接审计事件→WebhookService→SIEM端点，JSON+CEF格式
- **Plugin Layer**: 插件管理器 + 注册表 + 加载器 + 依赖管理
- **Data Layer**: SQLite 本地存储 + 增量同步 + **智能冲突解决**（C1 新增）
  - DataSyncEngine：通用数据同步引擎，支持13种业务实体
  - SyncConflictDialog：前端冲突解决UI，支持逐条处理+批量策略
  - **模板存储**（C2 新增）：template_store.rs SQLite存储模板版本，v10_template_tables 迁移
  - **模板Schema+设计器**（C3 新增）：template_schema.rs(JSON/YAML声明式)+template_designer.rs(设计器后端)+template_binding.rs(数据绑定)+v11迁移
- **Cloud Layer**: Go 云端后端 + 多租户 + 认证授权

## 数据流

用户输入 → AI 对话面板 → Agent Core → 工具执行 → 数据层 → UI 更新

- Quick Ask 流：Ctrl+L → QuickAsk → Agent Runtime → 响应
- 数据同步流：本地变更 → DataSyncEngine → 冲突检测 → SyncConflictDialog（如冲突）→ 云端同步

## 技术栈

| 层 | 技术 | 版本 |
|---|------|------|
| 桌面端 | Tauri | 2.x |
| 前端 | React + TypeScript | 18.x / 5.x |
| UI 组件 | Shadcn/ui + Radix UI | latest |
| 样式 | Tailwind CSS | 3.x |
| 图标 | Lucide React | latest |
| 后端 | Rust | stable |
| 云端 | Go | 1.21+ |
| 数据库 | SQLite (本地) + PostgreSQL (云端) | latest |

## 目录结构

参见项目根目录 CLAUDE.md 中的完整目录结构。
