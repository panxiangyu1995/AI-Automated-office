# ai-office - 主计划（第3轮迭代）

> 状态: PLANNING
> 创建: 2026-04-16
> 团队: 待创建
> 迭代节奏: 6循环 × 5轮 = 30轮
> 历史归档:
>   - 第1轮: .plans/ai-office/archive/team-v1-iteration-1-30/
>   - 第2轮: .plans/ai-office/archive/team-v2-iteration-31-60/

---

## 1. 项目概述

AI-Automated-office 是AI赋能的ERP系统。前2轮迭代已完成安全修复、路由补全、颜色迁移、测试框架搭建等基础工作。
第3轮基于**代码实际**（非task.json）与铁律文档的差距分析，系统性补齐剩余功能。

**关键原则：task.json不是完整的所有tasks，所有差距分析以代码实际为准。**

---

## 2. 代码实际状态摘要（2026-04-16 快照）

### 后端（Rust/Tauri）：504文件/12万行/724命令
- ✅ agent/：完整实现（LLM×5、工具系统、记忆、会话）
- ✅ capability/：完整实现
- ✅ 业务模块：hr(1388行)/finance(445行)/sales(440行)/warehouse(593行)/approval(3473行)/service(1348行)/tender(1831行)/marketing(1339行)
- ⚠️ auth/：JWT环境变量+RBAC框架有，但RBAC仅auth命令自身调用，业务模块未接入
- ✅ sync/：ConflictResolution 6种策略完整实现
- ⚠️ knowledge/：服务层已初始化，但5个Tauri命令仍被注释（lib.rs:401-406）
- ⚠️ marketplace/：3文件102行，硬编码Mock数据，无持久化
- ✅ webhook/siem/audit：完整实现
- ✅ sla/：1859行完整实现
- ✅ self_healing/：1465行完整实现
- ❌ network/：仅46行空壳
- ⚠️ 编译状态：3个错误（enterprise_types/enterprise_helpers模块缺失 + AlertCondition字段名不匹配）
- ⚠️ 474个Rust警告（dead_code为主）
- ⚠️ 13个Rust大文件>800行（最大enterprise.rs 1511行→拆分后898行）
- ⚠️ Updater pubkey为空，endpoint为example.com
- ⚠️ plugins/目录仅1个config.yaml

### 前端（React/TS）：647文件/33个feature模块
- ✅ 重度模块：agent(78)/session(77)/settings(51)/admin(36)
- ✅ 6核心部门Sidebar入口+路由全部存在
- ✅ Shadcn/ui 32个基础组件，1217处引用
- ✅ Lucide React 252处import
- ✅ 颜色系统：var(--ao-*)体系，仅remotion/有26处hex（视频渲染色板）
- ✅ 前端构建成功（5.81s）
- ⚠️ 10个前端大文件>1200行（最大editorTemplateWriteback.ts 1739行）
- ⚠️ src/内仅6个.test文件（67个测试用例）
- ✅ tests/目录110个文件（unit 46/integration 29/e2e 14）
- ⚠️ console.log 89处/20个文件
- ⚠️ emoji 9处/4个文件
- ⚠️ dashboard仅1文件/schema仅1文件
- ✅ marketplace前端6文件基本实现
- ✅ CI/CD：.github/workflows/ ci.yml + test.yml

---

## 3. 差距分析（代码实际 vs 铁律文档）

### CRITICAL（必须修复，否则无法交付）
| # | 差距 | 来源 | 现状 | 修复方案 |
|---|------|------|------|---------|
| G1 | Rust编译错误3个 | 代码质量 | enterprise_types/helpers模块缺失 + AlertCondition字段名不匹配 | 创建缺失文件 + 修复字段名 |
| G2 | Knowledge Tauri命令被注释 | PRD:知识库 | lib.rs:401-406 5个命令注释 | 取消注释+注册到invoke_handler |
| G3 | RBAC未接入业务模块 | PRD:权限 | check_permission仅auth命令调用 | hr/finance/sales/warehouse/approval命令添加权限检查 |
| G4 | JWT默认密钥回退 | 架构:安全 | 生产环境可回退到硬编码secret | 生产panic，仅test允许回退 |

