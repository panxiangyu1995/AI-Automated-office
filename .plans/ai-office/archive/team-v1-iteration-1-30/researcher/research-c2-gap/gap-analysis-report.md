# C2 差距分析报告：铁律文档 vs C1后代码实际

> 作者: researcher
> 日期: 2026-04-16
> 状态: 完成
> 基线: C1修复后的代码

---

## C1修复确认

| C1差距 | C1状态 | C2验证结果 |
|--------|--------|-----------|
| G1 颜色硬编码 | **部分修复** | 核心8布局组件hex=0，已全接入`var(--ao-*)`。总：98文件/848处var vs 56文件/847处hex。Hex分类：theme/(625合规) + ui/(170需评估) + features/(86需修复) + remotion/(23非关键) |
| G2 工具命名 | **已修复** | hr/sales/approval/warehouse/service 各含query/aggregate/mutate/action/export+register |
| G3 DashScope | **已修复** | llm_provider/dashscope.rs 已创建 |
| G4 同步冲突 | **已修复** | data_sync.rs + SyncConflictDialog.tsx + sync/types.ts 已创建 |
| G5 测试覆盖 | **部分修复** | 部门types测试已补充(hrTypes/salesTypes/warehouseTypes/approvalTypes/serviceTypes/financeTypes/syncConflictTypes)。单元45文件/3199断言(原36/3029)。但组件级测试仍缺失 |
| G6 Quick Ask | **已修复** | QuickAsk.tsx 已创建，接入AppLayout |
| G7 面板尺寸 | **已修复** | AiChatPanel: minWidth=300, maxWidth=500 |

---

## TOP 10 C2 差距

| # | 维度 | 严重度 | 差距描述 | 铁律来源 | 代码现状 | 修复建议 |
|---|------|--------|---------|---------|---------|---------|
| H1 | 非主题文件颜色硬编码 | **HIGH** | features/(86处hex) + components/ui/(170处hex)仍硬编码。LoginForm(17)/OrgChart(6)/permission.types(6)/department.types(6)/shadcn-ui(menubar/dropdown/select等170处) | UX规范：颜色通过colorRegistry | features/86处+ui/170处hex；theme/625处合规(定义文件) | 优先修复features/(auth+admin+permission)，其次评估shadcn/ui |
| H2 | 模板系统不完整 | **HIGH** | 缺Canvas即时渲染+模板设计器+Schema定义。仅editorRegistry+templateVersionStore(localStorage)存在 | PRD FR1200-FR1302; 架构ADR-035/036/037 | 无TemplateSchema/CanvasRender/templateDesigner | 实现Schema(JSON/YAML)+Canvas渲染+设计器UI |
| H3 | 群聊Agent协作 | **HIGH** | GroupChat仅覆盖FR613-FR619(消息操作)。FR631-FR649的19条Agent协作需求(入群/静默/@提及/任务通知)全部未实现 | PRD FR631-FR649 | GroupChat.tsx存在，无Agent行为逻辑 | 逐步实现FR634→FR639→FR641→FR640→FR642-645 |
| H4 | 部门组件测试 | **HIGH** | types测试已有，但组件render/交互测试缺失。EmployeeList/SalesPilot/WarehousePages/ApprovalFlow/TicketList等核心组件无测试 | 测试规范：单元>=80% | 6个部门types测试已补充，组件测试0 | 为6部门核心组件补充render/交互测试 |
| H5 | 问题中心缺失 | **MEDIUM** | PRD/UX要求Problem Center/Issues Panel（收集错误、警告、通知），代码中不存在 | PRD工作台体验增强 | 无ProblemCenter/IssuePanel组件 | 实现ProblemCenter面板，集成StatusBar |
| H6 | 自定义字段系统 | **MEDIUM** | PRD定义"自定义字段与AI字段感知"能力，代码中无CustomField/AI字段感知实现 | PRD FR补充章节 | 无CustomField/AI字段相关代码 | 实现字段Schema+AI感知+动态表单集成 |
| H7 | 模板存储应SQLite | **MEDIUM** | templateVersionStore.ts使用localStorage，架构要求本地优先SQLite存储 | 架构ADR-003本地优先 | localStorage存储模板版本 | 迁移到SQLite，通过Rust后端存储 |
| H8 | 群聊消息状态 | **MEDIUM** | PRD FR622-630要求消息状态追踪(已发送/已送达/已读)+多端同步+撤回+编辑。GroupChat无状态追踪 | PRD FR622-FR630 | 无消息状态追踪UI | 实现MessageStatus组件+同步逻辑 |
| H9 | 工作场景恢复 | **LOW** | PRD/UX要求"工作场景恢复"（保留布局状态+对话上下文+部门入口+最近工作区）。layoutPresetStore存在但场景恢复不完整 | PRD工作台体验增强 | layoutPresetStore.ts存在，部分布局持久化 | 补量现有实现，补充场景恢复逻辑 |
| H10 | 审计SIEM导出 | **LOW** | 审计基础已具备，缺SIEM导出和全局策略配置UI | PRD FR1500+ | audit/模块完整，toolAuditLog完整 | 补量优先级，后续迭代 |

