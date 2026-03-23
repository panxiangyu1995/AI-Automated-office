---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
workflowType: 'architecture'
lastStep: 10
status: 'complete'
completedAt: '2026-03-11'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/memory-fusion-pdf-draft.md
  - docs/memory-fusion-architecture-draft.md
  - _bmad-output/opencode/00-overview.md
  - _bmad-output/opencode/01-architecture.md
  - _bmad-output/opencode/02-agent-system.md
  - _bmad-output/opencode/03-tool-system.md
  - _bmad-output/opencode/04-session-management.md
  - _bmad-output/opencode/05-mcp-integration.md
  - _bmad-output/opencode/06-frontend-architecture.md
  - _bmad-output/opencode/07-backend-api.md
  - _bmad-output/opencode/08-tech-stack.md
  - _bmad-output/opencode/09-reference-recommendations.md
  - _bmad-output/opencode/10-skill-progressive-loading.md
  - _bmad-output/soul/00-overview.md
  - _bmad-output/soul/01-soul-md-mechanism.md
  - _bmad-output/soul/02-skill-progressive-loading.md
  - _bmad-output/soul/03-heartbeat-mechanism.md
  - _bmad-output/soul/04-cron-scheduling-mechanism.md
  - _bmad-output/soul/README.md
  - _bmad-output/提示词/00-总览.md
  - _bmad-output/提示词/01-opencode设计分析.md
  - _bmad-output/提示词/02-openclaw设计分析.md
  - _bmad-output/提示词/03-设计模式总结.md
  - _bmad-output/提示词/04-应用建议.md
  - _bmad-output/提示词/05-模板参考.md
  - _bmad-output/agent/README.md
  - _bmad-output/agent/01-架构总览.md
  - _bmad-output/agent/02-感知层架构.md
  - _bmad-output/agent/03-决策层架构.md
  - _bmad-output/agent/04-执行层架构.md
  - _bmad-output/agent/05-记忆层架构.md
  - _bmad-output/agent/06-工具调用系统.md
  - _bmad-output/agent/07-多智能体协作.md
  - _bmad-output/agent/08-安全机制设计.md
  - _bmad-output/agent/09-设计最佳实践.md
  - _bmad-output/errorshandl/README.md
  - _bmad-output/errorshandl/error-classification.md
  - _bmad-output/errorshandl/failover-retry.md
  - _bmad-output/errorshandl/loop-detection.md
  - _bmad-output/errorshandl/network-errors.md
  - _bmad-output/errorshandl/session-errors.md
  - _bmad-output/errorshandl/error-formatting.md
  - _bmad-output/planning-artifacts/clawhub-compatibility-design.md
workflowType: 'architecture'
project_name: 'AI-Automated-office'
user_name: 'PAN'
date: '2026-03-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
项目共定义854个功能需求，覆盖平台核心（桌面端、Agent框架、插件系统、权限系统、知识库RAG、统一消息系统、LLM/MCP配置、Sub-Agent体系、多知识库配置、数据访问白名单）和8个业务部门模块，并新增“编辑器系统与动态模板渲染”能力。核心架构围绕AI Agent能力展开，同时延伸到可扩展编辑器注册、模板运行时、Canvas即时渲染、模板设计器与部门模板资产管理，支撑“动态模板驱动UI”的产品方向。

**Non-Functional Requirements:**
- 性能：本地操作<100ms，云端<3s，空闲内存<500MB
- 安全：TLS 1.3传输加密、AES-256存储加密、多租户数据库级隔离
- 可靠性：系统可用性>99.5%、RPO<1h、RTO<4h、工具调用成功率>99%
- 可扩展性：单租户≥500用户、系统≥100租户、≥200插件支持
- 集成：OpenAI兼容格式、MCP协议、国内主流模型提供商

**Scale & Complexity:**

- Primary domain: Desktop App + 后端平台 + AI Agent框架
- Complexity level: 高
- Estimated architectural components: 20-25个核心组件

### Technical Constraints & Dependencies

- 桌面端技术栈：Tauri + Rust (Windows 10/11, macOS 11.0+)
- Agent运行位置：客户端本地运行
- 云服务职责：登录认证、租户管理、数据存储、实时同步
- 模型提供商：OpenAI兼容格式为通用接口标准，支持百炼、智谱AI、Minimax、DeepSeek等国内模型
- Token管理：支持客户自配API Key或统一中转服务

### Cross-Cutting Concerns Identified

1. **错误处理与容错** - 工具调用重试、故障转移、Auth Profile轮换、循环检测熔断
2. **安全性** - 细粒度RBAC权限、多租户数据隔离、API Key本地加密存储
3. **数据一致性** - 实时同步策略、冲突检测与处理、版本历史管理
4. **可观测性** - 操作审计日志、任务状态追踪、数据看板监控
5. **插件隔离** - 错误边界 + 优雅降级（插件全部自研，同进程运行）

### Reference Architecture Insights (OpenClaw)

参考架构提供了以下关键设计模式：
- **工具系统**：声明式工具定义、策略管道、沙箱隔离执行
- **子代理系统**：层级协作模式、状态持久化、结果通知机制
- **错误处理**：分层处理、可恢复性优先、故障隔离、用户友好

### Architecture Decision Records (ADR)

通过多架构师角色辩论、第一性原理分析、跨职能作战室和思维树探索，形成以下关键架构决策：

| 决策ID | 决策内容 | 来源 |
|--------|---------|------|
| ADR-001 | 采用分层微内核架构 | 架构师辩论 |
| ADR-002 | 插件作为模块化组件同进程运行，通过依赖注入和事件总线通信 | 第一性原理 + 用户澄清 |
| ADR-003 | 数据存储采用本地优先 + 增量同步 + 智能冲突解决策略 | 第一性原理 |
| ADR-004 | 使用事件总线解耦模块通信 | 架构师辩论 |
| ADR-005 | 多租户采用数据库级隔离 | Step 4决策 |
| ADR-006 | 插件系统提供低代码配置能力，支持非开发人员定制 | 跨职能作战室 |
| ADR-007 | 实现插件错误边界和热重载机制，防止单点故障 | 跨职能作战室 |
| ADR-008 | 建立统一的插件UI框架和加载状态规范 | 跨职能作战室 |
| ADR-009 | LLM接入采用适配器模式，以OpenAI兼容格式为基准 | 思维树分析 |
| ADR-010 | 工具系统采用混合模式：核心工具内置 + MCP工具 + 插件工具 | 思维树分析 |
| ADR-011 | 会话Key采用三层结构：`{tenantId}:{pluginId}:{sessionId}` | 架构讨论 2026-03-10 |
| ADR-012 | MVP阶段不实现多通道，专注桌面端核心功能 | 架构讨论 2026-03-10 |
| ADR-013 | 子代理最大深度限制为3层 | 架构讨论 2026-03-10 |
| ADR-014 | MVP阶段实现向量+BM25混合搜索 | 架构讨论 2026-03-10 |
| ADR-015 | MCP协议版本采用2024-11-05 | 架构讨论 2026-03-10 |
| ADR-016 | MVP阶段暂不实现Docker沙箱 | 架构讨论 2026-03-10 |
| ADR-017 | 工具命名采用`{plugin}_{entity}_{action}`格式 | 架构讨论 2026-03-10 |
| ADR-018 | 字段级权限采用后台动态配置 | 架构讨论 2026-03-10 |
| ADR-019 | 敏感操作确认采用聊天界面内弹出方式 | 架构讨论 2026-03-10 |
| ADR-020 | MCP工具优先级：内置工具优先，MCP工具Post-MVP实现 | 架构讨论 2026-03-10 |
| ADR-021 | 统一消息系统采用参与者模型（human/agent/system/group） | 架构讨论 2026-03-11 |
| ADR-022 | 黑名单匹配采用简单通配符模式（支持精确、前缀、后缀、包含、分组匹配） | 架构讨论 2026-03-11 |
| ADR-023 | Agent可观测性数据存储采用本地SQLite，管理员可见范围为租户级 | 架构讨论 2026-03-11 |
| ADR-024 | 断点续传支持从任意中断位置恢复，数据持久化到本地SQLite | 架构讨论 2026-03-11 |
| ADR-025 | 工具系统采用通用工具架构：每部门最多5个核心工具（query/aggregate/mutate/action/export），参数化设计避免工具爆炸 | Party Mode讨论 2026-03-13 |
| ADR-026 | 检查点系统采用Git作为后端存储，支持文件版本管理和回滚 | Party Mode讨论 2026-03-14 |
| ADR-027 | 检查点触发时机：每次用户发送消息前自动创建 | Party Mode讨论 2026-03-14 |
| ADR-028 | 检查点回滚范围支持两种模式：仅恢复对话、恢复对话和文件内容 | Party Mode讨论 2026-03-14 |
| ADR-029 | Git工具集成采用内置PortableGit方案，首次启动时自动安装 | Party Mode讨论 2026-03-14 |
| ADR-030 | 检查点元数据存储在SQLite，文件变更通过Git管理 | Party Mode讨论 2026-03-14 |
| ADR-031 | 上下文压缩采用混合策略：摘要 + 滑动窗口 + 关键事实提取 | Party Mode讨论 2026-03-14 |
| ADR-032 | 压缩触发阈值为上下文窗口的80%（可配置） | Party Mode讨论 2026-03-14 |
| ADR-033 | 压缩过程对用户透明，仅在完成后显示简洁通知 | Party Mode讨论 2026-03-14 |
| ADR-034 | 关键事实自动提取到L1个人记忆层持久保存 | Party Mode讨论 2026-03-14 |
| ADR-035 | 编辑器系统采用“注册表 + 解析器 + 编辑器宿主”三段式架构，统一管理内置与扩展编辑器 | PRD对齐 2026-03-22 |
| ADR-036 | 动态模板运行时采用“模板Schema + 数据绑定层 + Canvas渲染层”分层设计，模板格式统一为JSON/YAML声明式定义 | PRD对齐 2026-03-22 |
| ADR-037 | 模板设计器与模板库归属于平台公共能力，部门插件仅通过模板资产和扩展API接入，不直接耦合渲染内核 | PRD对齐 2026-03-22 |
| ADR-038 | 提示词体系采用分层知识架构：项目级AGENTS.md + 模块级AGENTS.md + Agent/Skill局部指令，按作用域加载上下文 | 提示词研究结论 2026-03-23 |
| ADR-039 | Agent/Skill采用元数据驱动配置：使用YAML Frontmatter统一声明模型、工具白名单、权限策略与执行模式 | 提示词研究结论 2026-03-23 |
| ADR-040 | 提示词加载采用渐进式上下文策略：基础规范默认加载，任务级与引用文档按需加载，避免上下文膨胀 | 提示词研究结论 2026-03-23 |
| ADR-041 | 提示词安全采用三层护栏：禁止清单 + 需确认事项 + 幻觉红旗阻断，并纳入统一审计链路 | 提示词研究结论 2026-03-23 |
| ADR-042 | 引入会话知识累积机制：仅沉淀“非显而易见且可复用”的经验规则，分层写回AGENTS知识库 | 提示词研究结论 2026-03-23 |
| ADR-043 | 记忆系统融合采用“Hook无感摄入 + 认知状态重建”模式：采纳 SessionStart/UserPromptSubmit/PostToolUse/Stop/SessionEnd 生命周期并支持 tunnel_state | 记忆融合草案对齐 2026-03-23 |
| ADR-044 | 记忆层实现遵循 Rust-First 与本地优先：MVP 默认 SQLite + FTS5 + sqlite-vec，LanceDB 仅 Post-MVP 可选扩展 | 记忆融合草案对齐 2026-03-23 |
| ADR-045 | OpenCode 工具系统作为全量参考并分级采纳：直接采纳“工具收敛+参数化”与“权限审计链路”，其余按现有技术栈改造采纳 | OpenCode研究对齐 2026-03-23 |
| ADR-046 | OpenCode Skill 渐进式加载作为全量参考并分级采纳：默认加载基础规范，任务与引用资源按需加载，维持上下文预算控制 | OpenCode研究对齐 2026-03-23 |
| ADR-047 | SOUL 机制作为人格模板能力并入：支持多源导入与优先级覆盖，但默认只读，修改需用户确认并记录版本审计 | SOUL研究对齐 2026-03-23 |
| ADR-048 | Heartbeat/Cron 机制作为运行治理能力并入：采用预检查、隔离执行、静默确认与重试超时控制，避免打扰与成本失控 | SOUL研究对齐 2026-03-23 |

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│         Desktop Shell (Tauri) │ UI Components                │
├─────────────────────────────────────────────────────────────┤
│                    Agent Core Layer (微内核)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              LLM Adapter Layer                       │    │
│  │  OpenAICompatibleAdapter + Provider Extensions      │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Tool System (混合模式)                   │    │
│  │  Core Tools │ MCP Tools │ Plugin Tools              │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Session & Memory                        │    │
│  │  SessionManager │ MemoryManager │ ContextCompressor │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Plugin Layer (同进程模块化)               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Plugin Manager                          │    │
│  │  - 依赖解析 │ 生命周期 │ 权限控制 │ 低代码配置        │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Plugin Registry                         │    │
│  │  HR │ Finance │ Sales │ Dashboard │ ...            │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer (本地优先)                      │
│  Local Store (SQLite) │ Sync Engine │ Conflict Resolver     │
├─────────────────────────────────────────────────────────────┤
│                    Cloud Layer                               │
│  Auth │ Tenant Mgmt │ Data Sync │ Object Storage            │
└─────────────────────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────────────────────┐
│                    Security Cross-Cutting                    │
│  RBAC │ Encryption │ Audit │ Error Boundary                 │
└─────────────────────────────────────────────────────────────┘
```

## Agent Framework Core Decisions

> 基于OpenClaw架构研究和四层标准架构设计，以下为Agent框架核心设计决策。

### 四层架构设计

Agent框架采用**四层标准架构**设计，遵循感知-决策-执行-记忆闭环模型：

```
┌─────────────────────────────────────────────────────────────────┐
│                    四层架构映射                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  感知层 (Perception)                                            │
│  ├── 前端UI输入 (Tauri + React)                                 │
│  ├── 插件事件输入 (Plugin Events)                               │
│  ├── 多模态输入 (图像/PDF)                                      │
│  └── 权限门控 (RBAC)                                            │
│                                                                 │
│  决策层 (Decision)                                              │
│  ├── 系统提示词构建 (System Prompt Builder)                     │
│  ├── 上下文管理 (Context Manager + Compressor)                  │
│  ├── LLM Adapter (OpenAI兼容格式)                               │
│  └── TAO循环 (Think-Act-Observe)                               │
│                                                                 │
│  执行层 (Execution)                                             │
│  ├── 工具系统 (核心工具 + MCP工具 + 插件工具)                   │
│  ├── 工具策略管道 (权限→沙箱→路径)                              │
│  ├── 循环检测 + 熔断器                                          │
│  └── 沙箱隔离 (MVP暂不实现Docker)                               │
│                                                                 │
│  记忆层 (Memory)                                                │
│  ├── Session Manager (会话管理)                                 │
│  ├── Memory Manager (STM + LTM)                                 │
│  ├── 向量存储 (sqlite-vec)                                      │
│  └── 混合搜索 (向量 + BM25)                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 提示词系统架构（直接采用）

> 本节将 `_bmad-output/提示词` 目录中的研究结论直接固化为架构约束，作为 Agent Runtime 的一等能力。

#### 1) 分层知识架构（ADR-038）

- 项目级：根 `AGENTS.md` 只放全局铁律、安全规则、统一命名与测试要求。
- 模块级：`src/*/AGENTS.md` 只放模块边界、关键文件、常见陷阱。
- 任务级：`agents/*.md`、`skills/*/SKILL.md` 仅放单一职责指令与流程，不重复全局规则。
- 原则：知识就近、单点定义、禁止跨层重复粘贴。

#### 2) 元数据驱动配置（ADR-039）

统一采用 YAML Frontmatter：

```yaml
name: hr-analyst
description: "人事分析与报表生成"
model: smart
mode: primary
tools:
  "*": false
  "hr_employee_query": true
  "hr_employee_export": true
permission:
  export_sensitive_data: require-approval
```

- 工具命名必须继续遵循 `ADR-017`：`{plugin}_{entity}_{action}`。
- `permission` 与字段级权限（ADR-018）联动，高风险动作必须二次确认（ADR-019）。
- Agent/Skill 不允许声明未注册工具，防止“幽灵能力”。

#### 3) 渐进式上下文加载（ADR-040）

- L1（默认加载）：项目级规则、当前模块规则、当前任务指令。
- L2（按需加载）：被明确引用的 `references/*` 文档或流程文件。
- L3（动态加载）：运行时检索结果（知识库、历史会话摘要、模板Schema片段）。
- 控制目标：优先保证上下文有效密度，避免一次性注入大段无关说明。

#### 4) 安全护栏三层机制（ADR-041）

- 第一层（禁止清单）：绝对禁止动作，如绕过审批直接执行敏感写操作。
- 第二层（需确认事项）：删除、外发、越权访问、批量变更等必须显式确认。
- 第三层（幻觉红旗）：当“结论与仓库事实不一致/无证据”时阻断执行并要求核验。
- 所有命中记录进入统一审计事件流，对齐可观测性与审计架构。

#### 5) 会话知识累积机制（ADR-042）

- 仅提取以下内容：
  - 隐式依赖关系与非直观执行路径
  - 排障中的关键突破与可复用策略
  - 文档未覆盖但已被验证的工程约束
- 明确排除：
  - 文档已有事实
  - 通用语言/框架常识
  - 会话一次性细节
- 写回策略：按作用域写入对应层级 AGENTS 文件，条目保持简洁（1-3行），避免污染。

#### 6) 与现有架构的耦合边界

- 提示词系统属于 Agent Core 的“决策层能力”，不直接越权访问执行层资源。
- 动态 UI 与模板运行时仅接收结构化输出（意图、字段值、动作建议），不接受自由文本指令直改状态。
- 插件仅通过 Tool Registry 与 Extension API 暴露能力，提示词不得绕过插件边界直接操作底层存储。

### OpenCode 参考分级采纳基线（全量参考）

> `_bmad-output/opencode` 目录全部纳入参考范围，采用 Direct / Adapt / Reserve 三档治理，避免“全量参考”演变为“无边界照搬”。

#### Direct（直接采纳）

- 工具收敛原则：每模块核心工具数量受控，优先参数化扩展（对齐 ADR-025）。
- 工具调用治理：统一走权限检查、审批确认、审计记录链路（对齐 ADR-018/019/021）。
- Skill 渐进加载：基础规范默认加载，任务级与引用资源按需加载（对齐 ADR-040/046）。

#### Adapt（改造采纳）

- Agent/Session 组织方式：保留可复用模式，但映射到本项目 `Tauri + Rust + React` 分层。
- MCP 与工具编排策略：保留协议与策略思想，具体实现遵循本项目安全边界与命名规范。
- 前后端接口形式：保留接口分层思想，落地时遵循现有 IPC + API 约束。

#### Reserve（储备采纳）

- 与当前主路径冲突或复杂度过高的实现暂列 Post-MVP 储备，不影响当前迭代交付节奏。
- 储备项需在实施前补充成本、风险和兼容性评审，不得直接进入 MVP 范围。

### 会话Key格式设计 (ADR-011)

采用三层结构，简洁且易于解析：

**格式定义：**
```
{tenantId}:{pluginId}:{sessionId}
```

**字段说明：**

| 字段 | 含义 | 示例 |
|------|------|------|
| tenantId | 租户标识 | `main`, `tenant-001` |
| pluginId | 插件/模块标识 | `agent`, `hr`, `finance` |
| sessionId | 会话实例ID | `chat-001`, `session-abc` |

**子代理Key生成规则：**
```
父会话: tenant-001:agent:chat-001
子代理: tenant-001:agent:chat-001/sub:run-001
孙代理: tenant-001:agent:chat-001/sub:run-001/sub:run-002
```

**深度计算：** 统计 `/sub:` 出现次数，最大深度限制为3层 (ADR-013)

**设计优势：**
1. 简洁：三层结构，易于解析
2. 多租户友好：前缀区分租户
3. 插件隔离：中间层区分插件
4. 子代理支持：通过后缀实现嵌套

### 多通道决策 (ADR-012)

**MVP决策：不实现多通道**

| 决策项 | MVP | Post-MVP |
|--------|-----|----------|
| 多通道支持 | ❌ 不实现 | 插件化扩展 |
| 感知层设计 | 仅桌面UI输入 | + 移动端Web + 企业平台 |
| 移动端接入 | 通过云端Web服务 | 可选原生App |
| 企业平台集成 | 不支持 | 企业微信/钉钉机器人 |

**理由：**
1. 聚焦桌面端核心功能，降低复杂度
2. 移动端可通过云端Web服务访问
3. 企业平台集成作为Post-MVP插件扩展
4. 预留扩展接口，保持架构灵活性

### 子代理系统设计 (ADR-013)

**核心设计：** 沿用OpenClaw子代理系统模式

**关键参数：**

| 参数 | 值 | 说明 |
|------|-----|------|
| 最大深度 | 3层 | 防止无限嵌套 |
| 运行模式 | oneshot + session | 单次执行 + 持久会话 |
| 通知机制 | Announce | 完成后通知父代理 |
| 状态持久化 | SQLite | 支持重启恢复 |

**生命周期管理：**
```
spawn → register → start → running → end → announce → cleanup
```

**子代理注册中心设计：**
```rust
pub struct SubagentRegistry {
    runs: HashMap<String, SubagentRunRecord>,
    db: Database,
}

pub struct SubagentRunRecord {
    run_id: String,
    requester_session_key: String,
    child_session_key: String,
    status: SubagentStatus,
    created_at: i64,
    started_at: Option<i64>,
    ended_at: Option<i64>,
    outcome: Option<SubagentOutcome>,
}
```

### 混合搜索设计 (ADR-014)

**MVP决策：实现向量+BM25混合搜索**

**架构设计：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    混合搜索架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Query ─→ 向量嵌入 ─→ 向量搜索 ─→ 路径1                         │
│       └──→ 关键词提取 ─→ BM25搜索 ─→ 路径2                      │
│                                    ↓                            │
│                              结果融合 (RRF)                      │
│                                    ↓                            │
│                              重排序 (可选)                       │
│                                    ↓                            │
│                              Top-K结果                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**融合算法 (RRF - Reciprocal Rank Fusion)：**
```rust
pub fn reciprocal_rank_fusion(
    vector_results: Vec<SearchResult>,
    bm25_results: Vec<SearchResult>,
    vector_weight: f32,  // 默认 0.6
    bm25_weight: f32,    // 默认 0.4
    k: usize,            // 常数，默认 60
) -> Vec<SearchResult> {
    // RRF公式: score = Σ(1 / (k + rank))
}
```

**性能指标：**
| 指标 | 单路召回 | 混合搜索 |
|------|---------|---------|
| 延迟 | ~50ms | ~200ms |
| 准确率 | 基准 | +15-25% |

### MCP集成设计 (ADR-015)

**协议版本：2024-11-05**

**连接模式：**
```
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Client Manager                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  连接管理 │ 健康检查 │ 重连机制                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                    │                    │            │
│         ↓                    ↓                    ↓            │
│  ┌───────────┐        ┌───────────┐        ┌───────────┐       │
│  │ Stdio MCP │        │ HTTP MCP  │        │ SSE MCP   │       │
│  │ (本地进程) │        │ (远程服务) │        │ (流式)    │       │
│  └───────────┘        └───────────┘        └───────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Rust实现结构：**
```rust
pub struct McpClient {
    transport: McpTransport,
    tools: HashMap<String, Tool>,
    health_checker: HealthChecker,
}

pub enum McpTransport {
    Stdio { process: Child },
    Http { client: Client },
    Sse { stream: EventSource },
}
```

**配置示例：**
```toml
# config/mcp.toml
[[mcp_servers]]
name = "filesystem"
transport = "stdio"
command = "mcp-filesystem"
args = ["/path/to/workspace"]

[[mcp_servers]]
name = "database"
transport = "http"
url = "http://localhost:8080/mcp"
```

### 沙箱模式决策 (ADR-016)

**MVP决策：暂不实现Docker沙箱**

**替代方案：**
1. 工具策略管道（权限检查）
2. 路径访问限制
3. 命令审批机制
4. 循环检测熔断

**Post-MVP扩展：**
- 可选Docker沙箱隔离
- 容器镜像配置
- 资源限制（CPU/内存）

### 检查点系统设计 (ADR-026至ADR-030)

> **设计目标：** 为用户提供"时间旅行"能力，可以回滚到任意历史节点，或从历史节点编辑输入重新尝试不同路径。

#### 架构决策摘要

| 决策ID | 决策内容 |
|--------|---------|
| ADR-026 | 检查点系统采用Git作为后端存储，支持文件版本管理和回滚 |
| ADR-027 | 检查点触发时机：每次用户发送消息前自动创建 |
| ADR-028 | 检查点回滚范围支持两种模式：仅恢复对话、恢复对话和文件内容 |
| ADR-029 | Git工具集成采用内置PortableGit方案，首次启动时自动安装 |
| ADR-030 | 检查点元数据存储在SQLite，文件变更通过Git管理 |

#### 检查点系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                    检查点系统架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Checkpoint Manager                        │   │
│  │  - create_checkpoint()  创建检查点                           │   │
│  │  - list_checkpoints()   列出检查点                           │   │
│  │  - restore_checkpoint() 恢复检查点                           │   │
│  │  - branch_checkpoint()  分支检查点                           │   │
│  │  - delete_checkpoint()  删除检查点                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│              ┌───────────────┼───────────────┐                      │
│              │               │               │                      │
│              ▼               ▼               ▼                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │ Session State │  │  Git Backend  │  │  Meta Store   │           │
│  │   Manager     │  │  (PortableGit)│  │   (SQLite)    │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│         │                  │                   │                    │
│         ▼                  ▼                   ▼                    │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │ 对话上下文    │  │ 文件版本控制  │  │ 检查点元数据  │           │
│  │ 消息列表     │  │ Git提交记录   │  │ ID、时间戳    │           │
│  │ AI记忆状态   │  │ 文件差异      │  │ 用户输入预览  │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Git集成方案 (ADR-029)

**PortableGit 集成设计：**

```
应用目录结构：
AI-Automated-office/
├── resources/
│   └── portable-git/          # 内置PortableGit (~50MB)
│       ├── cmd/
│       │   └── git.exe
│       └── ...
│
用户数据目录：
%LOCALAPPDATA%\AI-Automated-office\
├── tools/
│   └── git/                   # 解压后的PortableGit
│       ├── cmd/
│       │   └── git.exe
│       └── ...
├── checkpoints/               # 检查点存储
│   ├── metadata.db           # SQLite元数据库
│   └── repos/                # Git仓库
│       └── {workspace-id}/
│           └── .git/
└── workspaces/               # 用户工作空间
    └── {workspace-id}/
