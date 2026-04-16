# C1 差距分析报告：铁律文档 vs 代码实际

> 作者: researcher
> 日期: 2026-04-16
> 状态: 完成（v2 - 按CRITICAL/HIGH/MEDIUM/LOW分级）

---

## 执行方法

1. 读取 5 份铁律文档（PRD、架构、UX、Epic、测试规范）关键章节
2. 扫描项目代码结构（src/ + src-tauri/ + tests/ + cloud-server/）
3. 逐维度对比：颜色系统、工具命名、LLM适配器、数据同步、测试覆盖、模板系统、群聊、记忆、审计、Quick Ask、布局尺寸
4. Grep 统计关键指标

---

## TOP 10 差距汇总表

| # | 维度 | 严重度 | 差距描述 | 铁律来源 | 代码现状 | 修复建议 |
|---|------|--------|---------|---------|---------|---------|
| G1 | 颜色硬编码 | **CRITICAL** | 135文件/1350处硬编码hex颜色，主题切换对大部分组件无效 | UX规范：颜色通过colorRegistry注册，使用`var(--ao-{id})` | 仅9文件/156处使用`var(--ao-*)`；核心布局7组件全部硬编码 | 全量替换为CSS变量，优先7个布局组件 → 高频feature → 剩余 |
| G2 | 工具命名规范 | **HIGH** | hr/sales/approval/warehouse/service 部门缺少5工具注册集 | 架构ADR-017: `{plugin}_{entity}_{action}`; ADR-025: 每部门5工具 | finance已合规；其余5部门有commands.rs但无tools/注册 | 为5部门创建tools/子目录，注册query/aggregate/mutate/action/export |
| G3 | DashScope适配器 | **HIGH** | 缺少百炼(DashScope) LLM适配器 | 架构ADR-009; PRD要求支持百炼 | llm_provider/仅openai_compatible/deepseek/minimax/zhipu | 新增dashscope.rs，复用openai_compatible基座 |
| G4 | 数据同步冲突解决 | **HIGH** | 仅消息同步，缺通用数据同步引擎和冲突解决UI | 架构ADR-003智能冲突解决; PRD FR40/FR41 | sync/仅message_sync(4种策略)+offline_queue | 扩展sync为通用引擎，前端加SyncConflictDialog |
| G5 | 测试覆盖 | **HIGH** | 6个核心部门模块无单元测试 | 测试规范：单元>=80%集成>=60% | 单元36文件/3029断言(仅agent/session/streaming)；部门模块0测试 | 优先补充hr/sales/warehouse/approval/service/finance单元测试 |
| G6 | Quick Ask缺失 | **HIGH** | Epic要求Command Palette/Quick Ask/Quick Open统一入口，Quick Ask未实现 | Epic Story 1.x: 命令中心与Quick Ask | CommandPalette已实现；Quick Ask(AI快捷提问)不存在 | 实现Quick Ask组件，集成到CommandPalette |
| G7 | AI面板尺寸偏差 | **MEDIUM** | Epic要求AI面板300-500px，代码实际400-600px | Epic Story 1.4验收标准 | AiChatPanel: minWidth=400, maxWidth=600 | 调整为minWidth=300, maxWidth=500 |
| G8 | 模板系统不完整 | **MEDIUM** | 缺Canvas即时渲染+模板设计器+Schema定义 | PRD FR1200-FR1302; 架构ADR-035/036/037 | editorRegistry.ts+templateVersionStore.ts(localStorage) | 实现模板Schema + Canvas渲染层 + 设计器UI |
| G9 | 群聊Agent协作 | **MEDIUM** | Agent入群/静默/@提及/任务通知未实现 | PRD FR631-FR649(19条需求) | GroupChat.tsx/PrivateChat.tsx存在但核心行为缺失 | 逐步实现群聊Agent行为规范 |
| G10 | 审计日志增强 | **LOW** | 基础已具备，缺SIEM导出和全局策略配置UI | PRD FR1500+ | audit/模块完整(AuditPage/Table/FilterBar/ExportButton); toolAuditLog.ts完整 | 补充SIEM导出和策略配置UI |

---

## 详细分析（每个差距含：铁律来源 + 代码现状 + 严重度 + 修复建议）

### G1: 颜色硬编码 [CRITICAL]

**铁律来源：**
- UX规范：颜色通过`src/theme/colorRegistry.ts`注册，使用`var(--ao-{id})`格式引用
- UX规范原则7：UI占位不用模拟数据
- UX规范体验原则1：固定壳层优先（颜色系统是壳层基础设施）