---

## 详细分析

### H1: Feature组件颜色硬编码 [HIGH]

**铁律来源：** UX规范：颜色通过colorRegistry注册，使用`var(--ao-{id})`

**C1修复效果：**
- 核心8布局组件：hex=0，全部接入`var(--ao-*)` [已修复]
- 整体：`var(--ao-*)` 从9文件/156处 → 56文件/847处（+441%）
- 整体：硬编码hex从135文件/1350处 → 98文件/848处（-37%）

**C2剩余（13文件/55处）：**
- `auth/components/LoginForm.tsx` — 17处（#4F46E5/#111827/#6B7280等，浅色主题专用色）
- `auth/pages/LoginPage.tsx` — 1处（渐变#4F46E5→#7C3AED）
- `admin/components/OrgChart/OrgChartNode.tsx` — 6处（#1E3A5F品牌色）
- `admin/components/OrgChart/OrgChartToolbar.tsx` — 2处（#1E3A5F）
- `admin/components/OrgChart/OrgChartTree.tsx` — 1处（#D1D5DB）
- `admin/components/OrgChart/OrgChart.tsx` — 2处（#1E3A5F/#F9FAFB）
- `admin/pages/OrganizationPage.tsx` — 2处（#F9FAFB/#1E3A5F）
- `admin/pages/UserListPage.tsx` — 1处（#1E3A5F）
- `permission/types/permission.types.ts` — 6处（角色色#4B5563/#92400E/#166534等）
- `department/types/department.ts` — 6处（部门色#4F46E5/#059669等）
- `warehouse/pages/LocationListPage.tsx` — 1处
- `session/components/IntentParsing.tsx` — 9处
- `session/components/ModuleCapabilityStatus.tsx` — 1处