```

**Git初始化流程：**

```
应用启动
     │
     ├─► 检测系统Git
     │        │
     │        ├─► 已安装 → 使用系统Git
     │        │
     │        └─► 未安装 → 检测内置PortableGit
     │                         │
     │                         ├─► 已解压 → 使用PortableGit
     │                         │
     │                         └─► 未解压 → 解压到用户目录
     │                                        │
     │                                        └─► 使用PortableGit
     │
     └─► 初始化工作空间Git仓库
              │
              └─► git init {workspace-path}
```

**Git调用接口（Rust实现）：**

```rust
pub struct GitBackend {
    git_path: PathBuf,           // Git可执行文件路径
    workspace_path: PathBuf,     // 工作空间路径
}

impl GitBackend {
    /// 创建Git提交（创建检查点时调用）
    pub async fn commit(
        &self,
        checkpoint_id: &str,
        message: &str,
    ) -> Result<String, GitError> {
        // git add -A
        // git commit -m "checkpoint: {checkpoint_id} - {message}"
        // 返回提交hash
    }
    
    /// 恢复到指定提交（恢复检查点时调用）
    pub async fn restore(
        &self,
        commit_hash: &str,
        mode: RestoreMode,
    ) -> Result<(), GitError> {
        match mode {
            RestoreMode::Soft => {
                // git reset --soft {commit_hash}
                // 保留工作区变更
            }
            RestoreMode::Hard => {
                // git reset --hard {commit_hash}
                // 恢复到检查点时的文件状态
            }
        }
    }
    
    /// 获取文件差异
    pub async fn diff(
        &self,
        from_commit: &str,
        to_commit: Option<&str>,
    ) -> Result<Vec<FileDiff>, GitError> {
        // git diff {from_commit} {to_commit}
    }
}
```

#### 检查点数据结构

**检查点元数据（SQLite存储）：**

```sql
CREATE TABLE checkpoints (
    id TEXT PRIMARY KEY,              -- 检查点ID: cp-{timestamp}-{seq}
    session_id TEXT NOT NULL,         -- 会话ID
    created_at DATETIME NOT NULL,     -- 创建时间
    user_input_preview TEXT,          -- 用户输入预览（前50字）
    user_input_full TEXT,             -- 用户输入完整内容
    conversation_turn INTEGER,        -- 对话轮次
    message_ids TEXT,                 -- 消息ID列表(JSON)
    git_commit_hash TEXT,             -- Git提交哈希
    git_commit_message TEXT,          -- Git提交信息
    artifacts TEXT,                   -- 文件变更列表(JSON)
    is_important BOOLEAN DEFAULT 0,   -- 用户标记为重要
    is_active BOOLEAN DEFAULT 1,      -- 是否为当前活动分支
    branch_id TEXT,                   -- 分支ID（用于编辑重试）
    parent_checkpoint_id TEXT,        -- 父检查点ID（分支场景）
    created_by TEXT NOT NULL,         -- 创建用户
    tenant_id TEXT NOT NULL,          -- 租户ID
    
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (parent_checkpoint_id) REFERENCES checkpoints(id)
);

CREATE INDEX idx_checkpoints_session ON checkpoints(session_id);
CREATE INDEX idx_checkpoints_created ON checkpoints(created_at);
CREATE INDEX idx_checkpoints_tenant ON checkpoints(tenant_id);
```

**检查点JSON结构：**

```typescript
interface Checkpoint {
  id: string;                    // cp-20260314-001
  sessionId: string;             // session-abc123
  createdAt: string;             // ISO 8601
  userInputPreview: string;      // "帮我润色这段文字..."
  userInputFull: string;         // 完整用户输入
  conversationTurn: number;      // 5
  messageIds: string[];          // ["msg-1", "msg-2", ...]
  gitCommit: {
    hash: string;                // a1b2c3d
    message: string;             // "checkpoint: cp-20260314-001 - 帮我润色..."
  };
  artifacts: {
    path: string;                // /documents/draft.md
    changeType: 'created' | 'modified' | 'deleted';
  }[];
  isImportant: boolean;
  isActive: boolean;
  branchId?: string;             // 分支ID
  parentCheckpointId?: string;   // 父检查点
}
```

#### 检查点生命周期

```
┌─────────────────────────────────────────────────────────────────────┐
│                    检查点生命周期                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  用户发送消息                                                        │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │ 创建检查点      │ ◄── 自动触发 (ADR-027)                          │
│  │ - 保存会话状态  │                                                │
│  │ - Git提交文件   │                                                │
│  │ - 写入元数据    │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 显示检查点标记  │ ◄── 对话界面可视化                              │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ├────────────────────┬────────────────────┐               │
│           │                    │                    │               │
│           ▼                    ▼                    ▼               │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐        │
│  │ 继续对话    │       │ 回滚检查点  │       │ 编辑重试    │        │
│  │ (无操作)   │       │ (ADR-028)   │       │ (分支模式)  │        │
│  └─────────────┘       └──────┬──────┘       └──────┬──────┘        │
│                               │                     │               │
│                               ▼                     ▼               │
│                        ┌─────────────┐       ┌─────────────┐        │
│                        │ 选择回滚范围│       │ 编辑输入    │        │
│                        │ 仅对话/全部│       │ 重新发送    │        │
│                        └──────┬──────┘       └──────┬──────┘        │
│                               │                     │               │
│                               ▼                     ▼               │
│                        ┌─────────────┐       ┌─────────────┐        │
│                        │ 执行回滚    │       │ 创建分支    │        │
│                        │ 恢复状态    │       │ 新时间线    │        │
│                        └─────────────┘       └─────────────┘        │
│                                                                     │
│  自动清理（后台任务）                                                 │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │ 清理过期检查点  │ ◄── 30天（可配置）                              │
│  │ 保留重要标记    │                                                │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 回滚机制设计 (ADR-028)

**两种回滚模式：**

| 模式 | 操作 | 说明 |
|------|------|------|
| **仅恢复对话** | 对话回滚 + 文件不变 | AI重新开始，用户手动处理文件 |
| **恢复对话和文件** | 对话回滚 + Git hard reset | 完全恢复到检查点状态 |

**回滚API设计：**

```rust
pub enum RestoreMode {
    ConversationOnly,      // 仅恢复对话
    ConversationAndFiles,  // 恢复对话和文件
}

impl CheckpointManager {
    pub async fn restore(
        &self,
        checkpoint_id: &str,
        mode: RestoreMode,
    ) -> Result<RestoreResult, CheckpointError> {
        // 1. 获取检查点元数据
        let checkpoint = self.metadata_store.get(checkpoint_id).await?;
        
        // 2. 恢复会话状态
        self.session_manager.restore(
            checkpoint.session_id,
            checkpoint.message_ids,
        ).await?;
        
        // 3. 恢复文件（如果需要）
        if let RestoreMode::ConversationAndFiles = mode {
            self.git_backend.restore(
                &checkpoint.git_commit_hash,
                GitRestoreMode::Hard,
            ).await?;
        }
        
        // 4. 更新活动状态
        self.metadata_store.set_active(checkpoint_id).await?;
        
        // 5. 记录审计日志
        self.audit_log.log_restore(checkpoint_id, mode).await?;
        
        Ok(RestoreResult { checkpoint, mode })
    }
}
```

#### 编辑重试功能（分支模式）

**设计原理：** 用户可以从历史检查点编辑输入并重新发送，创建一条新的对话分支。

```
原始对话:
├── cp-001: "帮我润色这段文字..."
│   └── AI: 好的，润色完成...
├── cp-002: "再加一点正式感"
│   └── AI: 已修改...
└── cp-003: "这个版本可以了"

编辑重试后:
├── cp-001: "帮我润色这段文字..."
│   ├── 原分支: cp-002 → cp-003 (已归档)
│   └── 新分支: cp-001-b1 (编辑重试)
│       └── 用户输入: "帮我润色这段文字，保持亲切语气"
│           └── AI: 好的，以亲切语气润色...
```

**分支检查点ID格式：**

```
原始检查点: cp-20260314-001
分支检查点: cp-20260314-001-b1
分支的分支: cp-20260314-001-b1-b1
```

#### 性能考虑

| 指标 | 要求 | 实现方式 |
|------|------|---------|
| **检查点创建延迟** | < 500ms | 异步Git提交，先写入元数据 |
| **检查点列表加载** | < 100ms | SQLite索引，分页查询 |
| **回滚操作延迟** | < 2s | Git操作优化，增量恢复 |
| **存储空间** | 按需清理 | 自动清理30天前的检查点 |

#### 安全考虑

| 安全点 | 措施 |
|--------|------|
| **Git仓库隔离** | 每个工作空间独立Git仓库 |
| **敏感文件排除** | .gitignore排除敏感目录 |
| **权限控制** | 检查点按租户和用户隔离 |
| **审计日志** | 所有检查点操作记录日志 |

### 上下文压缩系统设计 (ADR-031至ADR-034)

> **设计目标：** 在有限的上下文窗口下，自动压缩对话历史，保留关键信息，确保长对话不会因超出Token限制而中断。

#### 架构决策摘要

| 决策ID | 决策内容 |
|--------|---------|
| ADR-031 | 上下文压缩采用混合策略：摘要 + 滑动窗口 + 关键事实提取 |
| ADR-032 | 压缩触发阈值为上下文窗口的80%（可配置） |
| ADR-033 | 压缩过程对用户透明，仅在完成后显示简洁通知 |
| ADR-034 | 关键事实自动提取到L1个人记忆层持久保存 |

#### 压缩策略设计 (ADR-031)

**混合策略架构：**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    上下文压缩混合策略                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    当前上下文窗口                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │   │
│  │  │ 系统提示词  │ │ 压缩摘要   │ │ 最近N轮对话 │           │   │
│  │  │ (固定)     │ │ (动态)     │ │ (完整)     │           │   │
│  │  │ ~500 tokens│ │ ~800 tokens│ │ ~3000 tokens│           │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│                              │                                      │
│  ┌───────────────────────────┴─────────────────────────────────┐   │
│  │                    后端存储                                  │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │   │
│  │  │ 摘要历史    │ │ 关键事实    │ │ 原始对话    │           │   │
│  │  │ (SQLite)   │ │ (L1记忆层) │ │ (可选存档) │           │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**压缩触发机制 (ADR-032)：**

| 触发条件 | 阈值 | 动作 |
|---------|------|------|
| **Token占用** | > 80%（可配置） | 自动触发压缩 |
| **轮次限制** | > 20轮 | 可选触发 |

#### 压缩流程

```
┌─────────────────────────────────────────────────────────────────────┐
│                    上下文压缩流程                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Token检测 > 阈值(80%)                                              │
│       │                                                             │
│       ▼                                                             │
│  ┌─────────────────┐                                                │
│  │ 1. 分析对话历史 │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 2. 提取关键事实 │ ──→ 存入L1个人记忆层 (ADR-034)                 │
│  │   · 用户约束    │                                                │
│  │   · 业务决策    │                                                │
│  │   · 实体信息    │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 3. 生成结构化摘要│                                               │
│  │   · 摘要文本    │                                                │
│  │   · 关键实体    │                                                │
│  │   · 决策记录    │                                                │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 4. 保留最近N轮  │  (默认10轮)                                    │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 5. 存储摘要     │ ──→ SQLite                                    │
│  └────────┬────────┘                                                │
│           │                                                         │
│           ▼                                                         │
│  ┌─────────────────┐                                                │
│  │ 6. 通知用户     │ ──→ 简洁系统消息 (ADR-033)                     │
│  └─────────────────┘                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 数据结构设计

**摘要存储结构（SQLite）：**

```sql
CREATE TABLE context_summaries (
    id TEXT PRIMARY KEY,              -- 摘要ID
    session_id TEXT NOT NULL,         -- 会话ID
    created_at DATETIME NOT NULL,     -- 创建时间
    covered_turns_start INTEGER,      -- 覆盖起始轮次
    covered_turns_end INTEGER,        -- 覆盖结束轮次
    summary_text TEXT,                -- 摘要文本
    key_entities TEXT,                -- 关键实体(JSON)
    decisions TEXT,                   -- 决策记录(JSON)
    tokens_saved INTEGER,             -- 节省的Token数
    tenant_id TEXT NOT NULL,          -- 租户ID
    user_id TEXT NOT NULL,            -- 用户ID
    
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE INDEX idx_summaries_session ON context_summaries(session_id);
CREATE INDEX idx_summaries_created ON context_summaries(created_at);
```

**摘要JSON结构：**

```typescript
interface ContextSummary {
  id: string;
  sessionId: string;
  createdAt: string;
  coveredTurns: { start: number; end: number };
  summaryText: string;
  keyEntities: Record<string, string>;  // { "客户": "A公司", "预算": "10万" }
  decisions: string[];                   // ["使用美元计价", "初版折扣10%"]
  tokensSaved: number;
}
```

#### Rust 实现接口

```rust
pub struct ContextCompressor {
    threshold: f32,           // 压缩阈值 (默认 0.8)
    keep_recent_turns: usize, // 保留最近N轮 (默认 10)
    max_tokens: usize,        // 最大Token数
}

impl ContextCompressor {
    /// 检查是否需要压缩
    pub fn should_compress(&self, current_tokens: usize) -> bool {
        current_tokens as f32 / self.max_tokens as f32 > self.threshold
    }
    
    /// 执行压缩
    pub async fn compress(
        &self,
        messages: Vec<Message>,
        session_id: &str,
    ) -> Result<CompressResult, CompressError> {
        // 1. 提取关键事实
        let facts = self.extract_key_facts(&messages).await?;
        
        // 2. 存入L1记忆层
        self.memory_store.store_facts(&facts).await?;
        
        // 3. 生成摘要
        let summary = self.generate_summary(&messages).await?;
        
        // 4. 保留最近N轮
        let recent = messages.iter().rev().take(self.keep_recent_turns).rev().cloned().collect();
        
        // 5. 存储摘要
        self.summary_store.save(&summary).await?;
        
        Ok(CompressResult {
            summary,
            recent_messages: recent,
            tokens_saved: messages.len() - recent.len(),
        })
    }
}
```

#### 性能指标

| 指标 | 要求 |
|------|------|
| **压缩延迟** | < 2秒 |
| **Token节省率** | 目标 50-80% |
| **关键事实提取准确率** | > 90% |
| **摘要存储** | 每条约 500-1000 tokens |

### 工具系统设计

**工具定义Schema：JSON Schema**（原生支持OpenAI Function Calling）

#### 工具设计原则 (ADR-017)

```
┌─────────────────────────────────────────────────────────────────┐
│                    工具设计原则                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 原子性 (Atomicity)                                          │
│     • 每个工具只做一件事                                        │
│     • 工具不可再分解                                            │
│     • 例：read_file 不是 read_and_process_file                  │
│                                                                 │
│  2. 独特性 (Uniqueness)                                         │
│     • 工具之间有明确边界                                        │
│     • 描述必须清晰区分                                          │
│     • 避免功能重叠                                              │
│                                                                 │
│  3. 幂等性 (Idempotency)                                        │
│     • 相同输入产生相同结果                                      │
│     • 重复调用不会产生副作用                                    │
│                                                                 │
│  4. 安全性 (Safety)                                             │
│     • 敏感操作需要确认                                          │
│     • 参数严格验证                                              │
│     • 权限自动检查                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 工具命名规范 (ADR-017)

**格式：`{plugin}_{entity}_{action}`**

```
示例：
- hr_employee_list     # 人事_员工_列表
- hr_employee_create   # 人事_员工_创建
- hr_attendance_query  # 人事_考勤_查询
- finance_invoice_ocr  # 财务_发票_识别
- finance_expense_submit # 财务_报销_提交
- knowledge_search     # 知识库_搜索 (无entity)
- db_query             # 数据库_查询 (核心工具)
```

#### 通用工具架构设计 (ADR-025)

**背景：** 随着业务场景增多，如果每个场景都创建专用工具，系统将面临"工具爆炸"问题（预估150-200+工具），导致AI工具选择准确率下降、系统复杂度急剧上升。

**决策：** 采用"通用工具 + 参数化"设计，每个部门模块最多提供5个核心工具。

**工具类型定义：**

| 工具类型 | 命名格式 | 用途 | 说明 |
|---------|---------|------|------|
| **通用查询** | `{dept}_query` | 数据查询 | 支持多实体、灵活过滤、字段选择 |
| **统计聚合** | `{dept}_aggregate` | 统计汇总 | 支持sum/count/avg/max/min、分组聚合 |
| **数据变更** | `{dept}_mutate` | 增删改 | create/update/delete操作 |
| **业务操作** | `{dept}_action` | 特殊业务 | 审批、发货、入库等业务逻辑 |
| **数据导出** | `{dept}_export` | 导出报表 | Excel/PDF/CSV导出 |

**通用查询工具接口：**

```typescript
// 工具名: {department}_query
// 示例: sales_query, hr_query, finance_query

interface UniversalQueryParams {
  // 实体类型（必填）
  entity: string;  
  // sales: contract | order | customer | quote
  // hr: employee | department | attendance | position
  // finance: invoice | expense | payment | ledger
  // approval: request | workflow | template
  
  // 过滤条件（可选）
  filters?: {
    dateRange?: { start: Date; end: Date };
    status?: string | string[];
    ownerId?: string;           // 归属人（销售、审批人等）
    departmentId?: string;
    custom?: Record<string, any>; // 扩展条件
  };
  
  // 返回字段（可选，默认返回核心字段）
  fields?: string[];
  
  // 分页
  page?: number;
  pageSize?: number;
  
  // 排序
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

interface UniversalQueryResult {
  entity: string;
  total: number;
  items: Record<string, any>[];
}
```

**通用聚合工具接口：**

```typescript
// 工具名: {department}_aggregate
// 示例: sales_aggregate, hr_aggregate, finance_aggregate

interface UniversalAggregateParams {
  // 实体类型
  entity: string;
  
  // 过滤条件
  filters?: UniversalQueryParams['filters'];
  
  // 聚合配置
  aggregations: {
    metric: 'sum' | 'count' | 'avg' | 'max' | 'min';
    field: string;           // 聚合字段
    alias?: string;          // 别名
  }[];
  
  // 分组
  groupBy?: string | string[];
}

interface UniversalAggregateResult {
  entity: string;
  groups?: {
    key: string | Record<string, any>;
    metrics: Record<string, number>;
  }[];
  total?: Record<string, number>;
}
```

**数据变更工具接口：**

```typescript
// 工具名: {department}_mutate
// 示例: sales_mutate, hr_mutate, finance_mutate

interface UniversalMutateParams {
  // 操作类型
  action: 'create' | 'update' | 'delete';
  
  // 实体类型
  entity: string;
  
  // 数据（create/update时必填）
  data?: Record<string, any>;
  
  // 条件（update/delete时必填）
  where?: { id: string } | { ids: string[] };
}

interface UniversalMutateResult {
  success: boolean;
  affected?: number;
  id?: string;
}
```

**工具描述规范（帮助AI正确选择）：**

```typescript
const TOOL_DESCRIPTIONS = {
  // 通用查询工具
  "{dept}_query": `
    查询{部门名称}数据（{支持的实体列表}）
    适用场景：获取具体记录列表、查看详情、筛选数据
    参数：entity(必填), filters, fields, page, orderBy
    
    示例用法：
    - "今天签了哪些合同？" → entity: "contract", filters: { dateRange: "今天", status: "signed" }
    - "王明的客户有哪些？" → entity: "customer", filters: { ownerId: "王明ID" }
  `,
  
  // 统计聚合工具
  "{dept}_aggregate": `
    统计聚合{部门名称}数据
    适用场景：计算总和、平均值、计数、按条件分组统计
    参数：entity(必填), filters, aggregations(必填), groupBy
    
    示例用法：
    - "今天合同总额多少？" → entity: "contract", aggregations: [{ metric: "sum", field: "amount" }]
    - "按销售统计合同金额" → entity: "contract", aggregations: [...], groupBy: "salesName"
  `,
  
  // 数据变更工具
  "{dept}_mutate": `
    变更{部门名称}数据（创建、更新、删除）
    适用场景：新增记录、修改数据、删除记录
    参数：action(必填), entity(必填), data, where
    
    注意：敏感操作会触发用户确认
  `
};
```

**工具数量对比：**

| 部门 | 专用工具数（旧方案） | 通用工具数（新方案） | 减少比例 |
|------|---------------------|---------------------|---------|
| 销售部 | 30+ | 4 (query/aggregate/mutate/action) | 87% |
| 财务部 | 25+ | 4 | 84% |
| 人事部 | 20+ | 4 | 80% |
| 审批中心 | 20+ | 4 | 80% |
| 仓储部 | 15+ | 4 | 73% |
| 管理层 | 30+ | 3 (query/aggregate/export) | 90% |
| **总计** | **150+** | **~25** | **83%** |

**AI工具选择流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                    AI工具选择流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户问题："今天签了哪些合同？总额多少？"                   │
│                                                             │
│  Step 1: 意图识别                                           │
│  ├── 部门：销售部 (sales)                                   │
│  ├── 实体：合同 (contract)                                  │
│  ├── 操作：查询 + 聚合                                      │
│  └── 条件：时间=今天                                        │
│                                                             │
│  Step 2: 工具选择                                           │
│  ├── 部门 → sales_*                                        │
│  ├── 操作类型：                                             │
│  │   ├── 纯查询 → sales_query                              │
│  │   ├── 聚合统计 → sales_aggregate                        │
│  │   └── 混合 → 先query后aggregate                         │
│                                                             │
│  Step 3: 参数构建                                           │
│  └── AI根据意图自动填充参数                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**部门工具清单：**

| 部门 | query | aggregate | mutate | action | export |
|------|:-----:|:---------:|:------:|:------:|:------:|
| 人事部 (hr) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 销售部 (sales) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 财务部 (finance) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 仓储部 (warehouse) | ✅ | ✅ | ✅ | ✅ | - |
| 审批中心 (approval) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 管理层 (management) | ✅ | ✅ | - | - | ✅ |
| 售后服务 (afterSales) | ✅ | ✅ | ✅ | ✅ | - |
| 招投标 (bidding) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 市场宣传 (marketing) | ✅ | ✅ | ✅ | - | ✅ |

#### 工具策略管道：

```
请求工具调用
     ↓
[参数验证]
     ↓
[白名单检查]
     ↓
[黑名单检查]
     ↓
[路径策略]
     ↓
[循环检测]
     ↓
[权限检查] ← 字段级权限
     ↓
[敏感操作确认] ← ADR-019
     ↓
[执行工具]
     ↓
[结果过滤]
```

#### 字段级权限设计 (ADR-018)

**后台动态配置实现：**

```rust
pub struct FieldPermission {
    pub field: String,
    pub visible_to: Vec<Role>,
    pub editable_by: Vec<Role>,
}

pub struct TablePermission {
    pub table: String,
    pub field_permissions: Vec<FieldPermission>,
    pub row_filter: RowFilter,
}

pub enum RowFilter {
    None,           // 管理员：无过滤
    ByUserId,       // 只能看自己的数据
    ByDepartment,   // 只能看部门数据
}

// 权限管理器
impl PermissionManager {
    pub fn apply_field_permission(
        &self,
        query: &mut Query,
        table: &str,
        role: &Role,
        user_id: &str,
    ) -> Result<(), Error> {
        // 1. 从后台获取权限配置
        let permission = self.fetch_table_permission(table).await?;
        
        // 2. 过滤不可见字段
        for field in &query.fields {
            if !permission.is_field_visible(field, role) {
                query.remove_field(field);
            }
        }
        
        // 3. 应用行级过滤
        match permission.row_filter {
            RowFilter::ByUserId => {
                query.add_condition("user_id", "=", user_id);
            },
            RowFilter::ByDepartment => {
                let dept_id = self.get_user_department(user_id).await?;
                query.add_condition("department_id", "=", dept_id);
            },
            RowFilter::None => {},
        }
        
        Ok(())
    }
}
```

**后台配置API：**
```typescript
// 权限配置接口
interface PermissionConfigAPI {
  // 获取表权限配置
  getTablePermission(table: string): Promise<TablePermission>;
  
  // 更新字段权限
  updateFieldPermission(
    table: string,
    field: string,
    permission: FieldPermission
  ): Promise<void>;
  
  // 更新行级过滤规则
  updateRowFilter(
    table: string,
    filter: RowFilter
  ): Promise<void>;
}
```

**示例配置（员工表）：**
```json
{
  "table": "employees",
  "field_permissions": [
    {
      "field": "id",
      "visible_to": ["admin", "manager", "employee"],
      "editable_by": ["admin"]
    },
    {
      "field": "name",
      "visible_to": ["admin", "manager", "employee"],
      "editable_by": ["admin", "employee"]
    },
    {
      "field": "salary",
      "visible_to": ["admin", "manager"],
      "editable_by": ["admin"]
    },
    {
      "field": "bank_account",
      "visible_to": ["admin", "employee"],
      "editable_by": ["employee"]
    }
  ],
  "row_filter": "ByUserId"
}
```

#### 敏感操作确认设计 (ADR-019)

**聊天界面内弹出确认卡片：**

```typescript
// 敏感操作配置
interface SensitiveOperationConfig {
  operation_id: string;
  operation_name: string;
  tool_pattern: string;           // 工具匹配模式（支持通配符）
  sensitivity_level: 'high' | 'medium' | 'low';
  require_confirmation: boolean;
  confirmation_type: 'user' | 'manager' | 'admin';
  audit_log: boolean;
  enabled: boolean;
}

// 默认配置
const defaultSensitiveOperations: SensitiveOperationConfig[] = [
  {
    operation_id: 'delete_data',
    operation_name: '删除数据',
    tool_pattern: '*_delete',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'admin',
    audit_log: true,
    enabled: true,
  },
  {
    operation_id: 'approve_request',
    operation_name: '审批通过',
    tool_pattern: '*_approve',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'user',
    audit_log: true,
    enabled: true,
  },
  {
    operation_id: 'salary_modify',
    operation_name: '薪资修改',
    tool_pattern: 'hr_salary_*',
    sensitivity_level: 'high',
    require_confirmation: true,
    confirmation_type: 'admin',
    audit_log: true,
    enabled: true,
  },
];
```

**确认流程：**
```
用户请求 → LLM选择工具 → 检查敏感操作配置
                                   ↓
                              [是否敏感？]
                             /            \
                           否              是
                           ↓               ↓
                       直接执行      弹出确认卡片
                                           ↓
                                    [用户确认？]
                                   /            \
                                 取消            确认
                                  ↓               ↓
                              返回取消        执行工具
                              消息             ↓
                                          记录审计日志
```

**前端确认卡片组件：**
```tsx
// 聊天界面内的确认卡片
<ConfirmationCard
  operation={{
    tool: "hr_employee_delete",
    params: { employee_id: "12345" },
    description: "确认删除员工张三？此操作不可撤销。",
    sensitivity: "high"
  }}
  onConfirm={() => executeTool()}
  onCancel={() => cancelOperation()}
/>
```

#### 工具实现优先级 (ADR-020)

**MVP内置工具优先：**

```
┌─────────────────────────────────────────────────────────────────┐
│                    工具实现优先级                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Phase 1: MVP 内置工具                                          │
│  ├── 基础工具层                                                 │
│  │   ├── file_read      # 读取文件                             │
│  │   ├── file_write     # 写入文件                             │
│  │   ├── file_edit      # 编辑文件                             │
│  │   ├── dir_list       # 列出目录                             │
│  │   ├── pattern_search # 模式搜索（基于 ripgrep）             │
│  │   ├── bash_execute   # Bash 命令执行（沙箱隔离）            │
│  │   ├── web_search     # Web 搜索                             │
│  │   ├── web_fetch      # Web 内容获取                         │
│  │   ├── sys_time       # 系统时间                             │
│  │   └── http_request   # HTTP请求                             │
│  │                                                              │
│  ├── 平台知识库工具层 (Platform Knowledge)                     │
│  │   ├── knowledge_query   # 知识检索（平台能力）              │
│  │   │   # 支持多知识库配置，不同 Agent 可绑定不同知识库       │
│  │   │   # 所有知识库类型均可查询                             │
│  │   │                                                        │
│  │   └── knowledge_mutate  # 知识变更（AI可上传更新）          │
│  │       # AI 可根据用户需求自动整理并上传知识                 │
│  │       # 审核机制确保知识质量：                              │
│  │       # - 全局知识库：需要管理员审核                        │
│  │       # - 部门知识库：需要部门负责人审核                    │
│  │       # - 个人知识库：无需审核，直接生效                    │
│  │       # 支持重复检测和智能合并                              │
│  │                                                              │
│  ├── 平台数据工具层 (Platform Database)                         │
│  │   └── db_query    # 查询数据（只读暴露）                    │
│  │       # 白名单表限制，仅允许查询非敏感表                    │
│  │       # 自动注入租户隔离条件                                │
│  │       # 敏感字段脱敏（手机号、身份证、密码等）              │
│  │       # 完整审计日志 + 调用频率限制                         │
│  │       # 所有写操作必须通过业务插件工具执行                  │
│  │                                                              │
│  └── 插件业务工具层（通用工具架构）                            │
│      ├── hr_query      # 人事查询（员工/部门/考勤）            │
│      ├── hr_aggregate  # 人事统计聚合                          │
│      ├── hr_mutate     # 人事数据变更                          │
│      ├── hr_action     # 人事业务操作（审批/入职/离职）        │
│      ├── hr_export     # 人事数据导出                          │
│      ├── sales_query   # 销售查询（合同/订单/客户）            │
│      ├── sales_aggregate # 销售统计聚合                        │
│      ├── sales_mutate  # 销售数据变更                          │
│      ├── sales_action  # 销售业务操作                          │
│      ├── sales_export  # 销售数据导出                          │
│      └── ...其他插件（遵循相同架构）                           │
│                                                                 │
│  Phase 2: Post-MVP 扩展                                         │
│  └── MCP外部工具：通过MCP协议接入第三方服务                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 平台工具层详细设计

> 平台工具是跨插件的核心能力，所有插件可调用，但权限由平台统一管理

##### 1. 知识库检索工具 (knowledge_query)

**设计理念：** 知识库作为平台能力，支持多知识库配置，不同 Agent 可绑定不同知识库。

```typescript
// 工具定义
{
  name: "knowledge_query",
  description: `检索企业知识库内容。

适用场景：
- 查询公司政策、流程规范
- 搜索产品文档、技术资料
- 检索历史案例、经验沉淀

知识库范围：
- global: 全局知识库（全员可访问）
- department: 部门知识库（部门成员可访问）
- personal: 个人知识库（仅本人可访问）

注意：
- AI 无创建知识库权限，仅查询权限
- 管理员通过设置界面配置知识库
- 知识库与 Agent 绑定关系由用户配置`,
  parameters: {
    type: "object",
    properties: {
      knowledge_base_id: {
        type: "string",
        description: "知识库ID（可选，不填则搜索所有可访问的知识库）"
      },
      query: {
        type: "string",
        description: "搜索内容"
      },
      scope: {
        type: "string",
        enum: ["global", "department", "personal", "all"],
        description: "知识库范围",
        default: "all"
      },
      filters: {
        type: "object",
        properties: {
          type: { type: "string", description: "文档类型" },
          tags: { type: "array", items: { type: "string" }, description: "标签" },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string", format: "date" },
              end: { type: "string", format: "date" }
            }
          }
        }
      },
      topK: {
        type: "number",
        description: "返回数量",
        default: 5
      },
      threshold: {
        type: "number",
        description: "相似度阈值",
        default: 0.7
      }
    },
    required: ["query"]
  }
}