### HIGH（严重影响质量/安全）
| # | 差距 | 来源 | 现状 | 修复方案 |
|---|------|------|------|---------|
| G5 | 前端大文件10个>1200行 | 代码规范 | editorTemplateWriteback(1739)等 | 按类型/职责拆分 |
| G6 | Rust大文件13个>800行 | 代码规范 | enterprise(898拆分后)/lib(974)等 | 继续拆分 |
| G7 | console.log 89处 | 代码规范 | systemCommands.ts占44处 | 替换为结构化日志或删除 |
| G8 | emoji 9处 | UX规范 | ChatMessage/MCPServiceConfig等 | 替换为Lucide React图标 |
| G9 | Updater未配置 | 架构:安全 | pubkey空+example.com | 生成密钥对或移除updater配置 |
| G10 | Marketplace后端Mock | PRD:市场 | 硬编码插件列表+内存存储 | SQLite持久化+真实安装逻辑 |
| G11 | plugins/目录空 | 架构:插件 | 仅1个config.yaml | 创建插件骨架结构 |

### MEDIUM（影响体验/可维护性）
| # | 差距 | 来源 | 现状 | 修复方案 |
|---|------|------|------|---------|
| G12 | 474个Rust警告 | 代码质量 | dead_code为主 | cargo fix + 删除未用代码 |
| G13 | 前端单元测试极缺 | 测试规范 | src/仅6个.test | 补充核心模块测试 |
| G14 | Dashboard仅1文件 | PRD:看板 | DashboardHome.tsx(412行) | 拆分子组件+补充统计卡片 |
| G15 | Schema仅1文件 | 架构:表单 | schemaRenderer.tsx | 补充Schema编辑器+验证 |
| G16 | network/空壳 | 架构:网络 | 46行 | 实现网络状态检测+重连 |
| G17 | L3图谱记忆未实现 | 架构:记忆 | Post-MVP标注 | 基础骨架+图查询接口 |
| G18 | 自定义字段缺失 | PRD:字段 | Record<string,unknown>占位 | 实现CustomFieldRegistry |
| G19 | Merge unwrap | 代码质量 | data_sync.rs:288 | 改用if let模式匹配 |
| G20 | CSP unsafe-inline | 架构:安全 | style-src含unsafe-inline | 评估是否可移除 |

### LOW（优化项）
| # | 差距 | 来源 | 现状 |
|---|------|------|------|
| G21 | Knowledge侧边栏id重复 | UX规范 | Sidebar.tsx中knowledge出现两次 |
| G22 | RBAC缺SuperAdmin角色 | PRD:权限 | 仅Employee/Manager/Admin |
| G23 | 前端bundle过大 | 性能 | settings chunk 455KB |
| G24 | Rust dead_code大量 | 代码质量 | 474警告中大部分 |

---

## 4. 迭代计划（6循环×5轮=30轮）

### 循环1（R1-R5）：编译修复+安全加固
- R1: **G1编译错误修复** + G4 JWT生产panic
- R2: **G2 Knowledge命令取消注释** + G19 Merge unwrap修复
- R3: **G3 RBAC接入业务模块**（hr/finance/sales/warehouse）
- R4: G9 Updater配置 + G21 Knowledge侧边栏id修复
- R5: reviewer审查 + custodian巡检

### 循环2（R6-R10）：代码质量清理
- R6: **G7 console.log清理** + G8 emoji替换
- R7: **G12 Rust警告清理**（dead_code删除+cfg标注）
- R8: **G5 前端大文件拆分**（前5个最大文件）
- R9: **G6 Rust大文件拆分**（lib.rs等）
- R10: reviewer审查 + custodian巡检

### 循环3（R11-R15）：业务模块深度补齐
- R11: **G10 Marketplace后端持久化** + G11 plugins骨架
- R12: **G14 Dashboard深化** + G15 Schema编辑器
- R13: **G16 network实现** + G18 自定义字段
- R14: G17 L3图谱记忆基础骨架
- R15: reviewer审查 + custodian巡检

### 循环4（R16-R20）：测试与质量保障
- R16: **G13 前端单元测试补充**（stores+hooks）
- R17: 前端组件测试（agent/session/settings）
- R18: Rust单元测试补充（auth/sync/knowledge）
- R19: G20 CSP优化 + G22 SuperAdmin角色
- R20: reviewer审查 + custodian巡检

### 循环5（R21-R25）：集成与性能优化
- R21: E2E测试补充（核心用户旅程）
- R22: G23 前端bundle优化（code splitting）
- R23: Rust性能优化（clippy+bench）
- R24: 集成测试补充（Agent+Memory+Sync）
- R25: reviewer审查 + custodian巡检

### 循环6（R26-R30）：最终打磨与验收
- R26: 全量cargo check + npm run build验证
- R27: 剩余CRITICAL/HIGH差距最终修复
- R28: 文档同步（api-contracts+architecture+invariants）
- R29: CI/CD流水线完善（coverage gate）
- R30: 最终审查+验收报告

---

## 5. 当前阶段

准备创建团队并启动循环1