**修复建议：** 优先处理admin(#1E3A5F品牌色集中)和auth(LoginForm浅色主题专用色)

---

### H2: 模板系统不完整 [HIGH]

**铁律来源：** PRD FR1200-FR1302（90条需求）；架构ADR-035/036/037

**代码现状：**
- editorRegistry.ts：注册/解析/宿主三段式已实现 [ADR-035 合规]
- templateVersionStore.ts：版本管理使用localStorage（应为SQLite）
- WorkCardMessage.tsx + workcard/ 模块：工作卡片消息类型已实现
- **缺少**：TemplateSchema定义语言、Canvas即时渲染层、模板设计器UI、数据绑定层、模板库与扩展API

**修复建议：** 优先实现TemplateSchema(JSON/YAML声明式) + 数据绑定层，Canvas和设计器可后续迭代

---

### H3: 群聊Agent协作 [HIGH]

**铁律来源：** PRD FR631-FR649（19条需求）

**代码现状：**
- GroupChat.tsx：覆盖FR613-FR619（消息操作：搜索/筛选/置顶/收藏/导出/隐私/设置/撤回/编辑/状态）
- PrivateChat.tsx：私聊基础
- **未覆盖FR631-FR649**：Agent入群(FR634)、AI标识(FR639)、@提及(FR641)、默认静默(FR640)、任务通知(FR642)、数据卡片(FR643)、进度汇报(FR644)、下游通知(FR645)、发言权限(FR646)、群组类型(FR647)、私密群(FR648)、数据访问限制(FR649)

**修复建议：** 按优先级：FR634(自动入群) → FR639(AI标识) → FR641(@提及) → FR640(静默) → FR642-645(主动通知)

---

### H4: 部门组件测试 [HIGH]

**铁律来源：** 测试规范：单元>=80%，集成>=60%

**C1修复效果：**
- types测试已补充：hrTypes(18)/salesTypes(17)/warehouseTypes(16)/approvalTypes(13)/serviceTypes(19)/financeTypes(19) + syncConflictTypes(13) + quickAsk(21) + themeIntegration(34)
- 单元测试从36文件/3029断言 → 45文件/3199断言

**C2剩余：** 核心组件render/交互测试缺失
- hr: EmployeeList/EmployeeCard/EmployeeDirectory 无测试
- sales: SalesPilotIntegration 无测试
- warehouse: LocationListPage/MovementListPage/WarningListPage/LogisticsTrackingPage 无测试
- approval: ApprovalFlowTimeline/CreateApprovalDialog 无测试
- service: TicketList 无测试
- finance: FinancePanel/FinancePilotIntegration 无测试

---

### H5: 问题中心缺失 [MEDIUM]

**铁律来源：** PRD工作台体验增强：问题中心(Problems Panel)收集错误/警告/通知

**代码现状：** 无ProblemCenter/IssuePanel组件。DiagnosticsPanel.tsx存在但仅用于诊断面板，非问题中心。

**修复建议：** 实现ProblemCenter面板，集成到BottomPanel/StatusBar

---

### H6: 自定义字段系统 [MEDIUM]

**铁律来源：** PRD补充章节："自定义字段与AI字段感知"

**代码现状：** 无CustomField/AI字段感知相关代码

**修复建议：** 实现字段Schema + AI感知 + 动态表单集成

---

### H7: 模板存储localStorage→SQLite [MEDIUM]

**铁律来源：** 架构ADR-003：本地优先SQLite存储

**代码现状：** templateVersionStore.ts 使用 localStorage

**修复建议：** 迁移到SQLite，通过Rust后端存储

---

### H8: 群聊消息状态追踪 [MEDIUM]

**铁律来源：** PRD FR622-FR630

**代码现状：** GroupChat无消息状态追踪UI（已发送/已送达/已读）

**修复建议：** 实现MessageStatus组件 + 同步逻辑

---

## 正面发现（C1修复后新增合规项）

1. **Quick Ask**：QuickAsk.tsx 已实现，接入AppLayout和CommandPalette
2. **主题集成测试**：themeIntegration.test.ts(34断言) 验证colorRegistry
3. **核心布局全接入主题**：8个核心布局组件hex=0
4. **部门工具全注册**：5部门×6文件(query/aggregate/mutate/action/export/register)已创建
5. **DashScope适配器**：dashscope.rs 已创建
6. **同步冲突UI**：SyncConflictDialog.tsx + data_sync.rs 已实现
7. **布局预设**：layoutPresetStore.ts + PresetPicker.tsx 已存在

---

## C2 轮优先修复排序

| 序号 | 差距ID | 严重度 | 修复内容 | 预估工作量 | 涉及层 |
|------|--------|--------|---------|-----------|--------|
| 1 | H1 | HIGH | 非主题文件颜色接入(features/86+ui/170处hex→var) | 中 | 前端 |
| 2 | H2 | HIGH | 模板Schema+数据绑定层 | 大 | 前端+Rust |
| 3 | H3 | HIGH | 群聊Agent协作(FR634→FR639→FR641→FR640) | 中 | 前端+Rust |
| 4 | H4 | HIGH | 6部门核心组件render测试 | 中 | 测试 |
| 5 | H5 | MEDIUM | ProblemCenter问题中心面板 | 中 | 前端 |
| 6 | H6 | MEDIUM | 自定义字段+AI感知 | 大 | 前端+Rust |
| 7 | H7 | MEDIUM | 模板存储localStorage→SQLite | 小 | Rust |
| 8 | H8 | MEDIUM | 消息状态追踪UI | 中 | 前端 |
| 9 | H9 | LOW | 工作场景恢复完善 | 中 | 前端 |
| 10 | H10 | LOW | 审计SIEM导出 | 小 | Rust |

---

## C1遗留问题验证

team-lead 提到的3个C1遗留问题，逐一验证：

| 遗留问题 | 验证结果 |
|---------|---------|
| SyncConflictDialog text-yellow-500 | **未发现** — SyncConflictDialog.tsx使用Lucide图标(AlertTriangle等)和Dialog组件，无text-yellow-500 Tailwind类。可能已在后续修复中清除 |
| baseColors.ts 注释占位 | **未发现** — baseColors.ts含66处hex，全部为主题CSS变量值定义（如`--ao-background: '#0F1419'`），无TODO/FIXME/占位注释 |
| archived JSON 未加入 .gitignore | **未发现** — .gitignore中无archived相关条目。openspec/changes/archive/ 目录存在但为空。建议补充`openspec/changes/archive/*.json`到.gitignore作为预防措施 |

---

## 硬编码Hex分类详情

| 区域 | 文件数 | Hex处数 | 性质 | 行动 |
|------|--------|---------|------|------|
| theme/ | ~10 | 625 | **合规** — 主题CSS变量值定义 | 无需修改 |
| components/ui/ (shadcn) | ~20 | 170 | **需评估** — 基础UI组件(menubar/dropdown/select/table/alert等)硬编码GitHub深色主题色(#C9D1D9/#30363D/#21262D/#8B949E) | 接入CSS变量以支持主题切换 |
| features/ | ~13 | 86 | **需修复** — LoginForm(17)/OrgChart(6+2+2+1)/permission.types(6)/department.types(6)/IntentParsing(9)/其他 | 优先修复 |
| remotion/ | 1 | 23 | **非关键** — 视频渲染场景 | 低优先级 |
| **合计** | **56** | **847** | | **features/86 + ui/170 = 256处需处理** |

---

## 标签

[RESEARCH] [ARCHITECTURE] [GAP-ANALYSIS] [C2]