// 返回结果
interface KnowledgeQueryResult {
  knowledge_base_id: string;
  knowledge_base_name: string;
  total: number;
  items: {
    id: string;
    content: string;
    source: string;
    score: number;
    metadata: Record<string, any>;
  }[];
}
```

**多知识库配置设计：**

```
┌─────────────────────────────────────────────────────────────┐
│              多知识库配置架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  知识库管理（设置界面）                                      │
│  ├── 创建知识库（管理员权限）                               │
│  ├── 配置知识库内容（上传文档、设置标签）                   │
│  ├── 设置访问权限（全员/部门/角色）                         │
│  ├── 配置审核人（企业/部门知识库）                          │
│  └── 绑定到 Agent（选择可访问的 Agent）                     │
│                                                             │
│  Agent 知识库绑定                                           │
│  ├── 主 Agent：可访问所有授权的知识库                       │
│  └── Sub-Agent：可配置独立的知识库范围                      │
│                                                             │
│  AI 权限与审核机制                                          │
│  ├── AI 可查询所有授权的知识库                              │
│  ├── AI 可根据用户需求上传更新知识                          │
│  ├── 全局知识库：需管理员审核                               │
│  ├── 部门知识库：需部门负责人审核                           │
│  └── 个人知识库：无需审核，直接生效                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

##### 2. 知识库变更工具 (knowledge_mutate)

**设计理念：** AI 可根据用户需求智能整理并上传知识，通过审核机制确保知识质量。

```typescript
// 工具定义
{
  name: "knowledge_mutate",
  description: `变更知识库内容（创建/更新/删除）。

适用场景：
- 用户要求保存维修经验到知识库
- 用户要求更新产品资料
- 用户要求删除过期的知识条目

知识库类型与审核：
- 全局知识库：提交后需管理员审核
- 部门知识库：提交后需部门负责人审核
- 个人知识库：无需审核，直接生效

质量保障：
- 系统自动检测重复内容
- 低质量内容会被标记
- 审核人可驳回并附原因`,
  parameters: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "update", "delete"],
        description: "操作类型"
      },
      knowledge_base_id: {
        type: "string",
        description: "知识库ID"
      },
      data: {
        type: "object",
        properties: {
          title: { type: "string", description: "知识标题" },
          content: { type: "string", description: "知识内容" },
          tags: { type: "array", items: { type: "string" }, description: "标签" },
          source: { type: "string", description: "来源（如：工单#123）" }
        },
        description: "知识数据（create/update时必填）"
      },
      where: {
        type: "object",
        properties: {
          id: { type: "string", description: "知识条目ID" }
        },
        description: "条件（update/delete时必填）"
      }
    },
    required: ["action", "knowledge_base_id"]
  }
}

// 返回结果
interface KnowledgeMutateResult {
  success: boolean;
  action: string;
  knowledge_base_id: string;
  knowledge_base_name: string;
  status: "pending_review" | "published" | "rejected";
  id?: string;
  message?: string;
  reviewer?: string;  // 审核人（如果需要审核）
}
```

**审核流程设计：**

```
┌─────────────────────────────────────────────────────────────┐
│              知识库审核流程                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  AI 提交知识                                                │
│      │                                                      │
│      ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           知识库类型判断                              │   │
│  └─────────────────────────────────────────────────────┘   │
│      │                                                      │
│      ├── 个人知识库 ──────────────────────────────────→ 直接发布
│      │                                                      │
│      ├── 全局/部门知识库                                    │
│      │       │                                              │
│      │       ▼                                              │
│      │   ┌─────────────────────────────────────────────┐   │
│      │   │         质量检测                              │   │
│      │   │  - 重复检测：与现有知识相似度 > 90%？        │   │
│      │   │  - 内容完整性：标题/内容是否完整？           │   │
│      │   │  - 格式规范性：是否包含必要字段？            │   │
│      │   └─────────────────────────────────────────────┘   │
│      │       │                                              │
│      │       ├── 检测通过 ──→ 提交审核                     │
│      │       │                   │                          │
│      │       │                   ▼                          │
│      │       │              通知审核人                      │
│      │       │                   │                          │
│      │       │                   ▼                          │
│      │       │              ┌─────────────┐                 │
│      │       │              │ 审核人审批  │                 │
│      │       │              └─────────────┘                 │
│      │       │                   │                          │
│      │       │                   ├── 通过 ──→ 发布知识     │
│      │       │                   └── 驳回 ──→ 通知AI/用户   │
│      │       │                                              │
│      │       └── 检测失败 ──→ 返回AI修改建议               │
│      │                                                      │
│  状态流转：                                                 │
│  [待提交] → [待审核] → [已发布] / [已驳回]                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**审核人配置：**

| 知识库类型 | 默认审核人 | 可配置 |
|-----------|-----------|--------|
| 全局知识库 | 租户管理员 | 支持指定多个审核人 |
| 部门知识库 | 部门负责人 | 支持指定部门内审核人 |
| 个人知识库 | 无需审核 | - |

##### 3. 云端数据查询工具 (db_query)

**设计理念：** 云端数据工具只读暴露，通过白名单限制访问范围，所有写操作必须通过业务插件工具执行。

```typescript
// 工具定义
{
  name: "db_query",
  description: `查询云端数据库（只读）。

适用场景：
- 跨插件数据关联查询
- 临时数据分析需求
- 系统配置查询

限制：
- 仅允许查询白名单中的表
- 敏感字段自动脱敏
- 自动注入租户隔离条件
- 完整审计日志

注意：
- 优先使用业务插件工具（如 sales_query, hr_query）
- 本工具仅用于无对应业务插件的场景`,
  parameters: {
    type: "object",
    properties: {
      table: {
        type: "string",
        description: "表名（必须在白名单中）"
      },
      filters: {
        type: "object",
        description: "查询条件"
      },
      fields: {
        type: "array",
        items: { type: "string" },
        description: "返回字段"
      },
      page: { type: "number", default: 1 },
      pageSize: { type: "number", default: 20 }
    },
    required: ["table"]
  }
}

// 返回结果
interface DBQueryResult {
  table: string;
  total: number;
  page: number;
  pageSize: number;
  items: Record<string, any>[];
}
```

**白名单配置设计：**

```
┌─────────────────────────────────────────────────────────────┐
│              db_query 白名单配置                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  默认白名单表：                                              │
│  ├── system_config      # 系统配置                          │
│  ├── departments        # 部门列表                          │
│  ├── roles              # 角色列表                          │
│  ├── permissions        # 权限列表                          │
│  ├── audit_logs         # 审计日志                          │
│  └── ... 其他非敏感表                                       │
│                                                             │
│  黑名单表（禁止查询）：                                      │
│  ├── users              # 用户敏感信息                      │
│  ├── passwords          # 密码表                            │
│  ├── api_keys           # API密钥                           │
│  └── ... 其他敏感表                                         │
│                                                             │
│  敏感字段脱敏规则：                                          │
│  ├── phone: 显示前3后4位，中间 ****                         │
│  ├── id_card: 显示前6后4位，中间 ****                       │
│  ├── password: 完全隐藏                                     │
│  ├── bank_account: 显示前4后4位                             │
│  └── email: 显示前3字符，@后完整显示                        │
│                                                             │
│  配置入口：设置 → 安全配置 → 数据访问白名单                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**安全控制机制：**

| 控制项 | 实现方式 |
|--------|---------|
| 白名单限制 | 仅允许查询白名单中的表 |
| 租户隔离 | 自动注入 tenant_id 条件 |
| 敏感字段脱敏 | 配置化脱敏规则 |
| 审计日志 | 记录所有查询操作 |
| 频率限制 | 每分钟最多 60 次查询 |
| 写操作禁止 | db_query 仅支持 SELECT |

##### 3. 工具描述规范与调试要求

**工具描述模板：**

```typescript
const TOOL_DESCRIPTION_TEMPLATE = `
  {工具功能概述}
  
  适用场景：
  - {场景1}
  - {场景2}
  
  参数说明：
  - {param1}: {说明} ({是否必填})
  
  示例用法：
  - "{用户问题}" → {参数示例}
`;
```

**调试迭代要求：**

```
┌─────────────────────────────────────────────────────────────┐
│              工具描述调试迭代流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: 初始定义                                          │
│  └── 基于业务需求定义工具描述                               │
│                                                             │
│  Phase 2: 集成测试                                          │
│  ├── 记录 AI 工具选择错误                                   │
│  ├── 记录参数构建错误                                       │
│  └── 记录用户纠正行为                                       │
│                                                             │
│  Phase 3: 分析优化                                          │
│  ├── 统计工具选择准确率                                     │
│  ├── 分析常见错误模式                                       │
│  └── 优化工具描述和示例                                     │
│                                                             │
│  Phase 4: 验证发布                                          │
│  ├── A/B 测试新描述效果                                     │
│  └── 发布优化后的工具描述                                   │
│                                                             │
│  迭代周期：每 2 周复盘一次工具描述效果                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

#### 基础工具层详细设计

> 基于 Anthropic、Vercel、Firecrawl 等最佳实践设计

##### 1. Bash 命令执行工具 (bash_execute)

**设计理念：** LLM 在训练时已大量接触 Unix/Bash 命令，这是"原生能力"而非"附加技能"。

```typescript
// 工具定义
{
  name: "bash_execute",
  description: `在沙箱环境中执行 Bash/Shell 命令。
  
适用场景：
- 文件系统操作（复制、移动、删除）
- 系统信息查询
- 开发工具调用（git, npm, cargo 等）
- 数据处理管道

注意事项：
- 命令在隔离的沙箱环境中执行
- 敏感操作（删除、修改）需要用户确认
- 输出超过限制时会自动截断`,
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "要执行的 Bash 命令"
      },
      timeout: {
        type: "number",
        description: "超时时间（秒），默认 120",
        default: 120
      },
      working_dir: {
        type: "string",
        description: "工作目录，默认为项目根目录"
      },
      env: {
        type: "object",
        description: "环境变量"
      }
    },
    required: ["command"]
  }
}

// 返回结果
interface BashResult {
  stdout: string;      // 标准输出
  stderr: string;      // 标准错误
  exit_code: number;   // 退出码
  interrupted: boolean; // 是否被超时中断
  truncated: boolean;   // 输出是否被截断
}
```

**安全控制设计：**

| 控制项 | 实现方式 |
|--------|---------|
| 沙箱隔离 | 限制工作目录范围，禁止访问系统敏感路径 |
| 命令白名单 | 允许的命令列表：ls, cat, grep, find, git, npm, cargo 等 |
| 命令黑名单 | 禁止的命令：rm -rf /, sudo, chmod 777 等 |
| 路径限制 | 仅允许访问项目目录和临时目录 |
| 超时控制 | 默认 120 秒，可配置 |
| 输出截断 | 限制 25000 tokens，超出则截断并提示 |

**错误处理：**
```rust
// Rust 实现
pub enum BashError {
    CommandNotAllowed(String),    // 命令不在白名单
    PathNotAllowed(String),       // 路径不在允许范围
    Timeout(u64),                 // 执行超时
    ExecutionFailed(String),      // 执行失败
    OutputTooLarge(usize),        // 输出过大
}

impl BashError {
    fn to_helpful_message(&self) -> String {
        match self {
            BashError::CommandNotAllowed(cmd) => 
                format!("命令 '{}' 不在允许列表中。请使用基础命令如 ls, cat, grep, find 等。", cmd),
            BashError::Timeout(secs) => 
                format!("命令执行超时（{}秒）。请尝试拆分任务或使用更具体的参数。", secs),
            // ...
        }
    }
}
```

##### 2. Web 搜索工具 (web_search)

**设计理念：** 让 Agent 获取实时信息，突破训练数据的时间限制。

```typescript
// 工具定义
{
  name: "web_search",
  description: `搜索互联网获取实时信息。

适用场景：
- 查询最新新闻和事件
- 搜索技术文档和教程
- 查找产品信息和价格
- 研究竞争对手

参数说明：
- query: 搜索关键词，应精确描述需求
- num: 返回结果数量，默认 10
- date_range: 时间范围过滤（可选）`,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "搜索查询词，使用具体关键词而非模糊描述"
      },
      num: {
        type: "number",
        description: "返回结果数量，默认 10",
        default: 10
      },
      date_range: {
        type: "string",
        enum: ["day", "week", "month", "year", "all"],
        description: "时间范围过滤",
        default: "all"
      },
      search_type: {
        type: "string",
        enum: ["web", "news", "images", "scholar"],
        description: "搜索类型",
        default: "web"
      }
    },
    required: ["query"]
  }
}

// 返回结果
interface WebSearchResult {
  query: string;
  total: number;
  results: Array<{
    title: string;
    snippet: string;      // 摘要
    url: string;
    date?: string;        // 发布日期
    source?: string;      // 来源
  }>;
}
```

**最佳实践：**
- 使用精确的搜索关键词（"React 19 new features" 而非 "React"）
- 返回结构化结果而非原始 HTML
- 支持日期过滤获取最新信息

##### 3. Web Fetch 工具 (web_fetch)

**设计理念：** 将网页内容转换为 LLM 友好格式，避免处理复杂 HTML。

```typescript
// 工具定义
{
  name: "web_fetch",
  description: `获取网页内容并转换为结构化格式。

适用场景：
- 阅读文章和博客
- 获取文档页面内容
- 提取产品信息
- 分析网页结构

转换规则：
- HTML 自动转换为 Markdown
- 移除导航栏、广告等无关内容
- 支持结构化数据提取`,
  parameters: {
    type: "object",
    properties: {
      url: {
        type: "string",
        description: "要获取的网页 URL（必须以 http:// 或 https:// 开头）"
      },
      prompt: {
        type: "string",
        description: "提取指令，指导如何处理内容（如：'提取文章主要内容'）"
      },
      format: {
        type: "string",
        enum: ["markdown", "text", "json"],
        description: "返回格式",
        default: "markdown"
      },
      selector: {
        type: "string",
        description: "CSS 选择器，提取特定区域内容"
      },
      max_length: {
        type: "number",
        description: "最大内容长度（字符），默认 50000",
        default: 50000
      }
    },
    required: ["url"]
  }
}

// 返回结果
interface WebFetchResult {
  url: string;
  title: string;
  content: string;       // 转换后的内容
  format: string;        // 返回格式
  links?: string[];      // 页面中的链接（可选）
  metadata?: {           // 元数据（可选）
    author?: string;
    publishDate?: string;
    wordCount?: number;
  };
}
```

**错误处理：**
```typescript
// 友好的错误提示
const ERROR_MESSAGES = {
  INVALID_URL: "URL 格式无效。请使用完整的 URL，如 'https://example.com/path'",
  TIMEOUT: "页面加载超时。请检查 URL 是否正确，或稍后重试。",
  NOT_FOUND: "页面不存在（404）。请确认 URL 是否正确。",
  BLOCKED: "页面访问被拒绝。可能是防爬虫机制，请尝试其他来源。",
  TOO_LARGE: "页面内容过大，已截断。如需完整内容，请使用 selector 参数提取特定区域。"
};
```

##### 4. Pattern 搜索工具 (pattern_search)

**设计理念：** 基于 ripgrep 的高性能代码/文本搜索，比传统 grep 快 10-100 倍。

```typescript
// 工具定义
{
  name: "pattern_search",
  description: `在文件中搜索匹配的文本模式（基于 ripgrep）。

适用场景：
- 搜索代码中的函数定义、变量引用
- 查找日志中的特定模式
- 搜索配置文件内容
- 批量查找文本

性能优势：
- 比 grep 快 10-100 倍
- 自动尊重 .gitignore
- 支持正则表达式`,
  parameters: {
    type: "object",
    properties: {
      pattern: {
        type: "string",
        description: "搜索模式（支持正则表达式）"
      },
      path: {
        type: "string",
        description: "搜索路径，默认当前工作目录"
      },
      include: {
        type: "string",
        description: "文件过滤模式（如 '*.ts', '*.{js,ts}'）"
      },
      case_sensitive: {
        type: "boolean",
        description: "是否区分大小写",
        default: false
      },
      context: {
        type: "number",
        description: "显示匹配行上下文行数",
        default: 0
      },
      fixed_strings: {
        type: "boolean",
        description: "将 pattern 视为字面字符串而非正则",
        default: false
      },
      max_results: {
        type: "number",
        description: "最大结果数量",
        default: 100
      }
    },
    required: ["pattern"]
  }
}

// 返回结果
interface PatternSearchResult {
  pattern: string;
  total_matches: number;
  files_searched: number;
  matches: Array<{
    file: string;
    line: number;
    column: number;
    content: string;
    context_before?: string[];
    context_after?: string[];
  }>;
  truncated: boolean;
}
```

**使用示例：**
```typescript
// 搜索函数定义
pattern_search({ pattern: "function\\s+\\w+User", include: "*.ts" })

// 搜索 import 语句
pattern_search({ pattern: "import.*from.*react", include: "*.{ts,tsx}" })

// 搜索 TODO 注释（显示上下文）
pattern_search({ pattern: "TODO|FIXME", context: 2 })

// 精确匹配字符串
pattern_search({ pattern: "getUserById", fixed_strings: true })
```

##### 基础工具层设计原则

**基于行业最佳实践总结：**

| 原则 | 说明 | 来源 |
|------|------|------|
| **原子性** | 每个工具只做一件事，不可再分解 | Anthropic |
| **明确边界** | 工具之间功能不重叠，命名空间清晰 | Anthropic |
| **有意义返回** | 返回语义化信息而非技术标识符 | Anthropic |
| **Token 效率** | 输出截断、分页、精简返回 | Anthropic |
| **原生能力优先** | Bash/grep 等是 LLM 原生技能 | Vercel |
| **沙箱隔离** | 敏感操作隔离执行，权限最小化 | 行业标准 |
| **友好错误** | 错误信息指导如何修正，而非报错码 | Firecrawl |

**工具描述编写规范：**
```typescript
// 好的工具描述示例
{
  name: "pattern_search",
  description: `在文件中搜索匹配的文本模式。
  
适用场景：
- 搜索代码中的函数定义、变量引用
- 查找配置文件中的特定值
- 搜索日志中的错误模式

注意事项：
- 支持正则表达式，特殊字符需转义
- 使用 include 参数限制文件类型可提升性能
- 结果过多时会截断，请使用更精确的模式`
}

// 不好的工具描述示例
{
  name: "pattern_search",
  description: "搜索文件"  // 过于简单，AI 无法正确使用
}
```

#### 工具动态选择架构（大量工具场景）

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tool Router 架构                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户请求                                                       │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Tool Router (语义路由)                      │   │
│  │  1. 用户请求 → 向量嵌入                                   │   │
│  │  2. 检索相似历史记录（工具调用历史）                       │   │
│  │  3. 确定候选工具集（缩小选择范围）                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              候选工具集 (候选工具)                        │   │
│  │  根据请求类型筛选相关工具，而非全部工具                    │   │
│  │  例：人事查询 → 仅返回 hr_* 工具                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              LLM 工具选择                                │   │
│  │  从候选工具中选择最合适的                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│      │                                                          │
│      ▼                                                          │
│  工具执行                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**工具组定义：**
```typescript
const TOOL_GROUPS = {
  // 基础工具组
  filesystem: ["file_read", "file_write", "file_edit", "dir_list"],
  shell: ["bash_execute", "pattern_search"],
  web: ["web_search", "web_fetch", "http_request"],
  system: ["sys_time"],
  
  // 平台知识库工具组（平台能力，所有插件可调用）
  // AI 可查询和上传更新，企业/部门知识库需审核，个人知识库无需审核
  knowledge: ["knowledge_query", "knowledge_mutate"],
  
  // 平台数据工具组（只读暴露，白名单限制）
  // 所有写操作必须通过业务插件工具执行
  database: ["db_query"],
  
  // 业务插件工具组（遵循 plugin-dev-spec/03-tools-spec.md 规范）
  // 每个插件最多 5 个核心工具：query / aggregate / mutate / action / export
  hr: ["hr_query", "hr_aggregate", "hr_mutate", "hr_action", "hr_export"],
  sales: ["sales_query", "sales_aggregate", "sales_mutate", "sales_action", "sales_export"],
  finance: ["finance_query", "finance_aggregate", "finance_mutate", "finance_action", "finance_export"],
  warehouse: ["warehouse_query", "warehouse_aggregate", "warehouse_mutate", "warehouse_action"],
  approval: ["approval_query", "approval_aggregate", "approval_mutate", "approval_action", "approval_export"],
  // ...其他插件工具组（遵循相同架构）
};
```

#### 插件业务工具设计规范

> **重要**：所有业务插件工具设计必须遵循 [`plugin-dev-spec/03-tools-spec.md`](../plugin-dev-spec/03-tools-spec.md) 规范

**核心设计原则（ADR-025）：**

采用**通用工具 + 参数化**设计，避免"工具爆炸"问题：

```
❌ 错误模式：每个场景一个专用工具
hr_employee_list, hr_employee_get, hr_employee_create, hr_attendance_query, ...

✅ 正确模式：通用工具 + 灵活参数
hr_query(entity: "employee", filters: {...})
hr_query(entity: "attendance", filters: {...})
```

**每个插件的核心工具：**

| 工具类型 | 命名格式 | 用途 | 示例 |
|---------|---------|------|------|
| **query** | `{plugin}_query` | 通用数据查询 | `hr_query(entity: "employee")` |
| **aggregate** | `{plugin}_aggregate` | 统计聚合 | `sales_aggregate(entity: "contract", aggregations: [...])` |
| **mutate** | `{plugin}_mutate` | 数据变更 | `finance_mutate(action: "create", entity: "invoice")` |
| **action** | `{plugin}_action` | 业务操作 | `sales_action(action: "approve", entity: "contract")` |
| **export** | `{plugin}_export` | 数据导出 | `hr_export(entity: "employee", format: "excel")` |

**工具数量对比：**

| 部门 | 专用工具数（旧方案） | 通用工具数（新方案） | 减少 |
|------|---------------------|---------------------|------|
| 销售部 | 30+ | 5 | 83% |
| 财务部 | 25+ | 5 | 80% |
| 人事部 | 20+ | 5 | 75% |
| **总计** | **150+** | **~25** | **83%** |

**详细接口定义请参考：**
- [`plugin-dev-spec/03-tools-spec.md`](../plugin-dev-spec/03-tools-spec.md) - 工具层完整规范
- [`plugin-dev-spec/09-examples.md`](../plugin-dev-spec/09-examples.md) - 完整实现示例

#### 插件能力三层架构

> Tools 只是插件能力的第一层，复杂功能通过 Skills 和 MCP 扩展

```
┌─────────────────────────────────────────────────────────────┐
│                    插件能力三层架构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Layer 1: Tools (原子操作) - 每插件最多 5 个                 │
│  ├── query      通用查询（覆盖所有实体类型）                 │
│  ├── aggregate  统计聚合（sum/count/avg/max/min）           │
│  ├── mutate     数据变更（create/update/delete）            │
│  ├── action     业务操作（审批/发货/入职等）                 │
│  └── export     数据导出（Excel/PDF/CSV）                   │
│      ↓ 覆盖 90% 常规场景                                    │
│                                                             │
│  Layer 2: Skills (复杂技能) - 按需添加                      │
│  ├── AI生成合同      多工具组合 + LLM 生成                  │
│  ├── 智能报价        查询历史 + AI 分析 + 自动计算          │
│  ├── 批量入职        多次 mutate + 数据验证                 │
│  ├── 月度报告生成    aggregate + LLM 总结 + export          │
│  └── ... 自定义复杂流程                                     │
│      ↓ 处理需要多步骤、AI 辅助的复杂场景                    │
│                                                             │
│  Layer 3: MCP (外部服务) - 按需集成                         │
│  ├── 钉钉机器人      消息推送、审批回调                     │
│  ├── 企业微信        通知、通讯录同步                       │
│  ├── 闲鱼API         商品管理、订单同步                     │
│  └── ... 其他第三方服务                                     │
│      ↓ 扩展外部系统能力                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Skills 层设计规范