**代码现状：**
- `src/theme/` 已建立完整体系：colorRegistry.ts、colorTypes.ts、ThemeProvider.tsx、colors/(baseColors/cardColors/sidebarColors/topbarColors/buttonColors)
- `var(--ao-*)` 引用：**9文件/156处**
- 硬编码 hex 颜色：**135文件/1350处**
- 核心布局7组件全部硬编码：ActivityBar(#1C2128), Sidebar(#30363D), TopBar(100处硬编码), StatusBar(#161B22/#8B949E), AiChatPanel(#0F1419/#30363D), Workbench, TabBar, BottomPanel
- 品牌色 #1E3A5F 仅在 PluginRecommendationCard.tsx 中出现2处

**影响：**
- 主题切换（深色/浅色/高对比度）对90%+组件无效
- 品牌色一致性无法保证
- UX规范合规性严重不足

**修复建议：**
1. Phase 1: 核心7个布局组件接入colorRegistry（替换所有硬编码）
2. Phase 2: 高频feature组件（agent/、settings/、session/）
3. Phase 3: 剩余组件批量替换
4. 工具：编写脚本扫描`#[0-9A-Fa-f]{6}`并输出替换清单

---

### G2: 工具命名规范 [HIGH]

**铁律来源：**
- 架构ADR-017：工具命名采用`{plugin}_{entity}_{action}`格式
- 架构ADR-025：每部门最多5个核心工具（query/aggregate/mutate/action/export），参数化设计避免工具爆炸

**代码现状：**
- Finance工具已合规：`src-tauri/src/agent/tools/finance/` 下有 aggregate.rs/query.rs/mutate.rs/ocr.rs/export_report.rs + register.rs + permission.rs
- 其余5个核心部门在Rust后端有commands.rs但**无tools/子目录**：
  - `src-tauri/src/hr/` — commands.rs存在，无tools/
  - `src-tauri/src/sales/` — commands.rs存在，无tools/
  - `src-tauri/src/approval/` — commands.rs存在，无tools/
  - `src-tauri/src/warehouse/` — commands.rs存在，无tools/
  - `src-tauri/src/service/` — commands.rs存在，无tools/
- 通用工具存在但未按部门命名：automation/(cron)、memory/(get/search)、browser/、filesystem/

**修复建议：**
为每个部门创建 `src-tauri/src/agent/tools/{department}/` 子目录，注册5工具集：
- hr: hr_employee_query, hr_employee_aggregate, hr_employee_mutate, hr_attendance_action, hr_report_export
- sales: sales_customer_query, sales_opportunity_aggregate, sales_order_mutate, sales_quotation_action, sales_report_export
- approval: approval_flow_query, approval_flow_aggregate, approval_flow_mutate, approval_batch_action, approval_report_export
- warehouse: warehouse_inventory_query, warehouse_inventory_aggregate, warehouse_inventory_mutate, warehouse_movement_action, warehouse_report_export
- service: service_ticket_query, service_ticket_aggregate, service_ticket_mutate, service_dispatch_action, service_report_export

---

### G3: DashScope适配器 [HIGH]

**铁律来源：**
- 架构ADR-009：LLM接入采用适配器模式，以OpenAI兼容格式为基准
- PRD：支持百炼、智谱AI、Minimax、DeepSeek等国内模型

**代码现状：**
- `src-tauri/src/agent/llm_provider/` 目录：openai_compatible.rs、deepseek.rs、minimax.rs、zhipu.rs、provider_trait.rs、provider_manager.rs、config.rs、crypto.rs、quota.rs、token_cache.rs
- **缺少 dashscope.rs**
- failover.rs 有 dashscope 字符串引用，但仅为故障转移配置

**修复建议：** 新增 dashscope.rs，DashScope 兼容 OpenAI 格式，可复用 openai_compatible 基座，主要差异在 endpoint URL 和认证头

---

### G4: 数据同步冲突解决 [HIGH]

**铁律来源：**
- 架构ADR-003：数据存储采用本地优先 + 增量同步 + 智能冲突解决策略
- PRD FR38：用户的重要数据可以实时同步到云端
- PRD FR40：系统可以检测和处理数据同步冲突
- PRD FR41：用户可以选择保留冲突数据的版本

**代码现状：**
- `src-tauri/src/sync/` 仅含3文件：message_sync.rs、offline_queue.rs、mod.rs
- message_sync.rs 定义了 ConflictResolution 枚举（LastWriteWins/KeepLocal/KeepRemote/KeepBoth），但仅用于消息同步
- 前端仅有 SubAgentPersistence.tsx 中有冲突相关文本
- **缺少**：通用数据同步引擎（非仅消息）、冲突检测UI、用户选择界面、增量同步协议

**修复建议：**
1. 扩展 sync 模块为通用 DataSyncEngine trait（支持业务实体同步）
2. 前端增加 SyncConflictDialog 组件（展示冲突双方、用户选择策略）
3. 实现增量同步协议（基于timestamp的delta sync）

---

### G5: 测试覆盖 [HIGH]

**铁律来源：**
- 测试规范：单元测试 >= 80%，集成测试 >= 60%，E2E核心流程100%
- 测试规范：分层测试策略（单元 → 集成 → E2E）
- 测试规范：新功能必须包含对应测试

**代码现状：**
- 单元测试：36文件/3029断言 — 主要覆盖 agent/session/streaming/cards/message
- 集成测试：36文件/574断言 — 覆盖编辑器/通信/表单/设置/离线/硬件
- E2E测试：16文件/315断言 — 覆盖冒烟/韧性/管理/可访问性
- **缺失覆盖**（6个核心部门模块）：
  - HR（EmployeeList/EmployeeCard/EmployeeDirectory）— 0测试
  - Sales（SalesPilotIntegration/hooks）— 0测试
  - Warehouse（LocationList/MovementList/WarningList/LogisticsTracking）— 0测试
  - Approval（ApprovalPilotIntegration/FlowTimeline）— 0测试
  - Service（TicketList）— 0测试
  - Finance前端（FinancePanel/FinancePilotIntegration）— 0测试

**修复建议：** 优先为6个核心部门模块补充单元测试（hooks + 组件render）

---

### G6: Quick Ask缺失 [HIGH]

**铁律来源：**
- Epic Story 1.x：命令中心与最近上下文——将 Command Palette / Quick Ask / Quick Open 收敛为统一入口
- PRD/UX：命令即入口，Command Center / Quick Ask / Quick Open 应成为长尾功能统一入口

**代码现状：**
- CommandPalette.tsx 已实现（VSCode式命令面板，支持分类/搜索/执行）
- CommandRegistry + systemCommands 已实现
- **Quick Ask 不存在**——AI快捷提问入口（用户直接输入自然语言，AI理解并执行）
- Quick Open 功能由 CommandPalette 的文件导航部分承担

**修复建议：** 实现 Quick Ask 组件——在 CommandPalette 中增加 AI 提问模式（前缀 `?` 或独立快捷键），将输入直接转发给 Agent Runtime

---

### G7: AI面板尺寸偏差 [MEDIUM]

**铁律来源：**
- Epic Story 1.4 验收标准：AI对话面板（右侧，300-500px，可折叠）

**代码现状：**
- AiChatPanel.tsx: minWidth=400, maxWidth=600

**修复建议：** 调整为 minWidth=300, maxWidth=500，与Epic验收标准对齐

---

### G8: 模板系统不完整 [MEDIUM]

**铁律来源：**
- PRD FR1200-FR1302（90条需求）：编辑器架构、内置编辑器、即时渲染引擎、动态模板系统、模板设计器、模板库
- 架构ADR-035：编辑器系统采用"注册表 + 解析器 + 编辑器宿主"三段式
- 架构ADR-036：动态模板运行时采用"模板Schema + 数据绑定层 + Canvas渲染层"
- 架构ADR-037：模板设计器与模板库归属于平台公共能力

**代码现状：**
- editorRegistry.ts：注册/解析/宿主三段式已实现 [ADR-035 合规]
- templateVersionStore.ts：版本管理使用 localStorage（应使用SQLite）
- 内置编辑器测试存在（text/markdown/json）
- **缺少**：Canvas即时渲染、模板设计器UI、模板Schema定义语言、模板库与扩展API、数据绑定层

**修复建议：** 实现模板Schema(JSON/YAML声明式) + Canvas渲染层 + 设计器UI + 数据绑定层

---

### G9: 群聊Agent协作 [MEDIUM]

**铁律来源：**
- PRD FR631-FR649：群聊协作19条需求（Agent入群/静默/@提及/任务通知/数据卡片/发言权限/私密群等）

**代码现状：**
- GroupChat.tsx 和 PrivateChat.tsx 存在
- Agent入群/静默/@提及/任务状态通知/数据卡片补充/工作进度汇报/下游通知/发言权限/私密群——**全部未实现**

**修复建议：** 按优先级逐步实现：FR634(自动入群) → FR639(AI标识) → FR641(@提及响应) → FR640(默认静默) → FR642-645(主动通知)

---

### G10: 审计日志增强 [LOW]

**铁律来源：**
- PRD FR1500+：审计日志增强需求

**代码现状：**
- 前端 audit/ 模块完整：AuditPage/AuditLogTable/AuditFilterBar/AuditExportButton/AuditLogDetail
- Rust audit.rs + audit_tests.rs 存在
- toolAuditLog.ts 工具调用审计已实现
- fieldActionAuthorization.ts 字段操作审计已实现
- traceAndStepLog.ts Trace/Span审计已实现

**缺失：** 全局审计策略配置UI、审计数据导出到外部SIEM

**修复建议：** 补量优先级，审计基础已具备，SIEM导出可后续迭代

---

## 正面发现（已合规项，18项）

1. **VSCode式四栏布局**：TopBar + ActivityBar + Sidebar + Workbench + AiChatPanel + StatusBar 全部实现
2. **AI一级入口**：AiChatPanel 支持Ctrl+Shift+I快捷键，SessionPanel集成
3. **CommandPalette**：已实现命令面板（分类/搜索/执行/快捷键）
4. **事件总线**：EventBusImpl 完整实现（发布/订阅/通配符/类型安全）
5. **服务容器**：ServiceContainerImpl 完整实现（DI/单例/循环检测）
6. **权限系统**：PermissionGuard + usePermission + permissionStore + RBAC types 全链路实现
7. **多租户**：tenantId 在33个前端文件中使用，Rust tenant/ 模块完整
8. **加密存储**：Rust crypto/local_encryptor.rs + llm_provider/crypto.rs，前端35个文件引用加密
9. **检查点系统**：useAutoCheckpoint + CheckpointMarker + RestoreDialog + EditRetryDialog + GitStore 完整
10. **上下文压缩**：useContextCompression + CompressionConfigPanel + CompressionMemoryHints + CompressionStatusIndicator 完整
11. **Sub-Agent系统**：SubAgentDelegatePanel + SubAgentRegistry + SubAgentManagement + Rust subagent/ 完整
12. **LLM适配器**：OpenAI兼容 + DeepSeek + Minimax + Zhipu 4个已实现
13. **MCP系统**：Rust mcp/ 完整（bridge/client/engine/manager/protocol/registry/store/transport）
14. **知识库RAG**：Rust knowledge/ 完整（BM25/chunker/embedding/parser/pipeline/retrieval）
15. **编辑器注册**：editorRegistry.ts 三段式架构已实现 [ADR-035]
16. **部门权限模型**：department/registry.rs + department/types.rs + 前端 permission/ 完整
17. **ClawHub兼容**：capability/clawhub_adapter/ 存在
18. **插件系统**：capability/(lifecycle/loader/marketplace/registry/sandbox) 完整

---

## C1 轮优先修复排序

| 序号 | 差距ID | 严重度 | 修复内容 | 预估工作量 | 涉及层 |
|------|--------|--------|---------|-----------|--------|
| 1 | G1 | CRITICAL | 颜色系统全量接入（7核心布局 + 高频feature） | 中 | 前端 |
| 2 | G2 | HIGH | 部门工具注册（5部门 × 5工具 = 25个工具） | 中 | Rust后端 |
| 3 | G3 | HIGH | DashScope适配器 | 小 | Rust后端 |
| 4 | G6 | HIGH | Quick Ask组件 | 小 | 前端 |
| 5 | G7 | MEDIUM | AI面板尺寸修正(400-600→300-500) | 极小 | 前端 |
| 6 | G4 | HIGH | 通用数据同步引擎 + 冲突解决UI | 大 | Rust+前端 |
| 7 | G5 | HIGH | 核心部门模块单元测试(6模块) | 中 | 测试 |
| 8 | G8 | MEDIUM | 模板系统完善（Schema+Canvas+设计器） | 大 | 前端+Rust |
| 9 | G9 | MEDIUM | 群聊Agent协作行为 | 中 | 前端+Rust |
| 10 | G10 | LOW | 审计SIEM导出 | 小 | Rust |

---

## 标签

[RESEARCH] [ARCHITECTURE] [GAP-ANALYSIS]