> Skills 是多个工具的组合，用于实现需要多步骤、AI 辅助的复杂业务场景

##### Skill 定义接口

```typescript
// skills/{skill-id}.ts
import { defineSkill } from '@office/plugin-sdk';

interface SkillDefinition {
  id: string;                    // Skill 标识
  name: string;                  // 显示名称
  description: string;           // 功能描述
  trigger: 'natural-language' | 'manual' | 'event';
  
  // 依赖的工具
  tools: string[];
  
  // 使用示例（帮助 AI 理解何时使用）
  examples: string[];
  
  // 执行流程
  execute: (context: SkillContext) => Promise<SkillResult>;
}

interface SkillContext {
  userMessage: string;           // 用户原始消息
  intent: Record<string, any>;   // 解析后的意图
  
  // 调用工具
  callTool: (name: string, params: any) => Promise<any>;
  
  // LLM 辅助
  llm: {
    analyze: (text: string, options: any) => Promise<any>;
    generate: (options: any) => Promise<string>;
  };
  
  // 事件发布
  emitEvent: (event: string, data: any) => void;
  
  // 用户交互
  askUser: (question: string) => Promise<string>;
}
```

##### Skill 实现示例：AI生成合同

```typescript
// skills/generate-contract.ts
import { defineSkill } from '@office/plugin-sdk';

export default defineSkill({
  id: 'generate-contract',
  name: 'AI生成合同',
  description: '根据客户信息和报价单自动生成合同初稿',
  trigger: 'natural-language',
  
  // 依赖的工具
  tools: ['sales_query', 'sales_mutate'],
  
  // 使用示例
  examples: [
    '帮我给XX公司生成一份采购合同',
    '根据报价单Q2024001生成合同',
    '为张三的客户创建销售合同'
  ],
  
  // 执行流程
  execute: async (context: SkillContext) => {
    const { userMessage, callTool, llm } = context;
    
    // Step 1: 解析用户意图
    const intent = await llm.analyze(userMessage, {
      task: 'extract_contract_requirements',
      schema: {
        customerName: 'string?',
        quoteId: 'string?',
        requirements: 'string?'
      }
    });
    
    // Step 2: 查询客户信息
    const customer = await callTool('sales_query', {
      entity: 'customer',
      filters: { keyword: intent.customerName }
    });
    
    if (!customer.items.length) {
      return {
        success: false,
        message: `未找到客户"${intent.customerName}"，请确认客户名称`
      };
    }
    
    // Step 3: 查询报价单（如有）
    let quote = null;
    if (intent.quoteId) {
      quote = await callTool('sales_query', {
        entity: 'quote',
        filters: { id: intent.quoteId }
      });
    }
    
    // Step 4: AI 生成合同内容
    const contractContent = await llm.generate({
      template: 'sales/contract_template',
      variables: {
        customer: customer.items[0],
        quote: quote?.items[0],
        requirements: intent.requirements,
        currentDate: new Date().toISOString().split('T')[0]
      }
    });
    
    // Step 5: 创建合同草稿
    const result = await callTool('sales_mutate', {
      action: 'create',
      entity: 'contract',
      data: {
        ...contractContent,
        status: 'draft',
        source: 'ai_generated'
      }
    });
    
    // Step 6: 发布事件
    context.emitEvent('sales:contract:generated', {
      contractId: result.id,
      customerId: customer.items[0].id
    });
    
    return {
      success: true,
      message: '合同已生成，请查看并确认',
      contractId: result.id,
      preview: contractContent.summary
    };
  }
});
```

##### Skill 注册

```typescript
// skills/index.ts
import generateContract from './generate-contract';
import generateQuote from './generate-quote';
import batchOnboard from './batch-onboard';
import monthlyReport from './monthly-report';

export const skills = [
  generateContract,
  generateQuote,
  batchOnboard,
  monthlyReport
];
```

##### 内置 Skills 列表

| 插件 | Skill ID | 功能 | 依赖工具 |
|------|----------|------|---------|
| sales | `generate-contract` | AI生成合同 | query, mutate |
| sales | `generate-quote` | 智能报价 | query, aggregate, mutate |
| hr | `batch-onboard` | 批量入职 | mutate |
| hr | `monthly-report` | 月度人事报告 | aggregate, export |
| finance | `invoice-ocr` | 发票识别入库 | action, mutate |
| warehouse | `inventory-alert` | 库存预警分析 | aggregate, action |

#### MCP 层设计规范

> MCP (Model Context Protocol) 用于接入外部第三方服务

##### MCP 服务定义

```typescript
// mcp/xianyu-adapter.ts
import { defineMCPService } from '@office/plugin-sdk';

export default defineMCPService({
  id: 'xianyu-adapter',
  name: '闲鱼平台接入',
  protocol: 'mcp',
  version: '2024-11-05',
  
  // 连接配置
  config: {
    endpoints: ['message', 'order', 'product'],
    authType: 'oauth2',
    scopes: ['read', 'write']
  },
  
  // 环境变量
  envVars: ['XIANYU_APP_ID', 'XIANYU_APP_SECRET'],
  
  // 健康检查
  healthCheck: {
    interval: 60000,  // 1分钟
    timeout: 5000
  },
  
  // MCP 工具定义
  tools: [
    {
      name: 'xianyu_send_message',
      description: '发送闲鱼消息给买家',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string', description: '订单ID' },
          message: { type: 'string', description: '消息内容' }
        },
        required: ['orderId', 'message']
      },
      handler: async (params, context) => {
        return await context.mcpClient.call('xianyu', 'sendMessage', params);
      }
    },
    {
      name: 'xianyu_get_orders',
      description: '获取闲鱼订单列表',
      parameters: {
        type: 'object',
        properties: {
          status: { 
            type: 'string', 
            enum: ['pending', 'paid', 'shipped', 'completed'],
            description: '订单状态'
          },
          page: { type: 'number', default: 1 },
          pageSize: { type: 'number', default: 20 }
        }
      },
      handler: async (params, context) => {
        return await context.mcpClient.call('xianyu', 'getOrders', params);
      }
    }
  ],
  
  // 事件订阅
  events: {
    'order.created': async (data, context) => {
      // 订单创建时同步到本地
      await context.callTool('sales_mutate', {
        action: 'create',
        entity: 'order',
        data: { ...data, source: 'xianyu' }
      });
    },
    'message.received': async (data, context) => {
      // 消息接收时触发通知
      context.emitEvent('xianyu:message', data);
    }
  }
});
```

##### MCP 配置文件

```toml
# config/mcp.toml
[[mcp_servers]]
name = "xianyu"
transport = "http"
url = "https://mcp.xianyu.com/v1"
auth_type = "oauth2"
env_vars = ["XIANYU_APP_ID", "XIANYU_APP_SECRET"]

[[mcp_servers]]
name = "dingtalk"
transport = "http"
url = "https://mcp.dingtalk.com/v1"
auth_type = "appkey"
env_vars = ["DINGTALK_APP_KEY", "DINGTALK_APP_SECRET"]

[[mcp_servers]]
name = "filesystem"
transport = "stdio"
command = "mcp-filesystem"
args = ["/path/to/workspace"]
```

##### 内置 MCP 服务列表

| MCP 服务 | 功能 | 用途 |
|---------|------|------|
| `dingtalk` | 钉钉集成 | 消息推送、审批回调、通讯录同步 |
| `wecom` | 企业微信集成 | 通知、客户管理 |
| `xianyu` | 闲鱼平台 | 商品管理、订单同步 |
| `filesystem` | 文件系统 | 本地文件操作 |
| `database` | 数据库 | 通用数据库操作 |

#### 能力扩展决策指南

```
┌─────────────────────────────────────────────────────────────┐
│                    如何选择扩展方式                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  问题：需要新增一个功能                                     │
│                                                             │
│  Step 1: 是否是原子操作？                                   │
│  ├── 是 → 使用现有 Tools + 参数实现                         │
│  │         例：查询员工 → hr_query(entity: "employee")      │
│  │                                                          │
│  └── 否（需要多步骤）→ 进入 Step 2                          │
│                                                             │
│  Step 2: 是否需要 AI 辅助或多工具组合？                     │
│  ├── 是 → 创建 Skill                                        │
│  │         例：AI生成合同 → generate-contract Skill         │
│  │                                                          │
│  └── 否（外部系统）→ 进入 Step 3                            │
│                                                             │
│  Step 3: 是否需要接入第三方服务？                           │
│  ├── 是 → 创建 MCP 服务                                     │
│  │         例：闲鱼订单同步 → xianyu MCP                    │
│  │                                                          │
│  └── 否 → 重新评估是否可以用现有能力实现                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 错误处理机制

**跨层错误处理设计：**

| 错误类型 | 处理层级 | 处理方式 |
|---------|---------|---------|
| LLM API错误（rate_limit, timeout） | LLM Adapter | Profile轮换 + 退避重试 |
| 工具执行错误 | Tool System | 返回错误给Observe层 |
| 循环检测触发 | Tool System | 直接终止，不重试 |
| 网络错误 | LLM Adapter | 指数退避重试 |

**循环检测机制：**
- 无进展检测：相同工具调用结果不变
- 乒乓检测：两个工具交替调用
- 熔断器：全局调用次数限制

### ReAct循环实现

**TAO循环 (Think-Act-Observe)：**
```
Think  → 分析当前状态与目标，规划下一步策略
Act    → 选择工具并生成参数，执行调用
Observe→ 获取执行结果，更新上下文理解
```

**终止条件：**
```rust
pub enum TerminationReason {
    TaskCompleted,           // 任务完成，输出最终答案
    MaxIterationsReached,    // 达到最大迭代次数（建议15-30）
    LoopDetected,            // 检测到循环
    TokenLimitExceeded,      // Token超限
    UserInterrupted,         // 用户中断
    ErrorUnrecoverable,      // 不可恢复错误
    TimeoutExceeded,         // 超时
}
```

### 断点续传与批量操作恢复

**设计原则：**
- 所有长时间任务支持断点保存
- 批量操作支持从中断位置恢复
- 网络中断后自动重连续传

**断点数据结构：**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Checkpoint {
    pub task_id: String,
    pub session_id: String,
    pub current_step: usize,
    pub total_steps: usize,
    pub completed_items: Vec<CompletedItem>,
    pub pending_items: Vec<PendingItem>,
    pub context: SessionContext,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompletedItem {
    pub item_id: String,
    pub tool_call: ToolCall,
    pub result: Value,
    pub completed_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingItem {
    pub item_id: String,
    pub tool_name: String,
    pub parameters: Value,
    pub dependencies: Vec<String>,  // 依赖的已完成项
}
```

**恢复流程：**
```
任务中断
    │
    ├─► 自动保存断点
    │        │
    │        └─► 存储到本地SQLite
    │
    └─► 用户选择恢复
             │
             ├─► 加载断点数据
             │
             ├─► 展示已完成/待完成列表
             │
             ├─► 用户选择：
             │        ├─► [从断点继续] → 执行pending_items
             │        ├─► [重新开始] → 清除断点，重头执行
             │        └─► [取消任务] → 清除断点
             │
             └─► 继续执行
```

**Rust实现：**
```rust
pub struct CheckpointManager {
    db: Arc<Database>,
}

impl CheckpointManager {
    /// 保存断点
    pub async fn save_checkpoint(&self, checkpoint: &Checkpoint) -> Result<(), Error> {
        self.db.insert_checkpoint(checkpoint).await
    }
    
    /// 加载断点
    pub async fn load_checkpoint(&self, task_id: &str) -> Result<Option<Checkpoint>, Error> {
        self.db.get_checkpoint(task_id).await
    }
    
    /// 恢复执行
    pub async fn resume_from_checkpoint(&self, task_id: &str) -> Result<Vec<Value>, Error> {
        let checkpoint = self.load_checkpoint(task_id).await?
            .ok_or(Error::CheckpointNotFound)?;
        
        let mut results = Vec::new();
        for pending in &checkpoint.pending_items {
            // 检查依赖是否满足
            if self.check_dependencies(&pending.dependencies, &checkpoint.completed_items) {
                let result = self.execute_item(pending).await?;
                results.push(result);
            }
        }
        
        // 清理已完成的断点
        self.db.delete_checkpoint(task_id).await?;
        Ok(results)
    }
}
```

## 操作黑名单机制架构

> **设计理念：** 黑名单机制采用分级设计，用户可自主设置个人级黑名单，AI可辅助推荐黑名单规则，管理员可设置企业级黑名单。用于控制AI行为边界，防止逾越雷池。

### 分级架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    黑名单分级架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  优先级：企业级 > 部门级 > 个人级                                │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏢 企业级黑名单（管理员设置，全员生效）                  │   │
│  │  • 批量删除员工数据                                      │   │
│  │  • 导出全部客户信息                                      │   │
│  │  • 修改系统配置                                          │   │
│  │  不可被下级覆盖                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🏛️ 部门级黑名单（部门主管设置，本部门生效）              │   │
│  │  销售部: • 导出客户联系方式                              │   │
│  │  财务部: • 批量修改应付金额                              │   │
│  │  不可被个人覆盖                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  👤 个人级黑名单（用户自主设置，仅本人生效）              │   │
│  │  • 自动发送邮件（担心误发）                              │   │
│  │  • 修改已审批的报价单                                    │   │
│  │  用户可自主管理                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 匹配规则设计

**采用简单通配符模式：**

| 匹配模式 | 语法 | 示例 | 说明 |
|---------|------|------|------|
| 精确匹配 | `tool_name` | `sales_contract_sign` | 只匹配这一个工具 |
| 前缀通配 | `prefix_*` | `hr_salary_*` | 匹配所有以prefix开头的工具 |
| 后缀通配 | `*_suffix` | `*_delete` | 匹配所有以suffix结尾的工具 |
| 包含通配 | `*keyword*` | `*export*` | 匹配所有包含keyword的工具 |
| 分组匹配 | `@group:name` | `@group:filesystem` | 匹配指定分组的所有工具 |

**匹配优先级：**
```
精确匹配 > 分组匹配 > 前缀通配 > 后缀通配 > 包含通配
```

**Rust实现：**
```rust
pub struct BlacklistMatcher {
    patterns: Vec<BlacklistPattern>,
}

#[derive(Debug, Clone)]
pub struct BlacklistPattern {
    pub pattern: String,
    pub level: BlacklistLevel,
    pub reason: String,
    pub created_by: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, PartialEq, Ord, PartialOrd)]
pub enum BlacklistLevel {
    Personal = 1,
    Department = 2,
    Enterprise = 3,
}

impl BlacklistMatcher {
    /// 检查工具是否在黑名单中
    pub fn check(&self, tool_name: &str, context: &MatchContext) -> Result<(), BlacklistBlock> {
        let mut matched_patterns: Vec<&BlacklistPattern> = self.patterns.iter()
            .filter(|p| self.match_pattern(&p.pattern, tool_name))
            .filter(|p| self.is_applicable(p, context))
            .collect();
        
        // 按优先级排序（企业级 > 部门级 > 个人级）
        matched_patterns.sort_by(|a, b| b.level.cmp(&a.level));
        
        if let Some(blocked) = matched_patterns.first() {
            return Err(BlacklistBlock {
                tool_name: tool_name.to_string(),
                pattern: blocked.pattern.clone(),
                reason: blocked.reason.clone(),
                level: blocked.level.clone(),
            });
        }
        
        Ok(())
    }
    
    /// 匹配模式
    fn match_pattern(&self, pattern: &str, tool_name: &str) -> bool {
        // 分组匹配
        if pattern.starts_with("@group:") {
            let group = &pattern[7..];
            return self.tool_belongs_to_group(tool_name, group);
        }
        
        // 精确匹配
        if !pattern.contains('*') {
            return pattern == tool_name;
        }
        
        // 通配符匹配
        let regex_pattern = pattern
            .replace(".", "\\.")
            .replace("*", ".*");
        let re = Regex::new(&format!("^{}$", regex_pattern)).unwrap();
        re.is_match(tool_name)
    }
    
    /// 检查规则是否适用于当前上下文
    fn is_applicable(&self, pattern: &BlacklistPattern, context: &MatchContext) -> bool {
        match pattern.level {
            BlacklistLevel::Enterprise => true,
            BlacklistLevel::Department => {
                pattern.created_by.starts_with("dept:") && 
                context.user_department == pattern.created_by[5..]
            },
            BlacklistLevel::Personal => {
                pattern.created_by == context.user_id
            },
        }
    }
}
```

### AI辅助推荐机制

```rust
pub struct BlacklistRecommender {
    db: Arc<Database>,
}

impl BlacklistRecommender {
    /// 分析用户行为，推荐黑名单规则
    pub async fn analyze_and_recommend(&self, user_id: &str) -> Result<Vec<BlacklistRecommendation>, Error> {
        // 获取用户最近的工具调用历史
        let history = self.db.get_tool_call_history(user_id, Duration::days(30)).await?;
        
        // 分析取消/回退行为
        let cancelled_calls = history.iter()
            .filter(|h| h.status == CallStatus::Cancelled)
            .group_by(|h| h.tool_name.clone());
        
        let mut recommendations = Vec::new();
        
        for (tool_name, calls) in &cancelled_calls {
            if calls.count() >= 3 {
                // 同一工具取消3次以上，推荐加入黑名单
                recommendations.push(BlacklistRecommendation {
                    pattern: tool_name.to_string(),
                    reason: format!("您最近{}次取消了此操作", calls.count()),
                    confidence: 0.8,
                });
            }
        }
        
        Ok(recommendations)
    }
}
```

### 配置存储

```yaml
# 黑名单配置存储结构
blacklists:
  enterprise:
    - pattern: "@group:filesystem"
      reason: "安全策略：禁止AI操作文件系统"
      created_by: "admin"
      created_at: 1709875200
    - pattern: "*_delete"
      reason: "安全策略：禁止删除数据"
      created_by: "admin"
      created_at: 1709875200
      
  departments:
    sales:
      - pattern: "customer_export"
        reason: "防止客户信息泄露"
        created_by: "dept_manager_sales"
        created_at: 1709875200
        
  personal:
    user_001:
      - pattern: "*_email_send"
        reason: "担心误发邮件"
        created_by: "user_001"
        created_at: 1709875200
```

## Agent可观测性架构

> **设计理念：** 提供全面的Agent运行状态监控和数据统计，帮助用户了解Token消耗、任务执行效率，帮助管理员优化系统配置。

### 观测维度

```
┌─────────────────────────────────────────────────────────────────┐
│                    可观测性维度                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Token监控                                                   │
│     • 输入/输出/总计Token统计                                   │
│     • 按会话、按日、按月统计                                    │
│     • 按模型提供商分类                                          │
│                                                                 │
│  📊 工具性能                                                    │
│     • 成功率、失败率、平均耗时                                  │
│     • 按工具类型、按部门统计                                    │
│     • 错误原因分布                                              │
│                                                                 │
│  📊 任务指标                                                    │
│     • 任务成功率、平均完成时间                                  │
│     • 循环检测触发次数                                          │
│     • 断点恢复统计                                              │
│                                                                 │
│  📊 使用统计                                                    │
│     • 用户活跃度                                                │
│     • 部门使用趋势                                              │
│     • 用户满意度评分                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 数据模型

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenUsage {
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub model_provider: String,
    pub input_tokens: u64,
    pub output_tokens: u64,
    pub total_tokens: u64,
    pub cost_usd: Option<f64>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCallMetric {
    pub id: String,
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub tool_name: String,
    pub department: String,
    pub status: CallStatus,
    pub duration_ms: u64,
    pub error_message: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskMetric {
    pub id: String,
    pub session_id: String,
    pub user_id: String,
    pub tenant_id: String,
    pub task_type: String,
    pub status: TaskStatus,
    pub total_steps: u32,
    pub completed_steps: u32,
    pub total_duration_ms: u64,
    pub loop_detected: bool,
    pub checkpoint_used: bool,
    pub user_rating: Option<u8>,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}
```

### 存储架构

**本地SQLite存储：**
```sql
CREATE TABLE token_usage (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd REAL,
    created_at INTEGER NOT NULL,
    
    INDEX idx_user_date (user_id, created_at),
    INDEX idx_tenant_date (tenant_id, created_at)
);

CREATE TABLE tool_call_metrics (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    department TEXT,
    status TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    error_message TEXT,
    created_at INTEGER NOT NULL,
    
    INDEX idx_tool_stats (tool_name, status, created_at),
    INDEX idx_user_tools (user_id, created_at)
);

CREATE TABLE task_metrics (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    task_type TEXT,
    status TEXT NOT NULL,
    total_steps INTEGER,
    completed_steps INTEGER,
    total_duration_ms INTEGER,
    loop_detected INTEGER DEFAULT 0,
    checkpoint_used INTEGER DEFAULT 0,
    user_rating INTEGER,
    created_at INTEGER NOT NULL,
    completed_at INTEGER,
    
    INDEX idx_tenant_stats (tenant_id, status, created_at)
);
```

### 统计服务

```rust
pub struct MetricsService {
    db: Arc<Database>,
}

impl MetricsService {
    /// 记录Token使用
    pub async fn record_token_usage(&self, usage: &TokenUsage) -> Result<(), Error> {
        self.db.insert_token_usage(usage).await
    }
    
    /// 获取用户Token统计
    pub async fn get_user_token_stats(&self, user_id: &str, period: TimePeriod) -> Result<TokenStats, Error> {
        self.db.aggregate_token_usage(user_id, period).await
    }
    
    /// 获取租户级统计（管理员可见）
    pub async fn get_tenant_stats(&self, tenant_id: &str, period: TimePeriod) -> Result<TenantStats, Error> {
        let token_stats = self.db.aggregate_tenant_tokens(tenant_id, period).await?;
        let tool_stats = self.db.aggregate_tenant_tool_calls(tenant_id, period).await?;
        let task_stats = self.db.aggregate_tenant_tasks(tenant_id, period).await?;
        
        Ok(TenantStats {
            token: token_stats,
            tools: tool_stats,
            tasks: task_stats,
        })
    }
    
    /// 导出报告
    pub async fn export_report(&self, user_id: &str, format: ReportFormat, period: TimePeriod) -> Result<Vec<u8>, Error> {
        let stats = self.get_user_token_stats(user_id, period).await?;
        
        match format {
            ReportFormat::CSV => self.generate_csv_report(&stats),
            ReportFormat::PDF => self.generate_pdf_report(&stats),
        }
    }
}
```

### 管理员仪表板数据

```rust
#[derive(Debug, Serialize)]
pub struct TenantStats {
    pub token: TokenAggregate,
    pub tools: ToolAggregate,
    pub tasks: TaskAggregate,
}

#[derive(Debug, Serialize)]
pub struct TokenAggregate {
    pub total_input: u64,
    pub total_output: u64,
    pub total_cost: f64,
    pub by_provider: HashMap<String, u64>,
    pub by_department: HashMap<String, u64>,
    pub daily_trend: Vec<DailyCount>,
}

#[derive(Debug, Serialize)]
pub struct ToolAggregate {
    pub total_calls: u64,
    pub success_rate: f64,
    pub avg_duration_ms: f64,
    pub top_tools: Vec<ToolRank>,
    pub error_distribution: HashMap<String, u64>,
}

#[derive(Debug, Serialize)]
pub struct TaskAggregate {
    pub total_tasks: u64,
    pub success_rate: f64,
    pub avg_duration_ms: f64,
    pub loop_detection_count: u64,
    pub checkpoint_recovery_count: u64,
    pub avg_user_rating: Option<f64>,
}
```

## 部门模块系统架构

> **核心定义：** 部门模块 = UI界面 + 业务功能 + AI Agent调用接口（Tools/Skills/MCP）
> 每个部门模块不仅是用户可见的UI功能界面，同时集成了可供AI Agent调用的标准化接口。

### 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    部门模块标准架构                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    AI Agent (平台主Agent)                │  │
│   └─────────────────────────┬───────────────────────────────┘  │
│                             │ 调用                              │
│                             ▼                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              部门模块标准化接口层                         │  │
│   │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │  │
│   │  │ Tools接口   │ │ Skills接口  │ │ MCP接口     │       │  │
│   │  │ (功能调用)  │ │ (技能封装)  │ │ (外部服务)  │       │  │
│   │  └─────────────┘ └─────────────┘ └─────────────┘       │  │
│   └─────────────────────────┬───────────────────────────────┘  │
│                             │                                   │
│              ┌──────────────┼──────────────┐                   │
│              │              │              │                   │
│              ▼              ▼              ▼                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    部门模块实例                          │  │
│   │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │
│   │  │ 人事部  │ │ 销售部  │ │ 财务部  │ │ 仓储部  │ ...    │  │
│   │  │ 模块    │ │ 模块    │ │ 模块    │ │ 模块    │       │  │
│   │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │  │
│   │       │           │           │           │             │  │
│   │       ▼           ▼           ▼           ▼             │  │
│   │  ┌─────────────────────────────────────────────────┐   │  │
│   │  │              部门模块UI界面                      │   │  │
│   │  │  - 功能操作界面                                  │   │  │
│   │  │  - 数据展示界面                                  │   │  │
│   │  │  - 报表/看板界面                                 │   │  │
│   │  └─────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 接口类型定义

| 接口类型 | 用途 | 示例 | 特点 |
|---------|------|------|------|
| **Tools** | 单一功能调用 | 创建订单、查询库存、添加员工 | 原子操作，返回结构化结果 |
| **Skills** | 复杂技能封装 | AI生成报价单、OCR识别合同、生成审批流程 | 多步骤组合，含AI推理 |
| **MCP** | 外部服务接入 | 第三方API、数据库连接、邮件服务 | 外部系统对接 |

### 部门模块清单规范

```yaml
# 部门模块清单示例 (module-manifest.yaml)
module:
  id: sales
  name: 销售部
  version: 1.0.0
  type: core  # core=内置, extension=可安装
  dependencies:
    - hr        # 依赖人事部
    - warehouse # 依赖仓储部

# UI界面定义
ui:
  routes:
    - path: /sales
      component: SalesDashboard
    - path: /sales/orders
      component: OrderList
    - path: /sales/quotes
      component: QuoteEditor
  menu:
    - title: 销售管理
      icon: sales
      children:
        - 报价单管理
        - 订单管理
        - 客户管理

# AI Agent调用接口
tools:
  - name: sales_create_quote
    description: 创建报价单
    parameters:
      customer_id: string
      products: array
    returns: quote_id, quote_url
    sensitive: false
    
  - name: sales_order_create
    description: 创建销售订单
    parameters:
      quote_id: string
    returns: order_id
    sensitive: false

  - name: sales_contract_sign
    description: 签订合同
    parameters:
      contract_id: string
    returns: signed_url
    sensitive: true  # 敏感操作，需确认
    
skills:
  - name: sales_generate_quote_ai
    description: AI生成报价单
    input: customer_requirements (自然语言)
    output: quote_draft
    
mcp:
  - name: sales_external_api
    description: 第三方销售平台接入
    protocol: mcp
    config:
      endpoints: [...]

# 公开工具配置（跨部门协作）
public_tools:
  - sales_order_create      # 允许其他部门调用
  - sales_get_quote         # 允许其他部门查询报价单
```

### 工具调用可见性设计

**设计原则：**
- **透明性**：所有用户都能看到AI调用了哪些工具、怎么调用的
- **可追溯**：调用记录可回溯查看
- **可干预**：用户可手动重试、纠偏、调整

**工具调用面板位置：**
```
┌─────────────────────────────────────────────────────────────┐
│ AI对话区域                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 用户: 帮我创建一个报价单给客户A                          │ │
│ │                                                         │ │
│ │ AI: 好的，我正在为您创建报价单...                        │ │
│ │     [调用工具: sales_create_quote]                       │ │
│ │                                                         │ │
│ │ 🔧 工具调用卡片（对话框内）                              │ │
│ │ ▶ 正在调用: sales_create_quote                          │ │
│ │   类型: Tool                                            │ │
│ │   参数: {customer_id: "A001", products: [...]}          │ │
│ │   状态: ⏳ 执行中...                                     │ │
│ │                                                         │ │
│ │ ✅ 已完成: customer_get_info                            │ │
│ │   耗时: 0.8s                                            │ │
│ │   结果: 客户A - XX科技有限公司                           │ │
│ │   [查看详情]                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ 💬 继续对话...                                               │
└─────────────────────────────────────────────────────────────┘
```

**工具状态显示：**

| 状态 | 图标 | 说明 | 用户操作 |
|-----|------|------|---------|
| 执行中 | ⏳ | 工具正在调用 | 等待/取消 |
| 成功 | ✅ | 调用成功，返回结果 | 查看详情 |
| 失败 | ❌ | 调用失败 | 重试/手动/跳过 |
| 警告 | ⚠️ | 部分成功或有风险 | 查看/确认 |
| 离线 | 🔴 | 服务不可用 | 检查连接/手动 |

### 工具状态监控

```
┌────────────────────────────────────────────────────────────┐
│ 🔌 工具状态面板                                             │
├────────────────────────────────────────────────────────────┤
│ 部门模块        Tools    Skills    MCP     握手状态        │
├────────────────────────────────────────────────────────────┤
│ 人事部          🟢 5个   🟢 2个    —       🟢 正常         │
│ 销售部          🟢 8个   🟡 1个    🟢 1个  🟢 正常         │
│ 财务部          🟢 6个   🟢 3个    —       🟢 正常         │
│ 仓储部          🟡 4个   —         🔴 1个  🟡 部分可用     │
│ 扩展:售后部     🟢 3个   🟢 1个    —       🟢 正常         │
│ 扩展:招投标部   🟢 2个   🟢 1个    —       🟢 正常         │
├────────────────────────────────────────────────────────────┤
│ 🟢 正常  🟡 部分可用  🔴 异常  ⚫ 未安装                    │
│                                                            │
│ [刷新状态] [查看详情] [诊断工具]                            │
└────────────────────────────────────────────────────────────┘
```

## ClawHub生态兼容性架构

> **背景与目标：** 本项目灵感来源于 OpenClaw，旨在为企业提供 AI 赋能的 ERP 系统。在实际部署中发现，OpenClaw 更适合技术用户，而企业需要面向全员（包括非技术人员）的解决方案。

### 核心诉求

- 保持企业级 ERP 系统的定位
- 兼容 ClawHub 丰富的生态资源
- 降低企业用户使用门槛
- 提供企业级安全保障

### 设计目标

| 目标 | 说明 |
|------|------|
| **生态兼容** | 支持 ClawHub 的 Skills、Plugins、SOULs 等资源 |
| **安全增强** | 针对企业场景增强安全审计和权限控制 |
| **平滑迁移** | 支持现有 ClawHub 资源的直接使用或适配转换 |
| **扩展能力** | 支持企业自建私有市场和管理 |
| **用户友好** | 提供图形化界面，降低非技术用户使用门槛 |

### 兼容策略分层模型

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         兼容策略分层模型                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Level 1: 直接兼容                                                      │
│  ├── Skills（SKILL.md格式）→ 通过适配层直接加载                         │
│  └── SOULs（SOUL.md格式）→ 作为Agent人设模板导入                        │
│                                                                         │
│  Level 2: 适配转换                                                      │
│  ├── Plugins（OpenClaw插件）→ 转换为部门模块组件                        │
│  └── Hooks → 转换为企业事件触发器                                       │
│                                                                         │
│  Level 3: 生态集成                                                      │
│  ├── ClawHub市场 → 作为外部资源市场接入                                 │
│  ├── 私有市场 → 企业自建市场，支持ClawHub格式                           │
│  └── 混合市场 → 同时支持内部和外部资源                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 资源类型矩阵

| 资源类型 | 格式 | 用途 | 兼容优先级 | 说明 |
|---------|------|------|-----------|------|
| **Skill** | SKILL.md + 文件 | 定义Agent可执行的技能 | P0 | 直接兼容，通过适配层加载 |
| **Plugin** | TypeScript模块 | 扩展功能 | P1 | 适配转换为部门模块组件 |
| **SOUL** | SOUL.md | 定义Agent人设/个性 | P0 | 作为Agent人设模板导入 |
| **Hook** | TypeScript | 事件触发器 | P2 | 转换为企业事件处理器 |

### 兼容性架构设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI-Automated-office 兼容架构                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    部门模块层 (Department Modules)                │   │
│  │  人事部 │ 销售部 │ 财务部 │ 仓储部 │ 审批中心 │ ...             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                    │
│                                    │ 工具调用                           │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │                    统一工具层 (Unified Tool Layer)               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │   │
│  │  │ 内置工具    │ │ 适配工具    │ │ MCP工具     │              │   │
│  │  │ (Native)   │ │ (Adapted)  │ │ (External) │              │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                    │
│                                    │                                    │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │                    兼容适配层 (Compatibility Layer)              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │   │
│  │  │ Skill适配器│ │ Plugin适配器│ │ SOUL适配器 │              │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘              │   │
│  │  ┌─────────────┐ ┌─────────────┐                              │   │
│  │  │ Hook适配器 │ │ 安全审计器 │                              │   │
│  │  └─────────────┘ └─────────────┘                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    ▲                                    │
│                                    │ 资源加载                           │
│  ┌─────────────────────────────────┴───────────────────────────────┐   │
│  │                    资源管理层 (Resource Management)              │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │   │
│  │  │ 本地资源库 │ │ 私有市场   │ │ ClawHub市场 │              │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Skill适配层设计

Skill 是 ClawHub 生态中最核心的资源类型，采用 SKILL.md 格式定义 Agent 可执行的技能。

**Skill 解析流程：**
1. 解析 YAML frontmatter 获取元数据
2. 提取 Description、Triggers、Tools、Examples 等章节
3. 转换为内部工具格式
4. 注册到统一工具层

**Skill 工具映射：**
- Skill 中的 Tools → 内部工具 (InternalTool)
- Skill 中的 Triggers → 触发器规则 (InternalTrigger)
- Skill 执行代理 → SkillExecutor

### Plugin适配层设计

OpenClaw 插件是 TypeScript 模块，需要适配转换为部门模块组件。

**Plugin 组件映射：**

| OpenClaw Plugin Type | AI-Automated-office Component |
|---------------------|------------------------------|
| Agent Tool | 部门工具 (Department Tool) |
| Channel Plugin | 消息通道适配器 |
| Provider Plugin | LLM提供商适配器 |
| CLI Command | 桌面端命令/菜单项 |
| Background Service | 后台任务服务 |
| Hook | 事件处理器 |
| HTTP Route | API端点 |

**安全隔离：**
- Plugin 在沙箱环境中执行
- 文件系统访问需白名单授权
- 网络访问需白名单授权
- 执行超时和内存限制

### SOUL适配层设计

SOUL.md 用于定义 Agent 的人设（Persona），可直接作为 Agent 人设模板导入。

**SOUL 内容映射：**
- Identity → 系统提示词身份部分
- Personality → 系统提示词性格部分
- Expertise → 系统提示词专业领域
- Communication Style → 系统提示词沟通风格
- Boundaries → 系统提示词边界约束

### 安全机制设计

**资源安全验证流程：**
1. **来源验证** - 检查来源是否可信（ClawHub官方/私有市场/本地）
2. **签名验证** - 验证资源签名（如果有）
3. **静态分析** - 检测敏感API调用、可疑模式
4. **沙箱测试** - 在隔离环境中运行测试
5. **审计记录** - 记录资源加载和执行日志

**企业级安全增强：**
- 资源加载前强制安全扫描
- 敏感操作需管理员审批
- 执行日志完整记录
- 支持资源黑白名单

### 市场集成设计

**三层市场架构：**

| 层级 | 说明 | 特点 |
|-----|------|------|
| **本地资源库** | 本地导入的Skill/Plugin/SOUL | 完全离线可用 |
| **私有市场** | 企业自建市场 | 支持ClawHub格式，租户隔离 |
| **ClawHub市场** | ClawHub官方市场 | 外部资源市场接入 |

**资源安装流程：**
1. 用户从市场浏览/搜索资源
2. 系统进行安全验证
3. 适配层转换资源格式
4. 安装到本地资源库
5. 注册到统一工具层

### ClawHub兼容性功能需求（FR700系列）

**Skill兼容（FR700-710）**

| 编号 | 需求 | 说明 |
|-----|------|------|
| FR700 | 系统可以解析SKILL.md格式的技能文件 | Skill解析 |
| FR701 | 系统可以将Skill中的Tools转换为内部工具 | 工具转换 |
| FR702 | 系统可以将Skill中的Triggers转换为触发器规则 | 触发器转换 |
| FR703 | 用户可以从本地导入Skill文件 | 本地导入 |
| FR704 | 用户可以从私有市场安装Skill | 私有市场 |
| FR705 | 用户可以从ClawHub市场安装Skill | 官方市场 |
| FR706 | Skill执行时自动记录审计日志 | 审计日志 |
| FR707 | Skill执行支持超时和重试机制 | 执行控制 |
| FR708 | 用户可以查看已安装Skill的状态和版本 | 状态监控 |
| FR709 | 用户可以卸载已安装的Skill | 卸载管理 |
| FR710 | 系统支持Skill版本更新检查和升级 | 版本管理 |

**Plugin兼容（FR711-720）**

| 编号 | 需求 | 说明 |
|-----|------|------|
| FR711 | 系统可以解析OpenClaw Plugin模块 | Plugin解析 |
| FR712 | 系统可以将Plugin工具转换为部门模块组件 | 组件转换 |
| FR713 | Plugin在沙箱环境中执行，限制文件系统和网络访问 | 安全隔离 |
| FR714 | 管理员可以配置Plugin的访问白名单 | 白名单配置 |
| FR715 | Plugin执行超时自动终止 | 超时控制 |
| FR716 | 用户可以查看Plugin执行日志 | 日志查看 |
| FR717 | 用户可以启用/禁用已安装的Plugin | 启用禁用 |
| FR718 | Plugin加载前进行安全扫描 | 安全扫描 |
| FR719 | Plugin调用需要用户确认（可配置） | 调用确认 |
| FR720 | 系统支持Plugin依赖管理 | 依赖管理 |

**SOUL兼容（FR721-728）**

| 编号 | 需求 | 说明 |
|-----|------|------|
| FR721 | 系统可以解析SOUL.md格式的人设文件 | SOUL解析 |
| FR722 | 系统可以将SOUL转换为Agent人设模板 | 人设转换 |
| FR723 | 用户可以从市场安装SOUL模板 | 市场安装 |
| FR724 | 用户可以选择SOUL模板作为Agent人设 | 人设选择 |
| FR725 | 用户可以自定义修改已安装的SOUL | 自定义修改 |
| FR726 | SOUL模板支持多语言 | 多语言支持 |
| FR727 | 用户可以创建和分享自己的SOUL模板 | 模板分享 |
| FR728 | 系统预置常用SOUL模板 | 预置模板 |

#### SOUL/Skill/Heartbeat/Cron 实施基线（并入铁律）

> 依据 `_bmad-output/soul` 研究文档，以下为可执行架构约束：

1. SOUL（人格模板）：
- 作为 Agent Persona 模板导入，支持多源加载与优先级覆盖。
- 默认只读，不允许自动静默改写；修改必须经用户确认并写入版本审计。
- 注入时遵循系统指令优先级，不得覆盖安全、权限、合规硬规则。

2. Skill 渐进式加载：
- 保持按需加载策略：基础规则默认加载，任务与引用资源动态加载。
- 必须实施数量限制、字符预算、超预算降级（compact）机制。
- 加载来源可追踪（Direct/Adapt/Reserve），便于治理与回溯。

3. Heartbeat 主动机制：
- 采用五层预检查：启用状态、活跃时段、队列占用、触发原因、清单门控。
- 无事项时返回 `HEARTBEAT_OK` 并静默处理，避免无意义通知。
- 默认低频或按业务白名单触发，优先用于审批超时、阻塞、异常恢复提示。

4. Cron 调度机制：
- 支持 `cron/every/once/at` 四类调度表达。
- 任务执行必须隔离上下文，具备超时、重试、幂等和失败回退能力。
- 所有调度执行及投递结果必须进入统一审计链路。

5. 技术落地边界：
- 仅采纳机制思想，不照搬 OpenClaw Node/TS 代码路径与 CLI 命令。
- 本项目主路径继续遵循 `Tauri + Rust + React` 技术栈与安全边界。

**市场集成（FR730-745）**

| 编号 | 需求 | 说明 |
|-----|------|------|
| FR730 | 用户可以浏览ClawHub官方市场的资源 | 官方市场浏览 |
| FR731 | 用户可以在市场搜索资源（按名称/标签/类型） | 资源搜索 |
| FR732 | 用户可以查看资源的详情、评分、评论 | 资源详情 |
| FR733 | 管理员可以配置企业私有市场 | 私有市场配置 |
| FR734 | 私有市场支持ClawHub格式资源 | 格式兼容 |
| FR735 | 私有市场资源与官方市场资源隔离存储 | 数据隔离 |
| FR736 | 管理员可以审核私有市场资源 | 资源审核 |
| FR737 | 用户可以上传资源到私有市场 | 资源上传 |
| FR738 | 系统支持资源的自动更新检查 | 自动更新 |
| FR739 | 用户可以配置资源更新策略（自动/手动） | 更新策略 |
| FR740 | 管理员可以设置市场访问权限 | 访问权限 |
| FR741 | 系统记录资源安装、更新、卸载日志 | 操作日志 |
| FR742 | 用户可以对已安装资源进行评分和评论 | 评分评论 |
| FR743 | 系统支持资源依赖自动解析和安装 | 依赖安装 |
| FR744 | 离线状态下仍可使用已安装的资源 | 离线支持 |
| FR745 | 管理员可以配置资源安全扫描策略 | 安全策略 |

**安全与审计（FR746-755）**

| 编号 | 需求 | 说明 |
|-----|------|------|
| FR746 | 资源加载前进行来源验证 | 来源验证 |
| FR747 | 资源签名验证（如有） | 签名验证 |
| FR748 | 资源静态分析检测可疑代码 | 静态分析 |
| FR749 | Plugin执行时限制系统调用权限 | 权限限制 |
| FR750 | 敏感资源安装需管理员审批 | 安装审批 |
| FR751 | 所有资源执行记录审计日志 | 执行审计 |
| FR752 | 审计日志保留180天 | 日志保留 |
| FR753 | 管理员可以配置资源黑白名单 | 黑白名单 |
| FR754 | 异常资源执行自动告警 | 异常告警 |
| FR755 | 支持资源一键回滚到安全版本 | 版本回滚 |

## 三层记忆层架构

> **架构说明：** 记忆层采用三层架构设计，分别服务于不同范围的数据存储和检索需求。

### 记忆融合实施基线（并入铁律）

> 依据 `docs/memory-fusion-pdf-draft.md` 与 `docs/memory-fusion-architecture-draft.md`，以下内容作为记忆层实施约束：

1. 业务分层不变：继续遵循 PRD 三层记忆模型（L1 个人 / L2 企业知识库 / L3 图记忆 Post-MVP）。
2. 技术实现允许四层拆分：Raw / Vector / Summary / Cognitive 仅用于实现分解，不改变权限边界。
3. 生命周期摄入标准化：MVP 必须实现 `SessionStart`、`UserPromptSubmit`、`PostToolUse`、`Stop`、`SessionEnd` 五类 Hook。
4. 技术主路径：记忆核心能力在 Rust 侧实现，MVP 默认 `SQLite + FTS5 + sqlite-vec`，LanceDB 为 Post-MVP 可选扩展。
5. 工具命名与权限：记忆工具需遵循 `ADR-017` 命名规范和 `ADR-018/019` 权限与确认链路。
6. 多租户与隔离：所有记忆读写必须带 `tenant_id + plugin_id + session_key + user_id` 约束，个人记忆仅本人可见。

### 分层设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                       记忆层分层架构                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              L3: 图记忆层 (Graph Memory)                      │   │
│  │              实体关系图谱、知识推理                            │   │
│  │              范围：租户级别（Post-MVP）                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│                              │ 实体关联                              │
│  ┌───────────────────────────┴─────────────────────────────────┐   │
│  │              L2: 企业知识库层 (RAG)                           │   │
│  │              高质量知识存储、混合检索                          │   │
│  │              范围：租户级别，全员可访问                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ▲                                      │
│                              │ 知识引用                              │
│  ┌───────────────────────────┴─────────────────────────────────┐   │
│  │              L1: 个人记忆层 (Personal Memory)                 │   │
│  │              会话记忆、用户偏好、错题集                        │   │
│  │              范围：用户级别，仅本人可访问                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 层级职责对比

| 层级 | 名称 | 数据归属 | 访问范围 | 存储内容 | 优先级 |
|------|------|---------|---------|---------|--------|
| **L1** | 个人记忆层 | 用户 | 仅本人 | 会话历史、偏好、错题集 | P0 |
| **L2** | 企业知识库 | 租户 | 租户全员 | 文档、FAQ、流程规范 | P0 |
| **L3** | 图记忆层 | 租户 | 租户全员 | 实体关系、知识图谱 | P2 |

### L1 个人记忆层

#### 数据结构

```rust
pub struct PersonalMemory {
    pub user_id: String,
    pub tenant_id: String,
    
    // 会话记忆
    pub session_memories: Vec<SessionMemory>,
    
    // 用户偏好
    pub preferences: Vec<UserPreference>,
    
    // 错题集
    pub corrections: Vec<CorrectionRecord>,
}

pub struct SessionMemory {
    pub session_id: String,
    pub messages: Vec<Message>,
    pub context_summary: Option<String>,
    pub created_at: i64,
    pub expires_at: Option<i64>,
}

pub struct UserPreference {
    pub key: String,
    pub value: String,
    pub category: String,  // quote, contract, approval, etc.
    pub created_at: i64,
}

pub struct CorrectionRecord {
    pub id: String,
    pub scenario: String,
    pub error_description: String,
    pub correction: String,
    pub rule_extracted: String,
    pub applied_count: i32,
    pub created_at: i64,
}
```

#### 记忆智能更新

```
┌─────────────────────────────────────────────────────────────────┐
│                    记忆智能更新机制                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  用户对话 ──→ LLM分析 ──→ 决策操作类型                          │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              │               │               │                 │
│              ▼               ▼               ▼                 │
│           ADD           UPDATE          DELETE                 │
│        新增记忆        更新已有        删除过期                 │
│              │               │               │                 │
│              └───────────────┼───────────────┘                 │
│                              │                                  │
│                              ▼                                  │
│                       持久化存储                                │
│                     (SQLite + 向量DB)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### L2 企业知识库层

#### 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                    企业知识库架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  文档上传 ──→ 文档解析 ──→ 智能分段 ──→ 向量嵌入                │
│                                    │                            │
│                                    ▼                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              向量数据库 (Qdrant)                         │   │
│  │  Collection: knowledge_{tenant_id}                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                    │                            │
│                                    ▼                            │
│  用户查询 ──→ 混合检索 ──→ RRF融合 ──→ 返回结果                │
│               │                                                   │
│               ├── 向量语义检索                                   │
│               └── BM25关键词检索                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 混合检索实现

```rust
pub struct HybridSearchEngine {
    vector_store: QdrantClient,
    bm25_index: BM25Index,
    vector_weight: f32,  // 默认 0.6
    bm25_weight: f32,    // 默认 0.4
}

impl HybridSearchEngine {
    pub async fn search(&self, query: &str, top_k: usize) -> Vec<SearchResult> {
        // 1. 向量检索
        let vector_results = self.vector_search(query, top_k * 2).await;
        
        // 2. BM25检索
        let bm25_results = self.bm25_search(query, top_k * 2);
        
        // 3. RRF融合
        self.reciprocal_rank_fusion(vector_results, bm25_results, top_k)
    }
    
    fn reciprocal_rank_fusion(
        &self,
        vector_results: Vec<SearchResult>,
        bm25_results: Vec<SearchResult>,
        k: usize,
    ) -> Vec<SearchResult> {
        let mut scores: HashMap<String, f32> = HashMap::new();
        let constant = 60.0;  // RRF常数
        
        // 向量结果打分
        for (rank, result) in vector_results.iter().enumerate() {
            let score = 1.0 / (constant + rank as f32 + 1.0);
            *scores.entry(result.id.clone()).or_insert(0.0) += score * self.vector_weight;
        }
        
        // BM25结果打分
        for (rank, result) in bm25_results.iter().enumerate() {
            let score = 1.0 / (constant + rank as f32 + 1.0);
            *scores.entry(result.id.clone()).or_insert(0.0) += score * self.bm25_weight;
        }
        
        // 排序返回Top-K
        let mut results: Vec<_> = scores.into_iter().collect();
        results.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        results.truncate(k);
        
        results.into_iter().map(|(id, score)| {
            SearchResult { id, score, .. }
        }).collect()
    }
}
```

### 存储架构

```
{app_data}/
├── tenants/
│   └── {tenant_id}/
│       ├── personal_memory/
│       │   ├── qdrant/           # Qdrant本地向量存储
│       │   │   └── collections/
│       │   │       ├── sessions/   # 会话记忆
│       │   │       ├── preferences/# 用户偏好
│       │   │       └── corrections/# 错题集
│       │   └── memory.db         # SQLite历史记录
│       │
│       ├── knowledge/            # 企业知识库
│       │   ├── qdrant/
│       │   └── knowledge.db
│       │
│       └── graph/                # 图记忆(Post-MVP)
│           └── neo4j/
```

## 错题集架构

> **设计理念：** 当用户修改AI输出时，系统检测差异并提示用户确认是否记录规则。AI从用户解释中提取结构化规则，存储到错题集，后续自动应用。

### 工作流程

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    错题集记录与应用流程                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Phase 1: 检测纠偏                                                      │
│  AI生成输出 ──→ 用户修改 ──→ 检测差异 ──→ 弹出确认对话框              │
│                                              [确认] [取消]              │
│                                                                         │
│  Phase 2: 提取规则                                                      │
│  用户对话解释 ──→ LLM提取结构化规则 ──→ 生成CorrectionRecord           │
│                                                                         │
│  Phase 3: 存储规则                                                      │
│  CorrectionRecord ──→ 向量数据库 ──→ SQLite持久化                      │
│                                                                         │
│  Phase 4: 应用规则                                                      │
│  新请求 ──→ 向量搜索相关规则 ──→ 注入SystemPrompt ──→ AI生成正确结果   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 数据模型

```rust
pub struct CorrectionRecord {
    pub id: String,
    pub user_id: String,
    pub tenant_id: String,
    
    // 场景信息
    pub scenario: String,           // 场景标识（如 quote_amount_calculation）
    pub scenario_display: String,   // 场景显示名（如 报价单金额计算）
    
    // 错误与纠正
    pub error_description: String,  // 错误描述
    pub correction: String,         // 纠正规则
    pub rule_extracted: String,     // LLM提取的结构化规则
    
    // 原始上下文
    pub original_context: String,   // 原始对话上下文
    pub original_output: String,    // AI原始输出
    pub corrected_output: String,   // 用户纠正后的输出
    
    // 效果追踪
    pub applied_count: i32,         // 应用次数
    pub effectiveness_score: f32,   // 效果评分
    
    pub created_at: i64,
    pub updated_at: i64,
}
```

### 规则应用机制

```rust
impl CorrectionManager {
    pub async fn get_applicable_rules(
        &self,
        context: &str,
        scenario: &str,
    ) -> Vec<CorrectionRecord> {
        // 1. 向量搜索相似场景的规则
        let similar_rules = self.vector_search(context, scenario, 5).await;
        
        // 2. 按效果评分排序
        let mut rules = similar_rules;
        rules.sort_by(|a, b| b.effectiveness_score.partial_cmp(&a.effectiveness_score).unwrap());
        
        rules
    }
    
    pub fn inject_rules_to_prompt(
        &self,
        system_prompt: &mut String,
        rules: &[CorrectionRecord],
    ) {
        if rules.is_empty() {
            return;
        }
        
        let rules_text = rules.iter()
            .map(|r| format!("- {}: {}", r.scenario_display, r.rule_extracted))
            .collect::<Vec<_>>()
            .join("\n");
        
        system_prompt.push_str(&format!(r#"

## 用户偏好规则（请严格遵守）

{}
"#, rules_text));
    }
}
```

### 右键菜单交互

```
┌─────────────────────────────────────────────────────────────┐
│ 报价单金额：¥125,000.00  ← [选中此文本]                      │
│                        ┌──────────────┐                      │
│                        │ 📝 编辑      │                      │
│                        │ 💬 与AI对话  │ ← 右键菜单           │
│                        │ 🔄 重新生成  │                      │
│                        │ 📌 添加到偏好│                      │
│                        │ ❌ 标记为错误│                      │
│                        └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## 跨部门协作架构

> **设计原则：** 每个部门的Agent只能调用本部门的内部工具，但可以调用其他部门暴露的公开工具。协作支持用户手动触发和Agent自动编排两种模式。

### 协作架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    跨部门协作架构                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              主 Agent (用户会话)                         │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              协作编排器 (Orchestrator)                   │   │
│  │  • 分析跨部门依赖                                       │   │
│  │  • 生成执行计划                                         │   │
│  │  • 协调多部门Agent                                      │   │
│  │  • 汇总执行结果                                         │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐                │
│         │                  │                  │                │
│         ▼                  ▼                  ▼                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │  销售Agent  │    │  仓储Agent  │    │  财务Agent  │        │
│  │             │    │             │    │             │        │
│  │ 内部工具    │    │ 内部工具    │    │ 内部工具    │        │
│  │ warehouse_* │    │ sales_*     │    │ sales_*     │        │
│  │ (公开工具)  │    │ (公开工具)  │    │ (公开工具)  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 协作流程

```
用户请求: "帮我处理这个销售订单，完成发货并记账"
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 1: 意图分析                                             │
│ 识别涉及部门：销售部、仓储部、财务部                         │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: 依赖分析                                             │
│ 销售订单 → 仓储发货 → 财务记账                               │
│ (顺序依赖)                                                   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 生成执行计划                                         │
│                                                             │
│ 步骤1 [销售部] 创建订单                                      │
│        工具: sales_order_create                             │
│        参数: {customer: "客户A", products: [...]}           │
│                                                             │
│ 步骤2 [仓储部] 确认库存并发货                                 │
│        工具: warehouse_ship (公开工具)                       │
│        参数: {order_id: "待生成", address: "..."}            │
│                                                             │
│ 步骤3 [财务部] 生成应收账款                                   │
│        工具: finance_receivable_add (公开工具)               │
│        参数: {order_id: "待生成", amount: "..."}             │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 用户确认                                             │
│ 弹出确认卡片，用户可修改计划                                  │
│ [确认执行] [修改计划] [取消]                                  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: 执行并汇总结果                                       │
│ 依次调用各部门Agent，返回执行结果                             │
└─────────────────────────────────────────────────────────────┘
```

### 公开工具配置

```yaml
# 销售部公开工具配置
public_tools:
  - name: sales_order_create
    description: 创建销售订单
    allowed_callers:
      - warehouse  # 仓储部可调用
      - finance    # 财务部可调用
      
  - name: sales_get_quote
    description: 获取报价单信息
    allowed_callers:
      - finance    # 财务部可调用（用于记账）
      
  - name: sales_get_contract
    description: 获取合同信息
    allowed_callers:
      - finance    # 财务部可调用
```

### Rust实现结构

```rust
pub struct CollaborationOrchestrator {
    agent_registry: AgentRegistry,
    tool_registry: ToolRegistry,
}

impl CollaborationOrchestrator {
    pub async fn analyze_and_plan(
        &self,
        request: &str,
        context: &SessionContext,
    ) -> Result<CollaborationPlan, Error> {
        // 1. 分析涉及的部门
        let departments = self.analyze_departments(request, context).await?;
        
        // 2. 分析依赖关系
        let dependencies = self.analyze_dependencies(&departments).await?;
        
        // 3. 生成执行计划
        let plan = self.generate_plan(&departments, &dependencies)?;
        
        Ok(plan)
    }
    
    pub async fn execute_plan(
        &self,
        plan: &CollaborationPlan,
        context: &SessionContext,
    ) -> Result<Vec<StepResult>, Error> {
        let mut results = Vec::new();
        
        for step in &plan.steps {
            // 检查权限
            self.check_permission(&step, context)?;
            
            // 调用对应部门Agent
            let result = self.call_department_agent(&step, context).await?;
            results.push(result);
        }
        
        Ok(results)
    }
}

pub struct CollaborationPlan {
    pub steps: Vec<CollaborationStep>,
    pub estimated_time: Duration,
}

pub struct CollaborationStep {
    pub department: String,
    pub tool: String,
    pub parameters: Value,
    pub dependencies: Vec<usize>,  // 依赖的步骤索引
}
```

## 统一消息系统架构

> **设计理念：** 将**人**和**Agent**都作为消息参与者（Participant），统一处理消息交互。支持人与人、Agent与Agent、人与Agent三种通信场景，实现企业内部全流程协作。

### 参与者模型设计

**参与者ID格式：**
```
human:{userId}       // 人类员工
agent:{ownerUserId}  // AI助手（归属于某员工）
system:{serviceName} // 系统服务
group:{groupId}      // 群组
```

**Rust数据结构：**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ParticipantType {
    Human,
    Agent,
    System,
    Group,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Participant {
    pub id: String,
    pub participant_type: ParticipantType,
    pub display_name: String,
    pub avatar_url: Option<String>,
    pub department: Option<String>,
    pub owner_user_id: Option<String>,  // Agent归属员工
    pub online_status: OnlineStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum OnlineStatus {
    Online,
    Offline,
    Busy,
    Away,
}

impl Participant {
    pub fn parse_id(id: &str) -> Result<(ParticipantType, String), Error> {
        let parts: Vec<&str> = id.splitn(2, ':').collect();
        if parts.len() != 2 {
            return Err(Error::InvalidParticipantId);
        }
        
        let ptype = match parts[0] {
            "human" => ParticipantType::Human,
            "agent" => ParticipantType::Agent,
            "system" => ParticipantType::System,
            "group" => ParticipantType::Group,
            _ => return Err(Error::InvalidParticipantId),
        };
        
        Ok((ptype, parts[1].to_string()))
    }
}
```

### 消息类型定义

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MessageContent {
    Text { content: String },
    Voice { 
        audio_url: String, 
        duration_seconds: u32,
        transcript: Option<String>,  // 自动转文字
    },
    Image { 
        url: String, 
        thumbnail_url: Option<String>,
        width: Option<u32>,
        height: Option<u32>,
    },
    File { 
        url: String, 
        filename: String,
        size_bytes: u64,
        mime_type: String,
    },
    WorkCard { card: WorkCard },
    SystemNotification { 
        title: String,
        body: String,
        action_url: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkCard {
    pub card_type: WorkCardType,
    pub title: String,
    pub description: String,
    pub status: Option<String>,
    pub actions: Vec<CardAction>,
    pub metadata: HashMap<String, Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WorkCardType {
    Task,
    Approval,
    Report,
    Order,
    Notification,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CardAction {
    pub label: String,
    pub action: String,
    pub style: Option<ActionStyle>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ActionStyle {
    Primary,
    Secondary,
    Danger,
}
```

### 消息流转架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         统一消息系统架构                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        消息路由层                                 │   │
│   │  • 参与者解析（human/agent/system/group）                        │   │
│   │  • 权限校验（谁可以给谁发消息）                                   │   │
│   │  • 消息类型处理                                                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        消息存储层                                 │   │
│   │  • 本地SQLite（消息记录、会话列表）                               │   │
│   │  • 云端同步（实时推送、离线存储）                                 │   │
│   │  • 消息索引（全文检索、时间排序）                                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                        消息推送层                                 │   │
│   │  • WebSocket实时推送                                             │   │
│   │  • 桌面通知（系统托盘）                                           │   │
│   │  • 离线推送（上线后同步）                                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 三种通信场景

| 场景 | 参与者 | 路由规则 | 消息示例 |
|------|--------|---------|---------|
| **人↔人** | human:A → human:B | 直接投递 | "这个报价单帮我看看" |
| **Agent↔Agent** | agent:A → agent:B | 需双方员工确认 | "订单XXX需要发货" |
| **人↔Agent** | human:A → agent:B | 间接沟通 | "帮我问一下仓储部库存" |

**Agent消息发送流程：**
```
Agent生成消息
     │
     ├─► 检查敏感度（是否需要员工确认）
     │        │
     │        ├─► 敏感消息 → 弹出确认卡片
     │        │                 │
     │        │                 ├─► 确认 → 发送
     │        │                 └─► 取消 → 不发送
     │        │
     │        └─► 普通消息 → 直接发送
     │
     └─► 发送消息（带Agent标识）
              │
              └─► 记录发送日志（员工可见）
```

### 群聊协作架构

**核心设计：**
- 员工入群 → Agent自动跟随入群（员工可设置关闭）
- Agent角色 → 静默监听 + 选择性补充发言
- Agent不主导对话，只在需要时补充信息

**Agent发言触发场景：**
| 场景 | 触发条件 | Agent行为 |
|------|---------|----------|
| 被@提及 | `@Agent` 或 `@员工` | 代为回答问题 |
| 工作提醒 | 相关任务状态变化 | "订单已发货，物流单号XXX" |
| 数据补充 | 员工发言涉及数据 | 自动附上数据卡片 |
| 进度汇报 | 员工让Agent汇报 | 输出结构化进度报告 |
| 协作接力 | 上游任务完成 | 通知下游相关人员 |

**Rust实现：**
```rust
pub struct GroupChatManager {
    db: Arc<Database>,
    message_router: Arc<MessageRouter>,
}

impl GroupChatManager {
    /// 员工入群，Agent自动跟随
    pub async fn add_member(&self, group_id: &str, user_id: &str) -> Result<(), Error> {
        // 1. 添加员工到群组
        self.db.add_group_member(group_id, user_id, MemberRole::Member).await?;
        
        // 2. 检查员工是否允许Agent自动跟随
        let user_settings = self.db.get_user_message_settings(user_id).await?;
        if user_settings.agent_auto_follow_group {
            // 3. Agent跟随入群
            let agent_id = format!("agent:{}", user_id);
            self.db.add_group_member(group_id, &agent_id, MemberRole::Agent).await?;
        }
        
        Ok(())
    }
    
    /// 处理群消息
    pub async fn handle_group_message(&self, msg: &Message) -> Result<(), Error> {
        // 1. 存储消息
        self.db.save_message(msg).await?;
        
        // 2. 通知所有群成员
        for member in self.db.get_group_members(&msg.group_id).await? {
            if member.member_type == MemberType::Agent {
                // 3. 检查Agent是否需要发言
                self.check_agent_response(&member.id, msg).await?;
            }
        }
        
        Ok(())
    }
    
    /// 检查Agent是否需要响应
    async fn check_agent_response(&self, agent_id: &str, msg: &Message) -> Result<(), Error> {
        let owner_id = Participant::parse_id(agent_id)?.1;
        
        // 检查触发条件
        let should_respond = self.check_trigger_conditions(agent_id, msg).await?;
        
        if should_respond {
            // 生成Agent响应
            let response = self.generate_agent_response(agent_id, msg).await?;
            self.send_group_message(&msg.group_id, &response).await?;
        }
        
        Ok(())
    }
}
```

### 员工通讯录设计

**数据结构：**
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmployeeContact {
    pub user_id: String,
    pub name: String,
    pub department: String,
    pub position: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub employee_id: String,
    pub work_location: Option<String>,
    pub avatar_url: Option<String>,
    pub online_status: OnlineStatus,
    pub visibility_settings: ContactVisibility,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactVisibility {
    pub phone_visible_to: VisibilityScope,
    pub email_visible_to: VisibilityScope,
    pub work_location_visible_to: VisibilityScope,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VisibilityScope {
    Everyone,
    Department,
    Managers,
    Self,
}
```

**通讯录服务：**
```rust
pub struct ContactService {
    db: Arc<Database>,
}

impl ContactService {
    /// 获取组织架构树
    pub async fn get_organization_tree(&self, tenant_id: &str) -> Result<OrgTree, Error> {
        // 返回按部门分层的员工列表
    }
    
    /// 搜索员工
    pub async fn search_employees(&self, query: &str, filters: ContactFilters) -> Result<Vec<EmployeeContact>, Error> {
        // 支持姓名/部门/职位/工号搜索
    }
    
    /// 获取员工名片（应用可见性设置）
    pub async fn get_employee_card(&self, viewer_id: &str, target_id: &str) -> Result<EmployeeCard, Error> {
        let contact = self.db.get_employee_contact(target_id).await?;
        let visibility = &contact.visibility_settings;
        
        // 根据可见性设置过滤敏感字段
        Ok(EmployeeCard {
            user_id: contact.user_id.clone(),
            name: contact.name.clone(),
            department: contact.department.clone(),
            position: contact.position.clone(),
            phone: self.apply_visibility(&contact.phone, &visibility.phone_visible_to, viewer_id, target_id),
            email: self.apply_visibility(&contact.email, &visibility.email_visible_to, viewer_id, target_id),
            // ...
        })
    }
    
    /// 快捷操作
    pub async fn quick_action(&self, action: QuickAction, target_id: &str) -> Result<(), Error> {
        match action {
            QuickAction::SendMessage => { /* 打开私聊 */ },
            QuickAction::TalkToAgent => { /* 与Agent对话 */ },
            QuickAction::InviteToGroup { group_id } => { /* 邀请入群 */ },
        }
        Ok(())
    }
}
```

### 消息存储架构

```
{app_data}/
├── tenants/
│   └── {tenant_id}/
│       ├── messages/
│       │   ├── messages.db      # SQLite消息记录
│       │   ├── conversations/   # 会话列表
│       │   └── attachments/     # 附件缓存
│       └── contacts/
│           └── contacts.db      # 通讯录缓存
```

**消息表设计：**
```sql
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_type TEXT NOT NULL,  -- human/agent/system
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,       -- JSON
    status TEXT DEFAULT 'sent',  -- sent/delivered/read
    created_at INTEGER NOT NULL,
    updated_at INTEGER,
    deleted_at INTEGER,
    
    INDEX idx_conversation (conversation_id, created_at DESC),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id)
);

CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,          -- private/group
    participants TEXT NOT NULL,  -- JSON array
    last_message_id TEXT,
    unread_count INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL
);
```

### WebSocket实时推送

```rust
pub struct MessageWebSocket {
    connections: Arc<RwLock<HashMap<String, WebSocketConnection>>>,
    message_queue: Arc<MessageQueue>,
}

impl MessageWebSocket {
    /// 推送消息给指定参与者
    pub async fn push_message(&self, participant_id: &str, msg: &Message) -> Result<(), Error> {
        if let Some(conn) = self.connections.read().await.get(participant_id) {
            conn.send(msg).await?;
        } else {
            // 离线存储，上线后推送
            self.message_queue.enqueue(participant_id, msg).await?;
        }
        Ok(())
    }
    
    /// 用户上线，推送离线消息
    pub async fn on_user_online(&self, user_id: &str) -> Result<(), Error> {
        let messages = self.message_queue.dequeue_all(user_id).await?;
        for msg in messages {
            self.push_message(user_id, &msg).await?;
        }
        Ok(())
    }
}
```

### 消息权限控制

| 权限项 | 说明 | 实现位置 |
|-------|------|---------|
| 谁可以给Agent发消息 | 白名单机制 | MessageRouter.check_permission |
| Agent可以给谁发消息 | 所属员工确认 | AgentMessageService.confirm_and_send |
| 群组可见性 | 公开/私密群组 | GroupChatManager.check_access |
| 通讯录字段可见性 | 按角色/部门控制 | ContactService.get_employee_card |

## Starter Template Evaluation

### Primary Technology Domain

基于PRD需求分析，项目属于 **AI赋能的ERP系统** 类型。

**核心定位：**
- 桌面端应用（Tauri + Rust）
- AI Agent框架（自研，参考OpenClaw）
- 部门化架构（核心部门内置 + 扩展部门可安装）
- 企业级ERP能力（跨部门数据联动、统一数据中台）

### Technology Stack Decisions

| 领域 | 选择 | 版本 | 理由 |
|------|------|------|------|
| **桌面框架** | Tauri | 2.x | PRD已确定，轻量、安全、跨平台 |
| **后端语言** | Rust | latest | Tauri原生支持，高性能 |
| **前端框架** | React | 19.x | 生态最大、shadcn/ui完美支持、TypeScript友好 |
| **类型系统** | TypeScript | 5.x | 类型安全、开发体验好 |
| **UI样式** | Tailwind CSS | 4.x | 原子化CSS、快速开发 |
| **组件库** | shadcn/ui | latest | 可定制、复制粘贴模式、无运行时依赖 |
| **状态管理** | Zustand | latest | 轻量、简单、TypeScript友好 |
| **服务端状态** | TanStack Query | 5.x | 缓存、同步、后台更新 |
| **本地存储** | SQLite | via Tauri plugin | 本地优先策略、Tauri原生支持 |
| **Agent框架** | 自研 | - | 参考OpenClaw模式，完全可控 |
| **构建工具** | Vite | 6.x | 快速、HMR好、Tauri官方支持 |
| **测试框架** | Vitest + Playwright | latest | 单元测试 + E2E测试 |
| **包管理器** | pnpm | latest | 快速、磁盘效率高 |

### Initialization Commands

**推荐方式：官方模板 + 手动增强**

```bash
# 1. 创建基础项目
npm create tauri-app@latest ai-automated-office
# 选择: TypeScript/JavaScript → pnpm → React → TypeScript

cd ai-automated-office

# 2. 安装额外依赖
pnpm add zustand @tanstack/react-query

# 3. 初始化 shadcn/ui
npx shadcn@latest init

# 4. 安装 Tauri 插件
pnpm tauri add sqlite
pnpm tauri add shell
pnpm tauri add notification

# 5. 启动开发服务器
pnpm tauri dev
```

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (已确定):**
- 多租户隔离策略：数据库级隔离
- 本地数据存储：SQLite多文件
- 前后端通信：Tauri IPC Commands
- 认证方式：自建账号体系

**Important Decisions (已确定):**
- 数据同步冲突解决：时间戳优先
- 权限模型：RBAC + 数据权限
- 云端API设计：RESTful API
- 实时通信：WebSocket

**Deferred Decisions (Post-MVP):**
- 容器化部署迁移（当前传统服务器）
- 第三方OAuth集成（可选扩展）

### Data Architecture

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 多租户隔离 | 数据库级隔离 | - | 最强隔离、符合PRD安全要求 |
| 本地存储引擎 | SQLite | 3.45+ | 轻量、嵌入式、跨平台 |
| 本地存储策略 | 多文件分库 | - | 按插件分库、隔离更好、便于管理 |
| 数据同步策略 | 本地优先 + 增量同步 | - | 离线友好、减少网络依赖 |
| 冲突解决 | 时间戳优先 | - | 简单有效、最后修改者胜出 |
| 云端数据库 | PostgreSQL | 16.x | 开源、功能强大、社区活跃 |

### Authentication & Security

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 认证方式 | 自建账号体系 | - | 完全可控、无第三方依赖 |
| 密码加密 | bcrypt | - | 安全性高、强度因子≥12 |
| API Key存储 | 加密文件 | AES-256 | 本地加密、实现简单、跨平台 |
| 权限模型 | RBAC + 数据权限 | - | 角色 + 部门/个人数据隔离 |
| 传输加密 | TLS 1.3 | - | PRD要求、最新安全标准 |
| 存储加密 | AES-256 | - | PRD要求、敏感数据加密 |

### API & Communication Patterns

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 前后端通信 | Tauri IPC Commands | 2.0 | 原生方式、性能最好、类型安全 |
| 云端API风格 | RESTful API | - | 简单、通用、易缓存 |
| 实时通信 | WebSocket | - | 全双工、实时性好 |
| API文档 | OpenAPI 3.1 | - | 标准化、自动生成 |

### Frontend Architecture

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 框架 | React | 19.x | 生态最大、社区活跃 |
| 语言 | TypeScript | 5.x | 类型安全、开发体验好 |
| UI组件库 | Tailwind + shadcn/ui | 4.x | 现代化、可定制 |
| 状态管理 | Zustand | 5.x | 轻量、简单、性能好 |
| Store划分 | 按类型分离 | - | UI/业务/缓存状态分离、职责清晰 |
| 路由 | React Router | 7.x | 成熟稳定、社区最大 |
| 组件模式 | 容器/展示分离 | - | 逻辑与UI分离、可测试 |
| 构建工具 | Vite | 6.x | 快速、现代 |

### Infrastructure & Deployment

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 桌面框架 | Tauri | 2.0 | 轻量、安全、跨平台 |
| 后端语言 | Rust | 1.75+ | 高性能、内存安全 |
| 云服务部署 | 传统云服务器 | 阿里云/腾讯云 | 完全控制、成本可控 |
| CI/CD | GitHub Actions | - | 与GitHub集成、免费额度充足 |
| 日志监控 | ELK Stack | 8.x | 完全控制、功能全面 |
| 数据库 | PostgreSQL | 16.x | 开源、功能强大、社区活跃 |

### Development & Debugging

**前端调试方案：**

| 工具 | 用途 | 说明 |
|------|------|------|
| Chrome DevTools | 前端调试 | F12 打开，Console/Network/Sources 全可用 |
| React DevTools | 组件调试 | 组件树、Props、State 查看 |
| Tauri DevTools | IPC 调试 | 查看 IPC 调用、Rust 端日志 |

**开发模式命令：**
```bash
npm run tauri dev  # 前端 + Rust 后端同时启动，DevTools 完全可用
```

**后端日志方案：**

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 日志框架 | tracing + tracing-subscriber | Rust 标准日志生态 |
| 日志输出 | 控制台 + 文件双写 | 开发时看控制台，生产看文件 |
| 日志轮转 | 按天轮转 | 防止日志文件过大 |
| 日志级别 | INFO (生产) / DEBUG (开发) | 通过环境变量控制 |

**日志配置实现：**

```toml
# Cargo.toml
[dependencies]
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["fmt", "env-filter"] }
tracing-appender = "0.2"
```

```rust
// main.rs
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use tracing_appender::rolling::{RollingFileAppender, Rotation};

fn init_logging() {
    let log_dir = dirs::data_local_dir()
        .unwrap()
        .join("AI-Automated-Office")
        .join("logs");

    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        log_dir,
        "app.log"
    );

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())  // 控制台
        .with(tracing_subscriber::fmt::layer()
            .with_writer(file_appender)
            .with_ansi(false))  // 文件
        .init();
}
```

**日志文件位置：**

| 平台 | 路径 |
|------|------|
| Windows | `C:\Users\{用户名}\AppData\Local\AI-Automated-Office\logs\app.log` |
| macOS | `~/Library/Application Support/AI-Automated-Office/logs/app.log` |

**调试工作流：**

```
┌─────────────────────────────────────────────────────────────┐
│                    调试架构                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  前端 (Chrome DevTools)                                     │
│  ├── Console: 前端日志、IPC 调用结果                         │
│  ├── Network: 云端 API 请求                                 │
│  ├── Sources: React 代码断点                                │
│  └── React DevTools: 组件树、状态                           │
│                                                             │
│  后端 (日志文件)                                             │
│  ├── logs/app.log: Rust 后端全量日志                        │
│  ├── 包含: IPC 调用、工具执行、错误堆栈                      │
│  └── 可用 VSCode 或 tail -f 查看                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**可选：内置日志查看器**

应用内开发工具面板，通过 IPC 读取日志文件：

```rust
#[tauri::command]
fn read_log_file(lines: usize) -> Result<String, String> {
    let log_path = dirs::data_local_dir()
        .unwrap()
        .join("AI-Automated-Office")
        .join("logs")
        .join("app.log");
    // 读取最后 N 行
    Ok(read_last_lines(&log_path, lines))
}
```

### Decision Impact Analysis

**Implementation Sequence:**
1. 项目初始化 (Tauri + React + shadcn/ui)
2. 核心框架搭建（Agent Core - Rust）
3. 插件系统基础（Plugin Manager）
4. 权限系统（RBAC + 数据权限）
5. 第一个插件（人事管理 - P0）
6. 数据同步机制（Sync Engine）
7. 其他插件（按依赖顺序）

**Cross-Component Dependencies:**
```
人事管理插件 (基础层 P0)
    ↓
财务OCR、知识库RAG、仓库管理 (数据层 P1/P2)
    ↓
售后工单、标书制定、销售自动化 (业务层 P1/P2)
    ↓
数据看板 (展示层 P1)
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 15个领域需要统一模式以防止AI Agent实现冲突

### Naming Patterns

**Database Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 表名 | snake_case复数 | `users`, `orders`, `chat_sessions` |
| 列名 | snake_case | `user_id`, `created_at`, `is_active` |
| 主键 | `id` | `id` (自增或UUID) |
| 外键 | `{table}_id` | `user_id`, `order_id` |
| 索引 | `idx_{table}_{columns}` | `idx_users_email`, `idx_orders_user_id` |
| 布尔字段 | `is_{state}` | `is_active`, `is_deleted` |

**API Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 端点 | 复数名词 | `/users`, `/users/:id` |
| 子资源 | 嵌套路径 | `/users/:id/orders` |
| 动作 | HTTP动词表达 | GET /users, POST /users |
| 查询参数 | snake_case | `?page_size=10&sort_by=created_at` |
| 路径参数 | 冒号前缀 | `/users/:id` |

**Code Naming Conventions:**
| 元素 | 规则 | 示例 |
|------|------|------|
| 组件文件 | PascalCase.tsx | `UserCard.tsx`, `ChatPanel.tsx` |
| Hook文件 | use开头.ts | `useAuth.ts`, `useChat.ts` |
| 工具函数 | camelCase.ts | `formatDate.ts`, `apiClient.ts` |
| 类型文件 | PascalCase.types.ts | `User.types.ts` |
| 常量文件 | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |
| 变量 | camelCase | `userName`, `isLoading` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 接口/类型 | PascalCase | `User`, `ApiResponse<T>` |

### Structure Patterns

**Project Organization:**
```
src/
├── components/           # 可复用UI组件
│   ├── ui/              # shadcn/ui组件
│   └── common/          # 业务通用组件
├── features/            # 功能模块
│   ├── agent/           # Agent功能
│   ├── auth/            # 认证功能
│   └── plugin/          # 插件功能
├── hooks/               # 自定义Hooks
├── stores/              # Zustand状态
│   ├── uiStore.ts       # UI状态
│   ├── appStore.ts      # 应用状态
│   └── cacheStore.ts    # 缓存状态
├── lib/                 # 工具和服务
│   ├── api.ts           # API客户端
│   ├── utils.ts         # 工具函数
│   └── constants.ts     # 常量定义
├── types/               # 全局类型
└── styles/              # 全局样式

tests/
├── unit/                # 单元测试
│   ├── components/
│   └── hooks/
├── integration/         # 集成测试
└── e2e/                 # E2E测试
```

**File Structure Rules:**
- 测试文件放在 `tests/` 目录，镜像源码结构
- 每个功能模块可包含自己的 `components/`, `hooks/`, `types/`
- 共享工具统一放在 `lib/`

### Format Patterns

**API Response Format:**
```typescript
// 成功响应
{
  "code": 0,
  "data": { ... },
  "message": "success"
}

// 错误响应
{
  "code": 1001,
  "data": null,
  "message": "用户不存在"
}

// 分页响应
{
  "code": 0,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "page_size": 10
  },
  "message": "success"
}
```

**Date/Time Format:**
```typescript
// ISO 8601 格式
"2024-01-15T10:30:00Z"           // UTC
"2024-01-15T18:30:00+08:00"      // 带时区

// 前端显示时使用 dayjs 格式化
dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
```

**JSON Field Naming:**
- API和数据库统一使用 `snake_case`
- 前端接收后保持原样，不进行转换
- TypeScript接口使用 `snake_case` 字段名

### Communication Patterns

**Event Naming Convention:**
```typescript
// 事件命名：{domain}.{action_past_tense}
"user.created"
"user.updated"
"user.deleted"
"message.sent"
"message.received"
"plugin.installed"
"plugin.activated"

// 事件载荷结构
{
  "event": "user.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": 123,
    "username": "john"
  }
}
```

**State Update Pattern:**
```typescript
// Zustand Store 示例
interface AppState {
  user: User | null;
  isLoading: boolean;
  
  // 直接使用 set 更新
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

const useAppStore = create<AppState>((set) => ({
  user: null,
  isLoading: false,
  
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

**Error Handling Pattern:**
```typescript
// 组件内局部错误处理
const MyComponent = () => {
  const [error, setError] = useState<Error | null>(null);
  
  const handleSubmit = async () => {
    try {
      await submitForm();
    } catch (err) {
      setError(err as Error);
      // 显示错误提示
      toast.error((err as Error).message);
    }
  };
  
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return <Form onSubmit={handleSubmit} />;
};
```

### Process Patterns

**Loading State Pattern:**
```typescript
// 组件内局部loading状态
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getData();
      setData(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return <Content />;
};
```

**Form Validation Pattern:**
```typescript
// 提交时验证
const MyForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (values: FormValues) => {
    const errors: Record<string, string> = {};
    if (!values.username) errors.username = '用户名必填';
    if (!values.email) errors.email = '邮箱必填';
    return errors;
  };
  
  const handleSubmit = (values: FormValues) => {
    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    // 提交表单
    submitForm(values);
  };
  
  return <Form onSubmit={handleSubmit} errors={errors} />;
};
```

**Structured Logging Pattern:**
```typescript
// 日志格式
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "context": "AgentService",
  "message": "Tool execution started",
  "data": {
    "tool_name": "read_file",
    "session_id": "abc123"
  }
}

// 前端日志工具
const logger = {
  info: (context: string, message: string, data?: object) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      context,
      message,
      data
    }));
  },
  error: (context: string, message: string, error?: Error) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      context,
      message,
      error: error?.message,
      stack: error?.stack
    }));
  }
};
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. 遵循所有命名规范，不得自创风格
2. 将测试文件放在 `tests/` 目录
3. 使用统一的API响应格式
4. 使用ISO 8601日期格式
5. 事件命名使用 `domain.action_past_tense` 格式
6. 使用结构化日志格式

**Pattern Enforcement:**
- 代码审查时检查命名规范
- ESLint规则强制文件命名
- TypeScript接口强制API响应格式
- PR模板包含模式检查清单

### Pattern Examples

**Good Examples:**
```typescript
// ✅ 正确的组件命名
export const UserCard: React.FC<UserCardProps> = ({ user }) => { ... }

// ✅ 正确的API响应
return { code: 0, data: user, message: "success" };

// ✅ 正确的事件命名
eventBus.emit("user.created", { user_id: 123 });
```

**Anti-Patterns:**
```typescript
// ❌ 错误的组件命名
export const userCard = ({ user }) => { ... }

// ❌ 错误的API响应
return { success: true, result: user };

// ❌ 错误的事件命名
eventBus.emit("createUser", { user_id: 123 });
```

## Additional Implementation Patterns

### UI Resources Patterns

**Icon Library:**
- 图标库：Lucide Icons（shadcn/ui默认）
- 使用方式：React组件方式
- 安装：`pnpm add lucide-react`

```typescript
// 图标使用示例
import { User, Settings, MessageSquare } from 'lucide-react';

export const MyComponent = () => {
  return (
    <div>
      <User className="w-4 h-4" />
      <Settings className="w-5 h-5 text-muted-foreground" />
      <MessageSquare className="w-6 h-6" />
    </div>
  );
};
```

**Icon Naming Convention:**
| 用途 | 图标 | 示例 |
|------|------|------|
| 用户相关 | User, Users, UserPlus | `<User />` |
| 操作相关 | Plus, Edit, Trash, Save | `<Plus />` |
| 状态相关 | Check, X, AlertCircle | `<Check />` |
| 导航相关 | Menu, ChevronLeft, ArrowRight | `<Menu />` |

### Dependency Management Patterns

**Frontend Dependency Versioning:**
```json
{
  "dependencies": {
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "zustand": "5.0.0",
    "@tanstack/react-query": "5.50.0"
  },
  "devDependencies": {
    "typescript": "5.5.0",
    "vite": "6.0.0",
    "tailwindcss": "4.0.0"
  }
}
```

**Rust Dependency Versioning:**
```toml
[dependencies]
tauri = { version = "2.0.0", features = ["shell-open"] }
serde = { version = "1.0.200", features = ["derive"] }
serde_json = "1.0.120"
tokio = { version = "1.38.0", features = ["full"] }
sqlx = { version = "0.7.0", features = ["runtime-tokio", "sqlite"] }
```

**Dependabot Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    
  - package-ecosystem: "cargo"
    directory: "/src-tauri"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

### Code Quality Patterns

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**ESLint Configuration:**
```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

**Conventional Commits:**
```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整（不影响逻辑）
refactor: 代码重构
perf: 性能优化
test: 测试相关
chore: 构建/工具相关

示例：
feat(agent): 添加智谱AI适配器
fix(plugin): 修复插件加载顺序问题
docs(readme): 更新安装说明
```

**Git Flow Branches:**
```
main           # 生产分支，始终稳定
  ↑
release/*      # 发布分支，准备发布
  ↑
develop        # 开发分支，集成最新功能
  ↑
feature/*      # 功能分支，开发新功能
hotfix/*       # 热修复分支，紧急修复
```

### Internationalization & Theme Patterns

**国际化策略：**
- MVP阶段：仅支持中文
- Post-MVP：预留i18n接口，后续扩展

```typescript
// 预留国际化接口
const i18n = {
  t: (key: string) => {
    // TODO: 实现多语言支持
    return key;
  }
};

// 当前使用方式
const text = i18n.t('登录');
```

**Theme Switching:**
```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
}
```

```typescript
// 主题切换实现
const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };
  
  return { theme, toggleTheme };
};
```

### Documentation & Comment Patterns

**代码注释规范：**
- 注释语言：中文
- 文档规范：无强制规范，按需添加
- 复杂逻辑必须添加注释说明

```typescript
// 用户认证状态管理
// 支持本地存储持久化和自动刷新
export const useAuth = () => {
  // 从本地存储恢复会话
  const restoreSession = async () => {
    // 实现逻辑...
  };
  
  return { restoreSession };
};
```

### Security & Privacy Patterns

**敏感数据处理：**
```typescript
// API Key 加密存储
import { invoke } from '@tauri-apps/api/core';

// 保存API Key（加密）
const saveApiKey = async (provider: string, key: string) => {
  await invoke('save_encrypted_data', {
    key: `api_key_${provider}`,
    value: key
  });
};

// 读取API Key（解密）
const getApiKey = async (provider: string): Promise<string> => {
  return await invoke('get_decrypted_data', {
    key: `api_key_${provider}`
  });
};
```

**日志脱敏规则：**
- 敏感字段手动处理
- 禁止记录：password, api_key, token, secret
- 必须脱敏：email、phone（部分隐藏）

```typescript
// 日志脱敏示例
const sanitizeLog = (data: object) => {
  const sensitiveFields = ['password', 'api_key', 'token', 'secret'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  // 手机号部分隐藏
  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return sanitized;
};
```

### Performance & Monitoring Patterns

**自研埋点方案：**
```typescript
// 性能埋点工具
const perfLogger = {
  // 记录操作耗时
  track: (operation: string, duration: number, metadata?: object) => {
    const log = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      operation,
      duration_ms: duration,
      metadata
    };
    
    // 本地存储 + 可选云端上报
    console.log(JSON.stringify(log));
    invoke('log_performance', { log });
  },
  
  // 计时器
  startTimer: (operation: string) => {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      perfLogger.track(operation, duration);
    };
  }
};

// 使用示例
const endTimer = perfLogger.startTimer('tool_execution');
await executeTool('read_file');
endTimer();
```

**错误上报机制：**
```typescript
// 错误上报服务
const errorReporter = {
  report: async (error: Error, context: object) => {
    const payload = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      system: {
        platform: navigator.platform,
        userAgent: navigator.userAgent
      }
    };
    
    // 上报到云端
    await fetch('/api/errors/report', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// 全局错误捕获
window.addEventListener('error', (event) => {
  errorReporter.report(event.error, { type: 'global' });
});

window.addEventListener('unhandledrejection', (event) => {
  errorReporter.report(event.reason, { type: 'unhandled_promise' });
});
```

### Complete Patterns Summary Table

| 类别 | 模式项 | 选择 |
|------|--------|------|
| **命名模式** | 数据库命名 | snake_case |
| | API端点命名 | 复数名词 (RESTful) |
| | 文件命名 | PascalCase (.tsx/.ts) |
| | 变量命名 | camelCase |
| | 常量命名 | UPPER_SNAKE_CASE |
| **结构模式** | 测试文件位置 | 独立 tests/ 目录 |
| | 组件组织 | 按类型分 |
| | 共享工具 | 单一 lib/ 目录 |
| **格式模式** | API响应格式 | 统一包装 { code, data, message } |
| | 日期时间格式 | ISO 8601 字符串 |
| | JSON字段命名 | snake_case |
| **通信模式** | 事件命名 | 点分隔+过去式 (user.created) |
| | 状态更新 | Zustand内置方式 |
| | 错误处理 | 局部错误处理 |
| **流程模式** | 加载状态 | 局部加载状态 |
| | 表单验证 | 提交时验证 |
| | 日志规范 | 结构化日志 (JSON) |
| **UI资源** | 图标库 | Lucide Icons |
| | 图标使用 | 组件方式 |
| **依赖管理** | 前端版本 | 固定版本 |
| | Rust版本 | 固定版本 |
| | 更新策略 | Dependabot |
| **代码质量** | 格式化工具 | Prettier |
| | Git提交规范 | Conventional Commits |
| | 分支策略 | Git Flow |
| **国际化主题** | 国际化 | 暂不实现(MVP仅中文) |
| | 主题切换 | CSS变量 |
| **文档注释** | 注释语言 | 中文 |
| | 文档规范 | 无强制规范 |
| **安全隐私** | 敏感数据 | 本地加密存储 |
| | 日志脱敏 | 手动脱敏 |
| **性能监控** | 性能监控 | 自研埋点 |
| | 错误上报 | 云端上报 |

## Project Structure

### 完整项目目录结构

```
ai-automated-office/
├── 📁 配置文件
│   ├── package.json                    # 前端依赖配置
│   ├── pnpm-lock.yaml                  # pnpm锁定文件
│   ├── tsconfig.json                   # TypeScript配置
│   ├── tsconfig.node.json              # Node环境TS配置
│   ├── vite.config.ts                  # Vite构建配置
│   ├── tailwind.config.js              # Tailwind配置
│   ├── postcss.config.js               # PostCSS配置
│   ├── .env.example                    # 环境变量示例
│   ├── .gitignore                      # Git忽略配置
│   ├── .eslintrc.cjs                   # ESLint配置
│   ├── .prettierrc                     # Prettier配置
│   ├── components.json                 # shadcn/ui配置
│   └── README.md                       # 项目说明
│
├── 📁 GitHub配置
│   └── .github/
│       ├── workflows/
│       │   ├── ci.yml                  # CI工作流
│       │   ├── release.yml             # 发布工作流
│       │   └── test.yml                # 测试工作流
│       ├── ISSUE_TEMPLATE/
│       │   ├── bug_report.md
│       │   └── feature_request.md
│       └── dependabot.yml              # Dependabot配置
│
├── 📁 前端源码 (src/)
│   ├── main.tsx                        # 应用入口
│   ├── App.tsx                         # 根组件
│   ├── vite-env.d.ts                   # Vite类型声明
│   │
│   ├── components/                     # UI组件
│   │   ├── ui/                         # shadcn/ui基础组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...
│   │   ├── common/                     # 业务通用组件
│   │   │   ├── AppLayout.tsx           # 应用布局
│   │   │   ├── Sidebar.tsx             # 侧边栏
│   │   │   ├── Header.tsx              # 头部导航
│   │   │   ├── LoadingSpinner.tsx      # 加载动画
│   │   │   ├── ErrorBoundary.tsx       # 错误边界
│   │   │   └── EmptyState.tsx          # 空状态
│   │   └── plugin/                     # 插件相关组件
│   │       ├── PluginCard.tsx          # 插件卡片
│   │       ├── PluginPanel.tsx         # 插件面板
│   │       └── PluginSettings.tsx      # 插件设置
│   │
│   ├── features/                       # 功能模块
│   │   ├── agent/                      # Agent核心功能
│   │   │   ├── components/
│   │   │   │   ├── ChatPanel.tsx       # 对话面板
│   │   │   │   ├── MessageList.tsx     # 消息列表
│   │   │   │   ├── MessageInput.tsx    # 消息输入
│   │   │   │   └── ToolCallDisplay.tsx # 工具调用展示
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts          # 对话Hook
│   │   │   │   └── useAgent.ts         # Agent Hook
│   │   │   └── types/
│   │   │       └── agent.types.ts      # Agent类型
│   │   │
│   │   ├── auth/                       # 认证功能
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx       # 登录表单
│   │   │   │   └── UserInfo.tsx        # 用户信息
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts          # 认证Hook
│   │   │   └── types/
│   │   │       └── auth.types.ts       # 认证类型
│   │   │
│   │   ├── plugin/                     # 插件系统
│   │   │   ├── components/
│   │   │   │   ├── PluginManager.tsx   # 插件管理器
│   │   │   │   └── PluginMarket.tsx    # 插件市场
│   │   │   ├── hooks/
│   │   │   │   └── usePlugin.ts        # 插件Hook
│   │   │   └── types/
│   │   │       └── plugin.types.ts     # 插件类型
│   │   │
│   │   └── settings/                   # 设置功能
│   │       ├── components/
│   │       │   ├── SettingsPanel.tsx   # 设置面板
│   │       │   ├── ModelConfig.tsx     # 模型配置
│   │       │   └── ApiKeyManager.tsx   # API密钥管理
│   │       └── types/
│   │           └── settings.types.ts
│   │
│   ├── hooks/                          # 全局Hooks
│   │   ├── useTauri.ts                 # Tauri IPC封装
│   │   ├── useEventBus.ts              # 事件总线Hook
│   │   └── useLocalStorage.ts          # 本地存储Hook
│   │
│   ├── stores/                         # Zustand状态
│   │   ├── uiStore.ts                  # UI状态(主题、面板)
│   │   ├── appStore.ts                 # 应用状态(用户、会话)
│   │   ├── cacheStore.ts               # 缓存状态(临时数据)
│   │   └── pluginStore.ts              # 插件状态
│   │
│   ├── lib/                            # 工具和服务
│   │   ├── api.ts                      # 云端API客户端
│   │   ├── tauri.ts                    # Tauri命令封装
│   │   ├── utils.ts                    # 工具函数
│   │   ├── constants.ts                # 常量定义
│   │   ├── logger.ts                   # 日志工具
│   │   └── validators.ts               # 验证工具
│   │
│   ├── types/                          # 全局类型
│   │   ├── global.d.ts                 # 全局类型声明
│   │   ├── api.types.ts                # API响应类型
│   │   └── models.types.ts             # 数据模型类型
│   │
│   └── styles/                         # 全局样式
│       ├── globals.css                 # 全局CSS
│       └── themes/                     # 主题文件
│           ├── light.css
│           └── dark.css
│
├── 📁 Tauri/Rust后端 (src-tauri/)
│   ├── Cargo.toml                      # Rust依赖配置
│   ├── Cargo.lock                      # Rust锁定文件
│   ├── tauri.conf.json                 # Tauri配置
│   ├── build.rs                        # 构建脚本
│   │
│   └── src/
│       ├── main.rs                     # Rust入口
│       ├── lib.rs                      # 库入口
│       │
│       ├── agent/                      # Agent核心
│       │   ├── mod.rs
│       │   ├── llm/                    # LLM适配器
│       │   │   ├── mod.rs
│       │   │   ├── provider.rs         # Provider trait
│       │   │   ├── openai.rs           # OpenAI适配器
│       │   │   ├── zhipu.rs            # 智谱适配器
│       │   │   ├── dashscope.rs        # 百炼适配器
│       │   │   └── deepseek.rs         # DeepSeek适配器
│       │   │
│       │   ├── tools/                  # 工具系统
│       │   │   ├── mod.rs
│       │   │   ├── registry.rs         # 工具注册表
│       │   │   ├── executor.rs         # 工具执行器
│       │   │   ├── core/               # 核心工具
│       │   │   │   ├── mod.rs
│       │   │   │   ├── fs.rs           # 文件系统工具
│       │   │   │   ├── shell.rs        # Shell工具
│       │   │   │   └── http.rs         # HTTP工具
│       │   │   └── mcp/                # MCP工具
│       │   │       ├── mod.rs
│       │   │       ├── client.rs       # MCP客户端
│       │   │       └── handler.rs      # MCP处理器
│       │   │
│       │   ├── memory/                 # 记忆管理
│       │   │   ├── mod.rs
│       │   │   ├── store.rs            # 记忆存储
│       │   │   ├── compressor.rs       # 上下文压缩
│       │   │   └── embeddings.rs       # 向量嵌入
│       │   │
│       │   └── session/                # 会话管理
│       │       ├── mod.rs
│       │       ├── manager.rs          # 会话管理器
│       │       └── history.rs          # 历史记录
│       │
│       ├── plugins/                    # 插件系统
│       │   ├── mod.rs
│       │   ├── manager.rs              # 插件管理器
│       │   ├── registry.rs             # 插件注册表
│       │   ├── loader.rs               # 插件加载器
│       │   └── dependency.rs           # 依赖管理
│       │
│       ├── sync/                       # 数据同步
│       │   ├── mod.rs
│       │   ├── engine.rs               # 同步引擎
│       │   ├── conflict.rs             # 冲突解决
│       │   └── delta.rs                # 增量同步
│       │
│       ├── storage/                    # 本地存储
│       │   ├── mod.rs
│       │   ├── sqlite.rs               # SQLite操作
│       │   └── encryption.rs           # 加密存储
│       │
│       ├── auth/                       # 认证授权
│       │   ├── mod.rs
│       │   ├── user.rs                 # 用户管理
│       │   ├── permission.rs           # 权限管理
│       │   └── tenant.rs               # 租户管理
│       │
│       ├── commands/                   # Tauri命令
│       │   ├── mod.rs
│       │   ├── agent.rs                # Agent命令
│       │   ├── plugin.rs               # 插件命令
│       │   ├── storage.rs              # 存储命令
│       │   └── system.rs               # 系统命令
│       │
│       └── utils/                      # 工具函数
│           ├── mod.rs
│           ├── logger.rs               # 日志工具
│           └── error.rs                # 错误处理
│
├── 📁 业务插件 (plugins/)               # 遵循插件开发规范 (plugin-dev-spec)
│   │
│   ├── hr/                             # 人事管理插件 (核心模块)
│   │   ├── plugin.json                 # 【必需】插件清单 (Manifest)
│   │   │
│   │   ├── ui/                         # UI层
│   │   │   ├── index.tsx               # UI入口
│   │   │   ├── routes/                 # 路由组件
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Employees.tsx
│   │   │   │   └── Departments.tsx
│   │   │   ├── components/             # 共享组件
│   │   │   └── sidebar/                # 侧边栏配置
│   │   │
│   │   ├── tools/                      # 工具层 (遵循ADR-025通用工具架构)
│   │   │   ├── index.ts                # 工具注册入口
│   │   │   ├── query.ts                # hr_query: 通用查询
│   │   │   ├── aggregate.ts            # hr_aggregate: 统计聚合
│   │   │   ├── mutate.ts               # hr_mutate: 数据变更
│   │   │   ├── action.ts               # hr_action: 业务操作
│   │   │   └── export.ts               # hr_export: 数据导出
│   │   │
│   │   ├── skills/                     # Skills层 (可选)
│   │   │   └── generate-report.ts      # AI生成人事报告
│   │   │
│   │   ├── data/                       # 数据层
│   │   │   ├── models/                 # 数据模型
│   │   │   │   ├── employee.ts
│   │   │   │   └── department.ts
│   │   │   ├── migrations/             # 数据库迁移
│   │   │   │   └── 001_init.sql
│   │   │   └── repositories/           # 数据访问层
│   │   │
│   │   ├── services/                   # 业务层
│   │   │   └── employee.service.ts
│   │   │
│   │   ├── handlers/                   # 事件处理
│   │   │   └── approval.handler.ts
│   │   │
│   │   ├── permissions/                # 权限定义
│   │   │   └── index.ts                # 角色和权限矩阵
│   │   │
│   │   └── tests/                      # 测试
│   │       └── tools.test.ts
│   │
│   ├── sales/                          # 销售管理插件 (核心模块)
│   │   ├── plugin.json
│   │   ├── ui/
│   │   │   ├── routes/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Contracts.tsx
│   │   │   │   ├── Orders.tsx
│   │   │   │   └── Customers.tsx
│   │   │   └── components/
│   │   ├── tools/                      # query/aggregate/mutate/action/export
│   │   ├── skills/
│   │   │   ├── generate-contract.ts    # AI生成合同
│   │   │   └── generate-quote.ts       # AI生成报价单
│   │   ├── data/
│   │   │   └── models/
│   │   │       ├── contract.ts
│   │   │       ├── order.ts
│   │   │       └── customer.ts
│   │   ├── services/
│   │   └── permissions/
│   │
│   ├── approval/                       # 审批中心插件 (核心模块)
│   │   ├── plugin.json
│   │   ├── ui/
│   │   ├── tools/
│   │   ├── data/
│   │   │   └── models/
│   │   │       ├── template.ts         # 审批模板
│   │   │       ├── workflow.ts         # 审批流程
│   │   │       └── instance.ts         # 审批实例
│   │   └── permissions/
│   │
│   ├── finance/                        # 财务管理插件 (核心模块)
│   │   ├── plugin.json
│   │   ├── ui/
│   │   ├── tools/
│   │   ├── skills/
│   │   │   └── ocr-invoice.ts          # OCR识别发票
│   │   └── data/
│   │
│   ├── warehouse/                      # 仓储管理插件 (核心模块)
│   │   ├── plugin.json
│   │   ├── ui/
│   │   ├── tools/
│   │   └── data/
│   │
│   ├── after-sales/                    # 售后服务插件 (扩展模块)
│   │   ├── plugin.json
│   │   ├── dependencies: [sales]       # 依赖销售插件
│   │   ├── ui/
│   │   ├── tools/
│   │   └── data/
│   │       └── models/
│   │           └── ticket.ts           # 售后工单
│   │
│   ├── bidding/                        # 招投标插件 (扩展模块)
│   │   └── plugin.json
│   │
│   ├── marketing/                      # 市场宣传插件 (扩展模块)
│   │   └── plugin.json
│   │
│   └── dashboard/                      # 数据看板插件 (扩展模块)
│       └── plugin.json
│
├── 📁 测试 (tests/)
│   ├── unit/                           # 单元测试
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── integration/                    # 集成测试
│   │   ├── agent/
│   │   ├── plugins/
│   │   └── sync/
│   └── e2e/                            # E2E测试
│       ├── auth.spec.ts
│       ├── chat.spec.ts
│       └── plugin.spec.ts
│
├── 📁 云端后端 (cloud-server/)
│   ├── go.mod                          # Go模块配置
│   ├── go.sum                          # Go依赖锁定
│   ├── main.go                         # Go入口
│   ├── config/                         # 配置
│   │   └── config.yaml
│   ├── api/                            # API路由
│   │   ├── auth.go
│   │   ├── tenant.go
│   │   └── sync.go
│   ├── models/                         # 数据模型
│   ├── services/                       # 业务服务
│   ├── middleware/                     # 中间件
│   └── docker-compose.yml
│
├── 📁 配置与日志
│   ├── config/                         # 配置文件(TOML)
│   │   ├── app.toml                    # 应用配置
│   │   ├── database.toml               # 数据库配置
│   │   └── logging.toml                # 日志配置
│   └── logs/                           # 日志目录
│       ├── app.log                     # 应用日志
│       ├── error.log                   # 错误日志
│       └── performance.log             # 性能日志
│
└── 📁 静态资源 (assets/)
    ├── icons/                          # 应用图标
    │   ├── icon.ico                    # Windows图标
    │   ├── icon.icns                   # macOS图标
    │   └── icon.png                    # Linux图标
    └── images/                         # 图片资源
        └── splash.png                  # 启动画面
```

### 架构边界定义

> **📋 插件开发规范**：详细的插件开发指南请参考 [_bmad-output/plugin-dev-spec/](../../plugin-dev-spec/) 目录，包含完整的插件清单规范、UI层规范、工具层规范、数据层规范、业务层规范、权限层规范、生命周期规范、质量规范和示例。

**API边界：**

| 边界 | 协议 | 说明 |
|------|------|------|
| 前端 ↔ Rust后端 | Tauri IPC | 同步命令调用，类型安全 |
| 客户端 ↔ 云服务 | REST + WebSocket | HTTP API + 实时推送 |
| Rust ↔ 插件 | 函数调用 | 同进程，直接调用 |

**组件边界：**

```
┌─────────────────────────────────────────────────────────┐
│  前端组件层                                              │
│  ├── UI组件 (components/ui/)      # 无业务逻辑          │
│  ├── 容器组件 (components/common/) # 业务逻辑 + 状态     │
│  └── 插件组件 (components/plugin/) # 插件专属UI          │
├─────────────────────────────────────────────────────────┤
│  状态管理层                                             │
│  ├── uiStore         # UI状态(主题、面板)               │
│  ├── appStore        # 应用状态(用户、会话)             │
│  └── pluginStore     # 插件状态                         │
├─────────────────────────────────────────────────────────┤
│  Tauri IPC层                                            │
│  └── commands/       # Rust命令暴露                     │
├─────────────────────────────────────────────────────────┤
│  Rust后端层                                              │
│  ├── agent/          # Agent核心                        │
│  ├── plugins/        # 插件系统                         │
│  └── storage/        # 本地存储                         │
└─────────────────────────────────────────────────────────┘
```

**数据边界：**

| 数据类型 | 存储位置 | 同步策略 |
|---------|---------|---------|
| 用户认证 | 云端PostgreSQL | 实时同步 |
| Agent会话 | 本地SQLite | 按需同步 |
| 插件数据 | 本地SQLite(分库) | 插件各自同步 |
| 配置数据 | 本地TOML文件 | 可选同步 |
| 日志数据 | 本地logs/目录 | 不同步 |

## Critical Gap Solutions

### 云端后端技术栈

| 决策项 | 选择 | 版本 | 理由 |
|--------|------|------|------|
| 后端语言 | Go | 1.22+ | 高性能、部署简单、内存占用低 |
| Web框架 | Gin | 1.10+ | 轻量、高性能、生态丰富 |
| 数据库驱动 | pgx | 5.x | PostgreSQL原生驱动、性能好 |

**Go后端项目结构：**
```
cloud-server/
├── main.go                 # 入口
├── config/                 # 配置管理
├── api/                    # API路由
│   ├── auth.go            # 认证API
│   ├── tenant.go          # 租户API
│   ├── sync.go            # 同步API
│   └── websocket.go       # WebSocket处理
├── models/                 # 数据模型
├── services/               # 业务逻辑
├── middleware/             # 中间件
│   ├── auth.go            # 认证中间件
│   ├── cors.go            # CORS中间件
│   └── ratelimit.go       # 限流中间件
└── docker-compose.yml      # Docker编排
```

### OCR能力方案

| 决策项 | 选择 | 说明 |
|--------|------|------|
| OCR引擎 | PaddleOCR | 离线可用、无费用 |
| 部署方式 | Python微服务 | 独立进程、按需启动 |
| 模型 | PP-OCRv4 | 中文识别准确率高 |

**PaddleOCR集成架构：**
```
┌─────────────────────────────────────────────────────────┐
│                    财务OCR插件                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              OCR Service (Python)                │    │
│  │  PaddleOCR + Flask API                          │    │
│  └─────────────────────────────────────────────────┘    │
│                        ↕ HTTP                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Rust OCR Client                     │    │
│  │  HTTP调用 + 结果解析                             │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 向量数据库方案

| 方案 | 触发条件 | 说明 |
|------|---------|------|
| SQLite + sqlite-vec | 默认 | 轻量、无需额外服务 |
| 本地Chroma | 用户选择 | 专为RAG设计、功能丰富 |
| Qdrant本地版 | 用户选择 | 高性能、功能全面 |
| 云端向量库 | 用户选择 | 无需本地维护 |

**向量数据库配置界面：**
```typescript
// 向量数据库配置类型
interface VectorDbConfig {
  type: 'sqlite-vec' | 'chroma' | 'qdrant' | 'cloud';
  endpoint?: string;      // 云端地址
  apiKey?: string;        // 云端API Key
  collection?: string;    // 集合名称
}
```

### 文件存储方案

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 本地存储 | 应用数据目录 | `{app_data}/files/` |
| 云端备份 | 阿里云OSS/腾讯云COS | 用户配置选择 |
| 同步策略 | 本地优先 + 后台上传 | 不阻塞用户操作 |

**文件存储架构：**
```
┌─────────────────────────────────────────────────────────┐
│                    文件存储服务                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              本地存储层                           │    │
│  │  {app_data}/files/{tenant_id}/{plugin_id}/      │    │
│  └─────────────────────────────────────────────────┘    │
│                        ↕ 后台同步                        │
│  ┌─────────────────────────────────────────────────┐    │
│  │              云端存储层                           │    │
│  │  OSS Bucket: {tenant_id}/{plugin_id}/           │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 配置与日志

| 决策项 | 选择 | 说明 |
|--------|------|------|
| 配置文件格式 | TOML | Rust生态常用、可读性好 |
| 配置存储位置 | `config/` 目录 | 应用安装目录下 |
| 日志存储位置 | `logs/` 目录 | 应用安装目录下 |
| 日志格式 | JSON结构化 | 便于分析和查询 |

**配置文件示例：**
```toml
# config/app.toml
[app]
name = "ai-automated-office"
version = "0.1.0"

[database]
type = "sqlite"
path = "./data/app.db"

[logging]
level = "info"
path = "./logs/"
max_size_mb = 100
max_files = 10

[cloud]
api_endpoint = "https://api.example.com"
ws_endpoint = "wss://ws.example.com"
```

## Editor and Dynamic Template Runtime Architecture

### Architecture Positioning

新增的编辑器系统与动态模板渲染能力属于平台公共基础设施，位于 Presentation Layer 与 Plugin Layer 之间，并由 Agent Core 协同驱动：

- Presentation Layer 负责编辑器宿主、设计器界面、模板预览与用户交互
- Agent Core Layer 负责 AI 模板生成、数据填充、意图理解与模板调整建议
- Plugin Layer 提供部门专属模板、数据源适配器和自定义编辑器扩展
- Data Layer 负责模板定义、模板版本、用户偏好与渲染快照的本地优先存储

### Core Components

| 组件 | 职责 | 所在层 |
|------|------|------|
| Editor Registry | 注册内置/扩展编辑器，维护元信息、优先级、生命周期 | Presentation Layer |
| Editor Resolver | 基于 Glob、优先级和用户偏好解析文件对应编辑器 | Presentation Layer |
| Editor Host | 承载文本、Markdown、媒体、Canvas、自定义Webview编辑器 | Presentation Layer |
| Canvas Render Engine | 负责图形绘制、图层管理、按需重绘、导出 | Presentation Layer |
| Template Runtime | 解析模板Schema、执行条件/循环渲染、管理数据绑定 | Agent Core + Presentation |
| Template Designer | 低代码可视化设计器，支持拖拽、属性面板、图层面板 | Presentation Layer |
| Template Library Service | 管理部门模板库、标签、版本、发布审核与权限 | Plugin Layer + Data Layer |
| Editor Extension API | 向部门插件暴露生命周期、文档、UI集成与Webview能力 | Plugin Layer |

### Runtime Flow

1. 用户打开文件或模板资产，Editor Resolver 根据注册表、Glob 和偏好选择编辑器。
2. 若为模板类资源，Template Runtime 加载 JSON/YAML Schema，并解析画布、图层和占位符定义。
3. Agent Core 根据模板语义查询业务数据，执行占位符填充、条件渲染和循环渲染。
4. Canvas Render Engine 仅对变更图层重绘，并向设计器/预览面板回传可视结果。
5. 用户可手动微调样式、布局和数据值，覆盖记录写入模板版本历史。
6. 模板成品可发布到部门模板库，或通过扩展API交由部门插件专用编辑器继续处理。

### Storage and Isolation

| 数据对象 | 存储位置 | 说明 |
|------|------|------|
| 编辑器注册信息 | 本地配置 + 插件清单 | 支持声明式和编程式注册 |
| 用户编辑器偏好 | 本地SQLite/配置文件 | 按用户维度持久化 |
| 模板Schema与版本 | 本地SQLite + 文件资产目录 | 本地优先，支持版本回退 |
| 模板预览快照 | 本地缓存目录 | 用于快速恢复和预览 |
| 部门模板库元数据 | 租户隔离数据空间 | 部门可见性与审核状态受控 |

### Security and Boundary Rules

- 自定义编辑器扩展必须经 Editor Registry 注册，禁止绕过宿主直接访问平台内部状态。
- Webview 型编辑器通过受控桥接访问文档、UI 与工具能力，敏感操作继续走统一审批与审计链路。
- 模板数据绑定仅允许访问已授权的部门数据源，并受数据访问白名单与字段脱敏规则约束。
- 模板库按租户、部门和可见范围隔离，管理员审核后才能发布到共享模板空间。

## UI 分层与模块矩阵

> **参考文档：** [ui-module-matrix-2026-03-22.md](./ui-module-matrix-2026-03-22.md) — 详细定义了固定 UI / 混合 UI / 动态 UI 的完整清单、部门维度矩阵及迁移建议。

### 分层策略

系统前端采用三层划分：

1. `固定 UI`：平台级、强约束、强安全、强一致性的系统控制面。
2. `混合 UI`：固定页面壳层承载动态业务内容区，是主要业务页面形态。
3. `动态 UI`：企业差异大、变更频繁的业务表单、看板、流程视图和文档模板。

### 判断标准

| 判断维度 | 固定 UI | 混合 UI | 动态 UI |
|----------|---------|---------|---------|
| 业务差异性 | 低 | 中 | 高 |
| 交互稳定性要求 | 高 | 高 | 中 |
| 安全/审计要求 | 高 | 高 | 中 |
| 模板化必要性 | 低 | 中 | 高 |
| 典型对象 | 登录、设置、权限、插件治理 | 工作台、审批页、详情页、编辑器宿主 | 表单、看板、流程图、文档模板 |

### 固定 UI 模块

#### 平台壳层

- TopBar
- ActivityBar
- Sidebar 外壳
- Workbench 容器外壳
- AI Chat Panel 外壳
- StatusBar
- Command Palette
- 全局 Dialog / Toast / Confirm

#### 身份与账户

- 登录页
- 找回密码 / 重置密码页
- 租户选择页
- 首次初始化向导
- 账号中心
- 个人偏好设置

#### 权限与治理

- 用户管理页
- 角色管理页
- 权限矩阵页
- 部门管理页
- 组织架构管理页
- 租户管理页
- 数据访问白名单管理页
- 敏感字段脱敏规则页
- 审计日志页

#### 平台配置与运行治理

- 系统设置
- 模型配置页
- API Key 管理页
- MCP 服务管理页
- Skill 管理页
- Sub-Agent 管理页
- 插件市场页
- 已安装插件页
- 插件权限授权页
- 插件设置页
- 系统消息中心
- 通知设置页
- 错误中心 / 诊断页
- 同步状态页
- 系统更新页
- 关于页

### 混合 UI 模块

| 页面/区域 | 固定部分 | 动态部分 |
|-----------|----------|----------|
| 首页工作台 | 标题、时间范围、筛选、通用操作 | 指标卡、待办卡、图表、部门区块 |
| 部门首页 | 页头、导航、权限提示、常用入口 | KPI 卡片、工作队列、分析面板 |
| 列表页 | 筛选框架、分页、批量操作壳 | 列配置、数据摘要卡、局部扩展区 |
| 详情页 | 返回、状态、操作栏、审批动作 | 字段区、附件区、上下游关系区、分析区 |
| 审批中心 | 列表框架、动作按钮、轨迹壳 | 审批单内容、流程节点详情、表单显示区 |
| 编辑器工作区 | 顶部工具栏、标签栏、属性面板壳 | 画布内容、图层树、模板节点内容 |
| 部门模块容器页 | 模块导航、面包屑、权限边界提示 | 业务卡片、表格、流程图、模板内容 |

### 动态 UI 模块

#### 业务表单

- 请假单
- 报销单
- 采购申请单
- 入库单
- 出库单
- 盘点单
- 客户录入单
- 报价单
- 合同录入页
- 工单页
- 资质录入页
- 标书信息页

#### 业务详情主体

- 客户详情主体
- 合同详情主体
- 订单详情主体
- 发票详情主体
- 库存详情主体
- 工单详情主体
- 标书详情主体

#### 业务看板与报表

- 销售漏斗
- 财务台账看板
- 回款分析
- 库存热力图
- 工单状态看板
- 招投标进度看板
- 管理层经营驾驶舱
- 部门 KPI 大盘

#### 业务流程与文档模板

- 审批流程图
- 仓储流转图
- 客户跟进流程图
- 工单升级流程图
- 投标里程碑流程图
- 报价模板
- 合同模板
- 发票整理模板
- 标书模板
- 财务报表模板
- 业务分析报告模板
- 审批模板

### 部门模块矩阵

| 部门/模块 | 固定 UI | 混合 UI | 动态 UI |
|-----------|---------|---------|---------|
| 人事部 | 组织管理、权限边界、基础设置 | 人事工作台、员工详情容器 | 入转调离表单、绩效看板、档案模板 |
| 审批中心 | 审批动作、流程壳、审计入口 | 审批列表、审批详情页壳 | 审批单内容、流程节点详情、规则化表单 |
| 销售部 | 客户配置、权限与集成设置 | 销售首页、客户详情壳 | 跟进表单、报价单、销售漏斗、合同模板 |
| 财务部 | 财务规则、发票接口配置 | 财务工作台、单据详情壳 | OCR 后整理表单、回款分析、财务报表模板 |
| 仓储部 | 仓储规则、同步策略设置 | 仓储首页、库存详情壳 | 入出库单、库存看板、流转图 |
| 售后服务 | 服务配置、SLA 规则设置 | 工单中心壳、客户服务页壳 | 工单表单、升级流程、服务分析卡片 |
| 招投标 | 模块配置、文档权限设置 | 招投标首页、项目详情壳 | 标书模板、资质表单、里程碑视图 |
| 管理层 | 角色范围、驾驶舱访问控制 | 高管工作台壳、分析容器页 | 经营驾驶舱、综合经营分析大盘 |

### 架构落地要求

1. 所有动态页面必须运行在固定的 Workbench、Editor Host、审批壳或详情壳中，不得绕过平台壳层直接接管全局布局。
2. 动态 UI 必须绑定细粒度权限模型，至少支持页面级、区块级、字段级、动作级、数据源级访问控制。
3. 模板运行时必须复用统一组件协议、统一事件协议和统一审计链路，不允许部门插件各自实现不兼容渲染框架。
4. 已完成固定页面无需整体返工，但业务承载区应逐步改造为页面容器和动态渲染宿主。

## Phase 2: 通用 Agent Runtime 与动态 UI 集成架构

### 架构目标

Phase 2 的目标不是为单一部门构建专用 Agent，而是在现有 Agent Core 基础上补齐通用 Agent Runtime，使同一套 Agent 核心可以覆盖审批、销售、财务、仓储、人事、售后、招投标和管理层等多业务场景。

### 分层关系

```text
User Intent
  -> Agent Runtime
  -> Planner / Tool Selection / Permission Gate
  -> Department Tools / MCP / Skills / Plugins
  -> Dynamic UI Host / Template Runtime / Form Runtime
  -> Human Confirmation / Audit / Memory
```

### 关键组件边界

| 组件 | 职责 | 与 Epic 41/39/40/42 的关系 |
|------|------|---------------------------|
| Agent Runtime | 统一任务生命周期、计划拆解、步骤执行、失败恢复 | 通过页面宿主和动态内容区回写结果 |
| Tool Registry | 统一注册部门工具、插件工具、MCP工具与系统工具 | 结果可进入编辑器、模板、表单、详情页 |
| Context Assembler | 组装用户、租户、部门、页面、资源、知识库上下文 | 依赖 Epic 41 的页面上下文协议 |
| Permission Gate | 校验工具权限、数据权限、字段权限、动作权限 | 依赖 Epic 42 的字段和区块权限承载 |
| Template Runtime | 渲染 Schema、执行数据绑定、条件/循环渲染 | 依赖 Epic 40 的基础运行时能力 |
| Editor Host | 承载文档、模板、结构化编辑器实例 | 依赖 Epic 39 和 Epic 41 |

### 执行原则

1. 通用 Agent Runtime 必须输出到统一页面宿主和动态内容区，而不是仅停留在对话消息中。
2. Agent 对业务页面的写入必须通过模板运行时、表单运行时或编辑器宿主完成，不允许直接绕过 UI 协议修改页面状态。
3. Agent 能力扩展采用“统一 Runtime + 部门工具/上下文差异化”的方式，不采用“每个部门各自实现一套 Agent”模式。
4. 高风险动作仍需人工确认，所有 Agent 决策与工具调用必须进入统一审计链路。

### 推荐 Phase 2 依赖链

```text
Epic 41
  -> Epic 39 / Epic 40
  -> Epic 42
  -> 通用 Agent Runtime MVP
  -> Tool / Context / Memory / Audit
  -> 各部门业务接入
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
所有技术选型决策均兼容一致：
- Tauri 2.0 + React 19 + TypeScript 5.x 前端栈完整兼容
- Rust 后端与 Tauri 原生集成
- Go 云端后端与 RESTful API 设计匹配
- SQLite 本地 + PostgreSQL 云端 数据库架构一致

**Pattern Consistency:**
实现模式与架构决策完全对齐：
- 命名规范 (snake_case) 与 PostgreSQL/SQLite 兼容
- 目录结构支持分层微内核架构
- 事件命名规范与事件总线通信模式一致
- API响应格式与RESTful设计匹配

**Structure Alignment:**
项目结构充分支持架构决策：
- 前端目录结构支持 Agent Core Layer 组件化
- Rust目录结构支持微内核架构分层
- 插件目录结构支持同进程模块化运行
- 测试目录结构支持多层级测试策略

### Requirements Coverage Validation ✅

**功能需求覆盖（共854个）:**

| FR类别 | 需求编号范围 | 数量 | 架构支持 | 状态 |
|--------|-------------|------|---------|------|
| 桌面端UI与系统交互 | FR1-FR8 | 8 | Tauri + React + shadcn/ui | ✅ |
| AI Agent核心能力 | FR9-FR19 | 11 | Agent Core Layer (Rust) | ✅ |
| 部门模块系统 | FR20-FR26 | 7 | Plugin Layer + Manager | ✅ |
| 用户与权限管理 | FR27-FR33 | 7 | Auth模块 + RBAC | ✅ |
| 多租户管理 | FR34-FR37 | 4 | 数据库级隔离 | ✅ |
| 数据同步与存储 | FR38-FR43 | 6 | Sync Engine + WebSocket | ✅ |
| **统一消息系统** | FR44-FR48, FR59-FR68, FR90-FR98, FR600-FR662 | 99 | Message Router + WebSocket | ✅ |
| 工具调用可见性 | FR69-FR80 | 12 | Tool Panel + 状态监控 | ✅ |
| AI纠偏反馈学习 | FR81-FR89 | 9 | 错题集架构 | ✅ |
| 新手引导与帮助 | FR87-FR89 | 3 | 引导系统 | ✅ |
| 核心部门功能 | FR99-FR209 | 62 | Plugin目录结构 + 插件API | ✅ |
| 扩展部门功能 | FR220-FR244 | 13 | Plugin Layer | ✅ |
| 知识库RAG基础 | FR250-FR254 | 5 | 记忆层架构 | ✅ |
| 记忆层功能 | FR260-FR334 | 75 | 三层记忆架构 | ✅ |
| **AI Agent核心功能** | FR400-FR505 | 62 | Agent Core Layer | ✅ |
| **ClawHub生态兼容性** | FR700-FR755 | 56 | 兼容适配层 | ✅ |
| **LLM提供商管理** | FR800-FR809 | 10 | LLM Adapter Registry + Provider Config | ✅ |
| **MCP服务管理** | FR810-FR820 | 11 | MCP Client Manager + Service Registry | ✅ |
| **MCP工具Approve策略** | FR825-FR832 | 8 | Tool Policy Engine + Approval Workflow | ✅ |
| **Skill配置管理** | FR835-FR840 | 6 | Skill Registry + Plugin Governance | ✅ |
| **系统提示词管理** | FR850-FR860 | 11 | Prompt Store + Versioning + Audit | ✅ |
| **Rules规则管理** | FR865-FR875 | 11 | Rule Engine + Priority Resolver | ✅ |
| **提示词调试功能** | FR880-FR888 | 9 | Prompt Sandbox + Token Analyzer | ✅ |
| **Sub-Agent管理** | FR890-FR900 | 11 | Sub-Agent Registry + Lifecycle Manager | ✅ |
| **Sub-Agent角色配置** | FR905-FR914 | 10 | Persona Config + AI Prompt Builder | ✅ |
| **Sub-Agent工具权限** | FR915-FR925 | 11 | Capability Binding + Permission Guard | ✅ |
| **Sub-Agent调用机制** | FR930-FR938 | 9 | Delegation Router + Execution Trace | ✅ |
| **多知识库配置功能** | FR940-FR960 | 21 | Knowledge Source Manager + Access Control | ✅ |
| **数据访问白名单功能** | FR965-FR974 | 10 | Query Guard + Masking Policy | ✅ |
| **缺失功能补充（新增）** | FR1000-FR1212 | 169 | 平台治理、运维、编辑器基础设施、可观测性与容错子系统 | ✅ |
| **编辑器系统与动态模板渲染** | FR1213-FR1302 | 90 | Editor Registry + Template Runtime + Canvas Renderer + Template Library | ✅ |
| **总计** | | **854** | | ✅ |

**非功能需求覆盖:**

| NFR类别 | 需求编号 | 架构支持 | 状态 |
|---------|---------|---------|------|
| **性能需求** | | | |
| 本地操作<100ms | NFR1 | Tauri IPC + 本地SQLite | ✅ |
| 云端<3s | NFR2 | RESTful API + WebSocket | ✅ |
| AI对话首字<2s | NFR3 | LLM Adapter优化 | ✅ |
| OCR<5s/页 | NFR4 | PaddleOCR本地服务 | ✅ |
| 内存<500MB | NFR5 | Rust后端 + 轻量前端 | ⚠️ 实现验证 |
| **Agent性能指标** | | | |
| 记忆向量检索<200ms | NFR8-1 | Qdrant本地嵌入式 | ✅ |
| 知识库混合检索<500ms | NFR8-2 | 向量+BM25融合 | ✅ |
| 错题集规则注入<50ms | NFR8-3 | 内存缓存+异步加载 | ✅ |
| Agent循环检测<10ms | NFR8-5 | 实时检测算法 | ✅ |
| 敏感操作确认<100ms | NFR8-7 | 前端弹出组件 | ✅ |
| **安全需求** | | | |
| TLS 1.3传输加密 | NFR9 | 传输加密 | ✅ |
| AES-256存储加密 | NFR10 | 存储加密 | ✅ |
| 个人记忆数据隔离 | NFR16-1 | 用户级隔离 | ✅ |
| 错题集数据隔离 | NFR16-3 | 用户ID隔离 | ✅ |
| **可靠性需求** | | | |
| 系统可用性>99.5% | NFR17 | 部署策略 | ⚠️ 运维保障 |
| Agent任务成功率>95% | NFR23-1 | 重试+断点恢复 | ✅ |
| 循环检测准确率>99% | NFR23-2 | 多模式检测 | ✅ |
| 敏感操作拦截率100% | NFR23-5 | 黑名单+敏感配置 | ✅ |
| **可扩展性需求** | | | |
| 单租户≥500用户 | NFR24 | 架构设计 | ✅ |
| 系统≥100租户 | NFR25 | 多租户架构 | ✅ |
| 个人记忆≥10万条 | NFR28-1 | Qdrant分片 | ✅ |
| 错题集≥1000条 | NFR28-2 | SQLite+向量 | ✅ |

**关键能力补充:**

| 能力 | 方案 | 状态 |
|------|------|------|
| OCR识别 | PaddleOCR本地服务 | ✅ 已确定 |
| 向量存储 | Qdrant（本地嵌入式/云端） | ✅ 已确定 |
| 文件存储 | 本地 + 云端OSS | ✅ 已确定 |
| 消息推送 | WebSocket + 离线队列 | ✅ 已确定 |
| 黑名单机制 | 三级架构 + 通配符匹配 | ✅ 已确定 |
| 可观测性 | 本地SQLite + 租户级统计 | ✅ 已确定 |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- 核心技术栈版本：全部指定 ✅
- 数据库架构：PostgreSQL + SQLite ✅
- API设计：RESTful + WebSocket ✅
- 安全机制：认证、加密、权限 ✅
- 云端后端：Go + Gin ✅
- OCR方案：PaddleOCR ✅
- 向量数据库：4种可选 ✅
- 文件存储：本地 + OSS ✅

**Pattern Completeness:**
- 命名规范：全面覆盖 ✅
- 目录结构：完整定义 ✅
- 代码示例：各模式都有示例 ✅
- 反模式警告：提供错误示例 ✅

**Structure Completeness:**
- 项目结构：完整定义 ✅
- 组件边界：清晰划分 ✅
- API边界：明确指定 ✅
- 数据边界：完整定义 ✅

### Gap Analysis Results

**已解决的关键差距:**

| # | 原差距 | 解决方案 |
|---|--------|---------|
| 1 | 云端后端技术栈未明确 | Go (Gin框架) |
| 2 | OCR能力方案未定义 | PaddleOCR本地服务 |
| 3 | 向量数据库方案未定义 | 4种方案可选，前端配置 |
| 4 | 文件存储方案未明确 | 本地 + 云端OSS |
| 5 | 日志存储位置未定义 | 应用安装目录 `./logs/` |
| 6 | 配置文件格式未确定 | TOML格式 |
| 7 | 项目结构未保存 | 已添加完整结构 |

**无明显遗留差距**

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 项目上下文全面分析
- [x] 规模和复杂度评估
- [x] 技术约束识别
- [x] 跨切面关注点映射

**✅ Architectural Decisions**
- [x] 关键决策已文档化并指定版本
- [x] 技术栈完全指定
- [x] 集成模式已定义
- [x] 性能考量已处理

**✅ Implementation Patterns**
- [x] 命名规范已建立
- [x] 结构模式已定义
- [x] 通信模式已指定
- [x] 流程模式已文档化

**✅ Project Structure**
- [x] 完整目录结构已定义
- [x] 组件边界已建立
- [x] 集成点已映射
- [x] 需求到结构映射完成

**✅ Gap Solutions**
- [x] 云端后端技术栈已确定
- [x] OCR能力方案已定义
- [x] 向量数据库方案已定义
- [x] 文件存储方案已定义
- [x] 配置与日志方案已定义

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
1. 完整的技术栈定义，前后端云端全覆盖
2. 详细的实现模式，减少AI Agent实现冲突
3. 灵活的配置选项，支持多种向量数据库
4. 清晰的项目结构，便于团队协作

**Areas for Future Enhancement:**
1. 容器化部署方案（Post-MVP）
2. 第三方OAuth集成（可选扩展）
3. 性能监控仪表板（Post-MVP）
4. 多语言国际化支持（Post-MVP）

### Implementation Handoff

**AI Agent Guidelines:**
1. 严格遵循所有架构决策
2. 使用统一的实现模式
3. 遵守项目结构和边界
4. 参考本文档解决架构问题

**First Implementation Priority:**
```bash
# 项目初始化命令
npm create tauri-app@latest ai-automated-office
# 选择: TypeScript/JavaScript → pnpm → React → TypeScript

cd ai-automated-office
pnpm add zustand @tanstack/react-query lucide-react
npx shadcn@latest init
pnpm tauri add sqlite
```


## ?????? AI ????????????

### ????

??????? AI ???????????????????????????????????????????????? Agent Runtime????????????????????????????????

### ????

1. ?????????????????????????????????????
2. ??????????AI ???????????????? `tenant + object` ?????
3. ???????????????? schema ??????????????????????
4. AI ??????????????? schema ????????????????????????
5. ????? AI ???????????????

### ??????

| ?? | ?? |
|------|------|
| Field Definition Store | ????????????????????? |
| Field Scenario Config Store | ???????????????????????????? |
| AI Field Policy Store | ????? AI ????????????????? |
| Dynamic Field Renderer | ???????????? schema ???? |
| AI Context Assembler | ? AI ???????????? schema ???? |
| Audit Logger | ????? AI ???? |

### ?????

1. AI ???? `ai_enabled=true` ?????????????
2. ?????????????AI ???????
3. ??????????????? AI ???????
4. ???????????????????????? schema ???

### ??? ADR ???

?????????????????

- ADR-018??????????????
- ADR-036?????????? schema + ???? + ???????
- ADR-037??????????????????

### ??????

1. ??????????????????????????????? schema?
2. ??????? Agent Runtime ???????? AI ?????
3. ??????????????????????????????
4. ???????????????
