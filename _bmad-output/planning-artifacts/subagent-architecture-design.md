# 部门化 Subagent 架构设计

> **ADR-059**: 部门化 Subagent 架构：插件即 Agent Bundle，采用角色×部门×能力三维权限矩阵
>
> **状态**: 草稿
> **日期**: 2026-04-03
> **决策者**: PAN

---

## 目录

1. [设计背景](#1-设计背景)
2. [核心设计理念](#2-核心设计理念)
3. [架构总览](#3-架构总览)
4. [Agent 类型体系](#4-agent-类型体系)
5. [权限域设计](#5-权限域设计)
6. [Agent 路由与委派](#6-agent-路由与委派)
7. [Plugin = Subagent Bundle](#7-plugin--subagent-bundle)
8. [权限配置管理](#8-权限配置管理)
9. [协作模式](#9-协作模式)
10. [与现有架构的对齐](#10-与现有架构的对齐)
11. [实施路线图](#11-实施路线图)

---

## 1. 设计背景

### 1.1 问题陈述

当前系统面临以下挑战：

1. **工具膨胀问题**：随着业务扩展，Agent 的工具数量持续增长，导致：
   - 工具描述上下文过长，影响 LLM 理解
   - 工具选择准确率下降
   - 模型推理成本增加

2. **权限耦合问题**：
   - 主 Agent 需要理解所有业务逻辑
   - 权限检查逻辑分散在各处
   - 部门间权限边界模糊

3. **模型成本问题**：
   - 简单任务（如发票 OCR）使用大模型，成本浪费
   - 无法根据任务复杂度选择合适的模型

### 1.2 设计灵感

本设计参考了以下开源项目：

| 项目 | 借鉴点 |
|------|---------|
| kilocode | Subagent 分类体系、小模型路由、Orchestrator 编排模式 |
| Claude Code | Hidden Agent（标题生成、摘要压缩）的自动触发 |
| Cursor | 主 Agent + Subagent 的权限隔离 |

### 1.3 核心洞察

> **插件 = Subagent Bundle**：每个部门插件不再只是工具集合，而是包含独立 Agent 能力的完整 Bundle。

这与产品的核心定位完全一致：
- 部门是业务边界、权限边界、数据边界
- 部门差异体现在 Tools/Skills/MCP、知识库、模板、权限上
- 跨部门协作通过主 Agent 编排完成

---

## 2. 核心设计理念

### 2.1 插件即 Subagent

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Plugin = Subagent Bundle                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         finance-plugin/                              │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  │   │
│  │  │    UI      │  │   Tools   │  │   Skills  │  │   MCP   │  │   │
│  │  │  (界面)   │  │  (工具)   │  │  (技能)   │  │  (协议) │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │   │
│  │        │              │              │              │              │   │
│  │        └──────────────┴──────────────┴──────────────┘              │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │                     ┌──────────────┐                                 │   │
│  │                     │  Finance     │                                 │   │
│  │                     │  Subagent    │                                 │   │
│  │                     │  • 角色设定   │                                 │   │
│  │                     │  • 工具绑定   │                                 │   │
│  │                     │  • 权限策略   │                                 │   │
│  │                     │  • 模型配置   │                                 │   │
│  │                     └──────────────┘                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 职责分离

| Agent 类型 | 职责 | 工具范围 |
|------------|------|----------|
| **Primary Agent** | 意图理解、路由编排、权限兜底、跨部门协调 | 通用工具 + task 工具 |
| **Department Subagent** | 专注本部门业务逻辑 | 部门专属工具 |
| **Hidden Agent** | 系统任务（标题、摘要、压缩） | 无工具 |

### 2.3 模型分层

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         模型分层架构                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  主模型（Primary Model）                                                     │
│  ├── 用途：复杂分析、报表生成、多步骤推理                                   │
│  ├── 模型：Claude Sonnet、GPT-4o、DeepSeek 等高性能模型                    │
│  └── 工具：全量工具                                                       │
│                                    │                                        │
│                                    ▼                                        │
│  轻量模型（Light Model）                                                    │
│  ├── 用途：发票 OCR、简单查询、意图分类                                     │
│  ├── 模型：Claude Haiku、GPT-4o-mini 等成本优化模型                         │
│  └── 工具：轻量工具子集                                                   │
│                                                                             │
│  小模型（Small Model）                                                     │
│  ├── 用途：上下文压缩、摘要生成、会话标题                                   │
│  ├── 模型：厂商提供的小模型或专用压缩模型                                   │
│  └── 工具：无工具（纯生成）                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 架构总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    AI-Automated-office Agent 架构 v2                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户会话层                                                                │
│  └── 统一对话入口 + 权限上下文                                            │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Primary Agent (主 Agent)                           │   │
│  │  ┌──────────────┬──────────────┬──────────────┬──────────────────┐  │   │
│  │  │    code     │    ask      │ orchestrator │     general      │  │   │
│  │  │  (通用编码) │   (问答)    │   (编排)     │    (并行任务)    │  │   │
│  │  └──────────────┴──────────────┴──────────────┴──────────────────┘  │   │
│  │                                                                       │   │
│  │  职责：                                                              │   │
│  │  • 理解用户意图（NLU 分类）                                          │   │
│  │  • 判断是否需要委派给部门 Subagent                                    │   │
│  │  • 编排和协调多个 Subagent                                            │   │
│  │  • 处理跨部门协作                                                    │   │
│  │  • 权限兜底检查                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼ (task tool 委派)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                 Department Subagents (部门 Subagent)                     │   │
│  │                                                                       │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────┐  │   │
│  │  │   HR    │ │  Sales  │ │Finance  │ │Warehouse│ │Approval │ │ ... │  │   │
│  │  │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │ │  Agent  │ │     │  │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────┘  │   │
│  │                                                                       │   │
│  │  每个部门 Agent 只做本部门的事：                                      │   │
│  │  • HR Agent：员工管理、考勤、入职离职                               │   │
│  │  • Sales Agent：客户、报价、合同、订单                               │   │
│  │  • Finance Agent：发票、报销、对账、报表                             │   │
│  │  • Warehouse Agent：入库、出库、库存                                 │   │
│  │  • Approval Agent：审批流程、审批节点                                 │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Agent 类型体系

### 4.0 Agent 两级分类概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Agent 两级分类体系                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Department Agent（部门级 Agent）                       │   │
│  │  ────────────────────────────────────────────────────────────────────│   │
│  │  • 属于插件的一部分，随插件安装                                    │   │
│  │  • 管理员统一配置，部门内所有用户共享                              │   │
│  │  • 数据存储：云端 + 本地同步                                       │   │
│  │  • 权限矩阵：角色 × 部门 × 能力（三维)                            │   │
│  │  • 用途：标准化部门业务处理                                       │   │
│  │  • 示例：财务 Subagent、销售 Subagent、HR Subagent               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Personal Agent（用户级 Agent）                       │   │
│  │  ────────────────────────────────────────────────────────────────────│   │
│  │  • 用户自行创建，仅供本人使用                                       │   │
│  │  • 本地存储，不同步到云端（除非用户主动分享）                       │   │
│  │  • 权限继承自主 Agent（在用户权限范围内）                        │   │
│  │  • 用途：个人特殊场景定制，提升个人工作效率                       │   │
│  │  • 示例：销售人员的"竞品分析 Subagent"                          │   │
│  │        程序员的"代码审查 Subagent"                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.0.1 两级 Agent 对比

| 维度 | Department Agent | Personal Agent |
|------|------------------|---------------|
| **创建者** | 管理员/插件 | 用户本人 |
| **使用范围** | 部门内所有用户共享 | 仅创建者本人 |
| **数据存储** | 云端 + 本地同步 | 仅本地 |
| **权限来源** | 部门 × 角色 × 能力矩阵 | 继承主 Agent 权限 |
| **配置入口** | 管理员后台 / 插件 manifest | 用户设置页面 |
| **可见性** | 管理员可见全部 | 仅创建者可见 |
| **生命周期** | 随插件安装/卸载 | 用户自行管理 |
| **典型用途** | 标准化部门业务流程 | 个人效率工具定制 |

### 4.0.2 Personal Agent 与 PRD FR890-FR914 的对应

| PRD 需求 | 对应功能 |
|----------|----------|
| FR890 | 用户创建新的 Personal Sub-Agent |
| FR891-FR892 | 编辑/删除 Personal Sub-Agent |
| FR893 | 启用/禁用 Personal Sub-Agent |
| FR894-FR895 | 复制/查看 Personal Sub-Agent 列表 |
| FR896 | 设置调用优先级 |
| FR897-FR898 | 管理员创建模板 / 用户从模板创建 |
| FR899-FR900 | 导入导出 / 预置模板 |
| FR905-FR912 | 角色提示词、触发条件、模型选择 |
| FR913-FR914 | AI 辅助生成提示词 |

### 4.1 Agent 分类总表

| 类型 | Agent 名称 | 用途 | 模型选择 | 工具范围 | 存储位置 |
|------|-----------|------|----------|----------|----------|
| **Primary** | code | 默认主 Agent | 主模型 | 通用工具 + task | 云端+本地 |
| | ask | 纯问答（无写操作） | 主模型 | 只读工具 | 云端+本地 |
| | orchestrator | 复杂任务编排 | 主模型 | 禁止写操作 | 云端+本地 |
| | general | 并行多步骤任务 | 主模型 | 通用工具 | 云端+本地 |
| **Department** | hr | 人事业务 | 主/轻量 | HR 专属工具 | 云端+本地 |
| | sales | 销售业务 | 主/轻量 | Sales 专属工具 | 云端+本地 |
| | finance | 财务业务 | 主/轻量 | Finance 专属工具 | 云端+本地 |
| | warehouse | 仓储业务 | 主/轻量 | Warehouse 专属工具 | 云端+本地 |
| | approval | 审批业务 | 主/轻量 | Approval 专属工具 | 云端+本地 |
| | ... | 其他部门 | ... | ... | ... |
| **Personal** | user_{uuid} | 用户自建 Agent | 用户选择 | 用户选择 | 仅本地 |
| **Hidden** | title | 生成会话标题 | 小模型 | 无工具 | 云端+本地 |
| | summary | 生成会话摘要 | 小模型 | 无工具 | 云端+本地 |
| | compaction | 上下文压缩 | 主模型 | 无工具 | 云端+本地 |

### 4.2 Primary Agent 详解

#### code Agent（默认主 Agent）

```yaml
name: code
mode: primary
description: 默认主 Agent，执行工具操作并协调部门 Subagent

tools:
  # 通用工具
  - read, glob, grep, list
  - web_search, web_fetch
  - message_query, message_send
  - knowledge_query
  - workspace_stage_change
  
  # 委派工具（核心！）
  - task: allow  # 允许委派给 Subagent

permissions:
  # 默认允许
  - read: allow
  - glob, grep: allow
  - message_*: allow
  - knowledge_*: allow
  
  # 默认禁止（防止主 Agent 绕过 Subagent）
  - hr_*: deny
  - sales_*: deny
  - finance_*: deny
  - warehouse_*: deny
  - approval_*: deny
```

#### orchestrator Agent（编排 Agent）

```yaml
name: orchestrator
mode: primary
description: 协调复杂任务，通过委派给多个部门 Subagent 并行执行

tools:
  # 只允许读取和委派
  - read: allow
  - grep, glob: allow
  - list: allow
  - web_search, web_fetch: allow
  - question: allow  # 追问用户
  - task: allow     # 核心：委派给 Subagent

permissions:
  # 强制禁止直接写操作
  - bash: deny
  - write, edit: deny
  - hr_mutate: deny
  - sales_mutate: deny
  - finance_mutate: deny
  - warehouse_mutate: deny
  
  # 只允许委派
  - task: allow
```

#### ask Agent（问答 Agent）

```yaml
name: ask
mode: primary
description: 纯问答 Agent，不执行任何写操作

tools:
  # 只读工具
  - read: allow
  - grep, glob: allow
  - list: allow
  - web_search, web_fetch: allow
  - question: allow
  - knowledge_query: allow
  - hr_query: allow      # 部门查询
  - sales_query: allow
  - finance_query: allow

permissions:
  # 全部禁止
  - "*": deny
  - read, grep, glob: allow  # 例外：只读
```

### 4.3 Department Subagent 详解

#### Finance Subagent 示例

```yaml
name: finance
mode: department
plugin: finance

# 模型配置
models:
  primary: "claude-sonnet-4-5"
  light: "claude-haiku-4-5"
  small: "claude-haiku-4-5"

# 权限分级
role_permissions:
  staff:
    tools:
      - finance_query:
          scope: personal_expense
          fields: [id, amount, status, date, description]
      - finance_ocr:
          enabled: true
          max_daily: 10
          invoice_types: [普通发票, 增值税普通发票]
      - finance_mutate:
          allowed_actions: [submit_expense]
          max_amount: 5000
    
  specialist:
    tools:
      - finance_query:
          scope: department
          fields: [id, amount, status, date, description, applicant, department]
      - finance_ocr:
          enabled: true
          max_daily: 100
      - finance_mutate:
          allowed_actions: [approve, reject, adjust]
      - finance_aggregate:
          enabled: true
          aggregations: [sum, avg, count, group_by]
      - finance_export:
          enabled: true
          formats: [excel, pdf]
    
  manager:
    tools:
      - finance_query:
          scope: all
      - finance_aggregate:
          all: true
      - finance_mutate:
          all: true
      - finance_export:
          all: true
          formats: [excel, pdf, csv]
      - finance_report:
          enabled: true
          report_types: [monthly, quarterly, annual]
    
  executive:
    tools:
      - finance_query:
          scope: executive
          include_sensitive: true
      - finance_aggregate:
          all: true
          include_salary: true
      - finance_forecast:
          enabled: true
          features: [cash_flow, revenue, cost_analysis]
      - finance_dashboard:
          enabled: true
          kpis: [profit, loss, cash_flow, debt_ratio]
```

### 4.4 Personal Subagent 详解（用户级 Agent）

> **设计背景**：Personal Subagent 允许用户创建个人专用的 Agent，不属于任何部门插件，完全由用户自行配置和管理。数据存储在本地，仅供用户本人使用。典型场景包括：销售人员的"竞品分析 Subagent"、程序员的"代码审查 Subagent"、HR 的"面试安排 Subagent" 等。

#### 4.4.1 Personal Agent 与 Department Agent 的核心区别

| 维度 | Department Agent | Personal Agent |
|------|------------------|----------------|
| **创建者** | 管理员 / 插件开发者 | 普通用户 |
| **配置入口** | 管理员后台 / 插件 manifest | 用户设置页面 |
| **使用范围** | 部门内所有用户共享 | 仅创建者本人 |
| **数据存储** | 云端 + 本地同步 | 仅本地 SQLite |
| **权限来源** | 部门 × 角色 × 能力矩阵 | 继承主 Agent 权限（上限裁剪） |
| **可见性** | 管理员可见全部 | 仅创建者可见 |
| **生命周期** | 随插件安装/卸载 | 用户自行管理 |
| **可被主 Agent 委派** | 是（管理员配置） | 是（用户配置） |
| **可调用 Department Agent** | 是（通过主 Agent） | 是（通过主 Agent 路由） |
| **数据隔离** | 部门级数据边界 | 用户个人数据边界 |

#### 4.4.2 Personal Agent 配置结构

```yaml
# Personal Agent 配置示例
name: "我的竞品分析助手"
description: "专门用于分析竞争对手产品和市场动态"

# 模型选择（用户可选）
model:
  provider: "deepseek"          # 可选：openai / zhipu / dashscope / deepseek
  model: "deepseek-chat"
  temperature: 0.7
  max_tokens: 4096

# 角色提示词
prompt: |
  ## 角色定义
  你是一名专业的竞品分析顾问，擅长收集、整理和分析竞争对手的产品信息。
  
  ## 核心能力
  - 搜索和抓取竞品公开信息
  - 整理竞品功能对比表
  - 生成竞品分析报告
  
  ## 工作原则
  - 数据必须来源于可信渠道
  - 客观呈现事实，不带主观判断
  - 定期更新分析内容

# 调用描述（供主 Agent 路由参考）
invoke:
  description: "当用户需要分析竞争对手产品、生成竞品对比报告时调用"
  keywords: ["竞品", "竞争对手", "市场分析", "产品对比"]
  trigger_conditions:
    - intent: "competitor_analysis"
    - entities: ["competitor", "market"]

# 工具权限（从主 Agent 权限范围内选择）
tools:
  # 允许的工具
  - web_search: allow
  - web_fetch: allow
  - knowledge_query: allow
  - read: allow
  - message_query: allow
  
  # 禁止的工具（即使主 Agent 有权限）
  - bash: deny
  - write: deny
  - edit: deny
  - finance_*: deny
  - hr_*: deny

# 知识库范围
knowledge:
  sources:
    - "user_personal_knowledge"  # 用户个人知识库
    - "company_public_knowledge" # 企业公共知识库（需管理员授权）

# 触发方式
trigger:
  mode: "manual"                # manual: 手动触发 | auto: 自动路由 | hybrid: 混合
  priority: 5                  # 优先级 1-10，数字越大优先级越高

# 调用限制
limits:
  max_steps: 20
  max_concurrent: 1
  timeout_seconds: 300
```

#### 4.4.3 Personal Agent 权限继承机制

Personal Agent 的权限始终受限于创建者的主 Agent 权限：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Personal Agent 权限继承模型                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  创建者主 Agent 权限上限                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 工具: [web_search, web_fetch, knowledge_query, hr_query,           │   │
│  │       sales_query, finance_query, read, message_*]                  │   │
│  │ 数据范围: HR部门(员工档案)、销售部门(客户)、财务部门(发票)             │   │
│  │ 模型: deepseek-chat                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  用户创建 Personal Agent 时，只能从中选择子集                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Personal Agent 实际权限:                                             │   │
│  │ 工具: [web_search, web_fetch, knowledge_query, read]  ← 子集         │   │
│  │ 数据范围: 无业务数据权限（仅公共知识库）                              │   │
│  │ 模型: 用户选择的模型                                                 │   │
│  │                                                                      │   │
│  │ ⚠️ 禁止选择:                                                        │   │
│  │   - hr_*, sales_*, finance_* （业务部门工具）                        │   │
│  │   - bash, write, edit （高风险操作）                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.4 Personal Agent 的典型场景

| 场景 | Personal Agent 名称 | 工具选择 | 触发关键词 |
|------|---------------------|----------|-----------|
| 竞品分析 | 竞品分析助手 | web_search, web_fetch, knowledge_query | "竞品分析"、"竞争对手" |
| 代码审查 | 代码审查助手 | read (代码文件), knowledge_query (代码规范) | "审查代码"、"检查bug" |
| 面试安排 | HR面试助手 | calendar_query, message_send, knowledge_query | "安排面试"、"候选人" |
| 合同审核 | 合同审核助手 | document_read, knowledge_query (法律知识库) | "审核合同"、"法律风险" |
| 数据报告 | 数据报告助手 | db_query (只读), export, knowledge_query | "生成报告"、"数据汇总" |

#### 4.4.5 Personal Agent 的生命周期

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Personal Agent 生命周期                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 创建                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 用户在「设置 → Agent → 我的 Agent → 新建」中创建                    │   │
│  │ 配置：名称、提示词、工具、触发条件                                   │   │
│  │ 存储：本地 SQLite (user_agents 表)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  2. 使用                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 手动触发：用户选择特定 Agent 执行任务                               │   │
│  │ 自动路由：主 Agent 识别到匹配关键词，自动委派                        │   │
│  │ 独立会话：每个 Personal Agent 运行在隔离的子会话中                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  3. 编辑                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 用户可随时修改 Agent 配置                                           │   │
│  │ 支持版本历史：记录最近 10 次配置变更                                │   │
│  │ 支持导入导出：分享配置给其他用户                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  4. 删除                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 用户删除 Agent                                                      │   │
│  │ 系统清理：配置 + 会话历史 + 记忆数据                                │   │
│  │ ⚠️ 删除前需用户确认，删除后不可恢复                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 4.4.6 Personal Agent 的路由机制

Personal Agent 被主 Agent 路由时，采用以下优先级：

```
路由优先级（从高到低）:
1. 显式选择：用户明确指定使用某个 Personal Agent
2. 关键词匹配：主 Agent 检测到 Agent 定义的 trigger.keywords
3. 意图分类：主 Agent 识别到特定 intent，匹配 trigger.intent
4. 上下文推断：根据当前对话上下文推断最适合的 Agent
5. 默认 fallback：主 Agent 自行处理
```

#### 4.4.7 Personal Agent 与 Department Agent 的协作

Personal Agent 不能直接调用 Department Agent，必须通过主 Agent 中转：

```
用户请求: "帮我分析一下A客户的销售数据，并识别发票风险"

     │
     ▼
┌─────────────┐
│  主 Agent   │
│ (Orchestr.) │
└─────────────┘
     │
     ├── 路由到 Personal Agent "销售数据分析助手"
     │        │
     │        └── 分析销售数据需求
     │            │
     │            ▼
     │      主 Agent 识别到需要发票数据
     │            │
     │            ▼
     │      委派给 Department Agent "finance"
     │            │
     │            └── 查询发票数据（受权限约束）
     │            │
     │            ▼
     │      返回发票数据给 Personal Agent
     │            │
     │            ▼
     │      Personal Agent 完成风险分析
     │
     ▼
返回分析结果给用户
```

---

## 5. 权限域设计

### 5.1 三层权限域模型

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        权限域三层架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Layer 1: 平台基础权限（Platform Base）                                    │
│  ─────────────────────────────────────────────────────────────────────────│
│  所有用户共享的基础能力                                                    │
│  ├── 消息收发：message_send, message_query                                │
│  ├── 知识库查询：knowledge_query                                          │
│  ├── 工作台：workspace_stage_change                                       │
│  └── 基础浏览：read, glob, grep                                          │
│                                                                             │
│                                    ▼                                        │
│                                                                             │
│  Layer 2: 部门能力权限（Department Capability）                              │
│  ─────────────────────────────────────────────────────────────────────────│
│  按部门插件安装和角色分配                                                  │
│  ├── HR Subagent：hr_query, hr_mutate, hr_aggregate                      │
│  ├── Finance Subagent：finance_query, finance_ocr, finance_aggregate        │
│  ├── Sales Subagent：sales_query, sales_mutate, sales_ocr                │
│  └── Warehouse Subagent：warehouse_query, warehouse_mutate                  │
│                                                                             │
│                                    ▼                                        │
│                                                                             │
│  Layer 3: 角色增强权限（Role Enhancement）                                  │
│  ─────────────────────────────────────────────────────────────────────────│
│  基于角色的额外能力扩展                                                    │
│  ├── 管理层：可访问汇总数据、跨部门数据、高管看板                         │
│  ├── 部门负责人：可访问部门全部数据、管理功能                               │
│  ├── 审计员：全量审计日志访问                                             │
│  └── 普通员工：受限数据范围、本人业务数据                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 权限计算公式

```
用户可用权限 = Platform_Base
             ∪ Department_Capability[用户部门][用户角色]
             ∪ Role_Enhancement[用户角色]
             ∖ 黑名单
```

### 5.3 字段级权限控制

```yaml
# 字段可见性配置
finance_query:
  field_visibility:
    # 所有人可见
    - id, amount, status, date, description, category
    
    # 仅专员及以上可见
    specialist+:
      - applicant_name
      - department
    
    # 仅经理及以上可见
    manager+:
      - bank_account
      - tax_amount
    
    # 仅高管可见
    executive:
      - salary
      - bonus
      - personal_tax

# 数据范围限制
data_scope:
  staff:
    rule: "personal_only"  # 仅本人数据
    field: "applicant_id"
    value: "current_user.id"
  
  specialist:
    rule: "department"     # 本部门数据
    field: "department_id"
    value: "current_user.department_id"
  
  manager:
    rule: "all"            # 全部数据
```

### 5.4 权限决策流程

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        权限决策流程                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户请求：finance_query({ amount: ..., date_range: ... })                    │
│                              │                                              │
│                              ▼                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 1: 基础权限检查                                              │   │
│  │  用户角色 = staff → 可用工具: [finance_query, finance_ocr]       │   │
│  │  ✗ 请求工具: finance_mutate → 直接拒绝                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 2: 字段权限检查                                              │   │
│  │  staff 可用字段: [id, amount, status, date, description]         │   │
│  │  请求字段: [amount, bank_account]                                  │   │
│  │  ✗ bank_account 不在允许列表 → 移除该字段                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 3: 数据范围检查                                             │   │
│  │  staff 数据范围: personal_only                                     │   │
│  │  自动注入: WHERE applicant_id = current_user.id                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Step 4: 执行并返回结果                                            │   │
│  │  SELECT id, amount, status, date, description                      │   │
│  │  FROM expense_report                                               │   │
│  │  WHERE applicant_id = 'user_123'                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Agent 路由与委派

### 6.1 意图分类引擎

```typescript
interface IntentClassifier {
  // 关键词匹配 + 语义分类
  classify(userMessage: string, context: UserContext): IntentResult;
}

interface IntentResult {
  intent: 'finance' | 'sales' | 'hr' | 'warehouse' | 'approval' | 'general';
  subIntent?: string;  // finance.ocr, finance.query, finance.report
  confidence: number;
  suggestedTools: string[];
  requiresSubagent: boolean;
}

// 分类规则示例
const intentRules = [
  {
    keywords: ['报销', '发票', '对账', '财务'],
    intent: 'finance',
    subIntents: {
      '发票.*识别|ocr|扫描': 'finance.ocr',
      '查询|看看|统计': 'finance.query',
      '报表|分析': 'finance.report',
    }
  },
  {
    keywords: ['客户', '订单', '报价', '合同'],
    intent: 'sales',
  },
  {
    keywords: ['员工', '入职', '考勤', '工资'],
    intent: 'hr',
  },
];
```

### 6.2 路由决策表

| 用户意图 | 路由目标 | 备用方案 | 所需权限 |
|----------|-----------|----------|----------|
| finance.ocr | finance_subagent (light) | error | finance_ocr |
| finance.query | finance_subagent | primary + knowledge | finance_query |
| finance.report | finance_subagent (primary) | error | finance_aggregate |
| sales.order | sales_subagent | primary + hr_check | sales_query |
| hr.onboard | hr_subagent | approval_flow | hr_mutate |
| cross.department | orchestrator | sequential_subagents | task |
| general.query | primary | - | read |

### 6.3 委派协议（Delegation Contract）

```typescript
interface DelegationContract {
  // 委派目标
  target: {
    subagent: string;      // finance, sales, hr, etc.
    intent?: string;       // 可选的意图限定
  };
  
  // 权限约束
  constraints: {
    allowedTools: string[];        // 允许使用的工具白名单
    deniedTools: string[];         // 禁止使用的工具黑名单
    dataScope: 'personal' | 'department' | 'all';
    maxSteps: number;              // 最大步数限制
    timeout: number;               // 超时时间（毫秒）
  };
  
  // 上下文传递
  context: {
    userMessage: string;           // 原始用户消息
    extractedEntities: object;     // 提取的实体（客户名、日期等）
    previousResults?: object[];   // 前置 Subagent 的结果
  };
  
  // 输出契约
  output: {
    format: 'text' | 'structured' | 'json';
    schema?: object;               // 期望的结构化输出 schema
  };
}

// 委派示例
const delegation: DelegationContract = {
  target: { subagent: 'finance', intent: 'finance.query' },
  constraints: {
    allowedTools: ['finance_query', 'finance_ocr'],
    deniedTools: ['finance_mutate', 'finance_export'],
    dataScope: 'department',
    maxSteps: 5,
    timeout: 30000,
  },
  context: {
    userMessage: '帮我看看销售部门上个月的报销情况',
    extractedEntities: {
      department: 'sales',
      dateRange: { start: '2024-03-01', end: '2024-03-31' },
    },
  },
  output: {
    format: 'text',
  },
};
```

### 6.4 轻量模型自动路由

```typescript
interface ModelRouter {
  // 根据任务复杂度选择模型
  selectModel(task: TaskContext): ModelConfig;
}

// 复杂度评估
const complexityRules = [
  {
    condition: (task) => 
      task.type === 'ocr' ||
      task.intent === 'classification' ||
      task.intent === 'simple_query',
    model: 'light',
    examples: ['发票识别', '简单查询', '意图分类']
  },
  {
    condition: (task) =>
      task.intent === 'report' ||
      task.intent === 'analysis' ||
      task.subagent === 'orchestrator',
    model: 'primary',
    examples: ['财务分析报表', '跨部门汇总']
  },
  {
    condition: (task) =>
      task.type === 'compression' ||
      task.type === 'summarization',
    model: 'small',
    examples: ['上下文压缩', '会话摘要']
  }
];

// 使用示例
const router = new ModelRouter();
const model = router.selectModel({
  type: 'ocr',
  intent: 'finance.ocr',
  subagent: 'finance'
});
// → { model: 'claude-haiku-4-5', temperature: 0.3 }
```

---

## 7. Plugin = Subagent Bundle

### 7.1 插件目录结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Plugin = Subagent Bundle 架构                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         finance-plugin/                              │   │
│  │                                                                       │   │
│  │  ├── manifest.json                    # 插件清单                      │   │
│  │  │   {                                                          │   │
│  │  │     id: "finance",                                           │   │
│  │  │     name: "财务部插件",                                       │   │
│  │  │     version: "1.0.0",                                       │   │
│  │  │     subagent: {                                              │   │
│  │  │       name: "finance",                                        │   │
│  │  │       description: "财务助手，处理发票、报销、对账等",         │   │
│  │  │       models: {                                               │   │
│  │  │         primary: "claude-sonnet-4",                         │   │
│  │  │         light: "claude-haiku",                                │   │
│  │  │         small: "claude-haiku"                                │   │
│  │  │       },                                                       │   │
│  │  │       rolePermissions: {  # 见 4.3 节                         │   │
│  │  │         ...                                                   │   │
│  │  │       }                                                       │   │
│  │  │     }                                                         │   │
│  │  │   }                                                          │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │  ├── agent/                                                              │   │
│  │  │   ├── config.yaml              # Agent 配置                      │   │
│  │  │   ├── prompt.txt               # 角色设定提示词                  │   │
│  │  │   └── skills/                                                       │   │
│  │  │       ├── invoice_ocr.skill.ts                                 │   │
│  │  │       ├── reconciliation.skill.ts                               │   │
│  │  │       └── report_generation.skill.ts                           │   │
│  │  │                                                                       │   │
│  │  ├── tools/                        # 工具定义                      │   │
│  │  │   ├── finance_query.ts                                          │   │
│  │  │   ├── finance_mutate.ts                                        │   │
│  │  │   ├── finance_aggregate.ts                                     │   │
│  │  │   ├── finance_action.ts                                        │   │
│  │  │   └── finance_export.ts                                        │   │
│  │  │                                                                       │   │
│  │  ├── mcp/                          # MCP 服务定义                 │   │
│  │  │   └── tax-service.ts           # 税务局 API 集成              │   │
│  │  │                                                                       │   │
│  │  ├── ui/                           # 插件 UI                       │   │
│  │  │   ├── components/                                                  │   │
│  │  │   │   ├── InvoiceUpload.tsx                                   │   │
│  │  │   │   └── ExpenseDashboard.tsx                                  │   │
│  │  │   └── pages/                                                          │   │
│  │  │       └── finance.tsx                                             │   │
│  │  │                                                                       │   │
│  │  ├── knowledge/                      # 领域知识                    │   │
│  │  │   ├── tax_rules.md                                                  │   │
│  │  │   └── invoice_guidelines.md                                     │   │
│  │  │                                                                       │   │
│  │  └── backend/                       # 后端逻辑                     │   │
│  │      ├── handlers/                                                       │   │
│  │      └── services/                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 manifest.json Subagent 配置详解

```json
{
  "id": "finance",
  "name": "财务部插件",
  "version": "1.0.0",
  "description": "财务部业务能力包，包含发票识别、报销审核、对账分析等",
  
  "subagent": {
    "name": "finance",
    "displayName": "财务助手",
    "description": "处理发票识别、报销审核、对账分析等财务任务",
    
    "models": {
      "primary": {
        "provider": "anthropic",
        "modelId": "claude-sonnet-4-5",
        "temperature": 0.7,
        "maxTokens": 8192
      },
      "light": {
        "provider": "anthropic",
        "modelId": "claude-haiku-4-5",
        "temperature": 0.3,
        "maxTokens": 4096
      },
      "small": {
        "provider": "anthropic",
        "modelId": "claude-haiku-4-5",
        "temperature": 0.5,
        "maxTokens": 1024
      }
    },
    
    "rolePermissions": {
      "staff": {
        "tools": ["finance_query", "finance_ocr"],
        "dataScope": "personal",
        "maxDailyOCR": 10
      },
      "specialist": {
        "tools": ["finance_query", "finance_ocr", "finance_mutate", "finance_aggregate", "finance_export"],
        "dataScope": "department",
        "maxDailyOCR": 100
      },
      "manager": {
        "tools": ["finance_query", "finance_ocr", "finance_mutate", "finance_aggregate", "finance_export", "finance_report"],
        "dataScope": "all",
        "maxDailyOCR": 500
      },
      "executive": {
        "tools": ["finance_query", "finance_ocr", "finance_mutate", "finance_aggregate", "finance_export", "finance_report", "finance_forecast", "finance_dashboard"],
        "dataScope": "executive",
        "maxDailyOCR": 1000
      }
    },
    
    "intentMapping": {
      "invoice.*ocr|ocr|扫描|识别": "ocr",
      "查询|看看|多少|统计": "query",
      "报销|提交": "mutate",
      "报表|分析|汇总": "report",
      "预测|趋势": "forecast"
    },
    
    "triggerPhrases": [
      "帮我看看报销",
      "识别一下发票",
      "这个月花了多少钱",
      "生成财务报告"
    ]
  },
  
  "capabilities": {
    "tools": 5,
    "skills": 3,
    "mcpServices": 1,
    "knowledgeBases": ["finance/policies", "finance/tax-rules"]
  },
  
  "dependencies": {
    "plugins": ["hr"],
    "optionalPlugins": []
  }
}
```

### 7.3 Agent 提示词模板

```markdown
<!-- agent/prompt.txt -->

# 角色设定

你是一个专业的财务助手，名称是"财务小助手"。
你帮助用户处理发票识别、报销审核、对账分析和财务查询等任务。

## 核心能力

1. **发票识别 (OCR)**
   - 支持增值税发票、普通发票、定额发票、电子发票
   - 自动提取：发票号码、金额、日期、税额、购买方、销售方
   - 发票验真：连接税务局 API 验证发票真伪

2. **报销处理**
   - 报销单提交、审批状态查询
   - 费用分类统计
   - 限额检查和提醒

3. **对账分析**
   - 银行对账
   - 应收应付分析
   - 月度/季度汇总

## 权限说明

你只能执行当前用户角色允许的操作：
- 普通员工：提交报销、查询本人报销
- 财务专员：审核报销、对账、部门统计
- 财务经理：全部功能、报表生成
- 高管：战略级财务洞察、预测分析

## 对话风格

- 简洁专业，直接回答用户问题
- 需要确认时主动询问
- 发现问题时及时提醒
- 复杂操作分步骤引导

## 禁止事项

- 不执行未经授权的操作
- 不透露其他用户的敏感信息
- 不绕过审批流程
```

---

## 8. 权限配置管理

### 8.1 管理员配置界面

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    权限配置管理界面设计                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  部门能力管理 → 财务部                                              │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Subagent 配置                                              │    │   │
│  │  │  ───────────────────────────────────────────────────────────│    │   │
│  │  │  名称：finance                                               │    │   │
│  │  │  显示名：财务助手                                             │    │   │
│  │  │  默认模型：Claude Sonnet 4                                    │    │   │
│  │  │  轻量模型：Claude Haiku（用于 OCR、简单查询）                 │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  工具权限矩阵                                                │    │   │
│  │  │  ───────────────────────────────────────────────────────────│    │   │
│  │  │                                                               │    │   │
│  │  │  工具              │ 普通员工 │ 财务专员 │ 财务经理 │ CFO   │    │   │
│  │  │  ─────────────────┼─────────┼─────────┼─────────┼───────│    │   │
│  │  │  finance_query    │   ✓     │    ✓    │    ✓    │   ✓   │    │   │
│  │  │  ├─ 数据范围        │ 本人    │  本部门  │  全部   │  全部 │    │   │
│  │  │  ├─ 字段            │ 基本    │   扩展   │   全部  │  全部 │    │   │
│  │  │  ───────────────────────────────────────────────────────────│    │   │
│  │  │  finance_ocr      │   ✓     │    ✓    │    ✓    │   ✓   │    │   │
│  │  │  ├─ 日限额         │   10    │   100   │   500   │  1000 │    │   │
│  │  │  ├─ 发票类型       │ 普通    │   所有   │   所有  │  所有 │    │   │
│  │  │  ───────────────────────────────────────────────────────────│    │   │
│  │  │  finance_mutate   │ 提交    │  审核    │   全部  │  全部 │    │   │
│  │  │  ├─ submit_expense │   ✓     │    ✓    │    ✓    │   ✓   │    │   │
│  │  │  ├─ approve       │   ✗     │    ✓    │    ✓    │   ✓   │    │   │
│  │  │  └─ adjust_account │   ✗     │    ✗    │    ✓    │   ✓   │    │   │
│  │  │  ───────────────────────────────────────────────────────────│    │   │
│  │  │  finance_forecast  │   ✗     │    ✗    │    ✓    │   ✓   │    │   │
│  │  │  finance_dashboard │   ✗     │    ✗    │    ✓    │   ✓   │    │   │
│  │  │                                                               │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │                                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 权限配置数据结构

```typescript
// 权限配置存储结构
interface PermissionConfig {
  tenantId: string;
  departmentId: string;
  
  // 部门 Subagent 配置
  subagent: {
    [subagentName: string]: {
      enabled: boolean;
      defaultRole: Role;
      
      // 工具权限矩阵
      toolPermissions: {
        [toolName: string]: {
          enabled: boolean;
          roles: {
            [role in Role]: {
              allowed: boolean;
              constraints?: ToolConstraints;
            };
          };
        };
      };
      
      // 字段权限
      fieldPermissions: {
        [toolName: string]: {
          [role in Role]: string[];  // 允许的字段列表
        };
      };
      
      // 数据范围限制
      dataScope: {
        [role in Role]: 'personal' | 'department' | 'all' | 'executive';
      };
    };
  };
}

// 工具约束
interface ToolConstraints {
  maxPerDay?: number;           // 每日最大调用次数
  maxAmount?: number;            // 最大金额限制
  allowedEntities?: string[];  // 允许操作的实体类型
  allowedFormats?: string[];     // 允许的导出格式
  rateLimit?: {
    requests: number;
    window: number;  // 毫秒
  };
}
```

---

## 9. 协作模式

### 9.1 Orchestrator 模式（复杂跨部门任务）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Orchestrator 协作流程示例                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户请求："帮我分析一下上个月各部门的费用支出情况"                          │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Primary Agent (Orchestrator)                                        │   │
│  │  意图分类：cross.department.query                                   │   │
│  │  路由决策：orchestrator                                              │   │
│  │  权限检查：用户 = 财务经理 → 可访问所有部门费用数据                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼ 并行委派                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                 │
│  │ finance_agent│  │  sales_agent │  │    hr_agent   │                 │
│  │ ─────────────│  │ ─────────────│  │ ─────────────│                 │
│  │ 工具: aggregate│  │ 工具: aggregate│  │ 工具: aggregate│                 │
│  │ 部门: finance │  │ 部门: sales  │  │ 部门: hr     │                 │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘                 │
│          │                  │                  │                           │
│          ▼                  ▼                  ▼                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                 │
│  │ 费用: ¥45.6万 │  │ 差旅: ¥12.3万 │  │ 人力: ¥89.5万 │                 │
│  │ 同比增长 8%   │  │ 同比下降 5%   │  │ 同比增长 3%   │                 │
│  └───────────────┘  └───────────────┘  └───────────────┘                 │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Orchestrator 汇总                                                │   │
│  │  ## 上月各部门费用分析                                             │   │
│  │                                                                       │   │
│  │  | 部门  | 费用    | 占比  | 同比   |                             │   │
│  │  |------|---------|-------|---------|                              │   │
│  │  | HR   | ¥89.5万 | 60%   | +3%    |                              │   │
│  │  | 财务  | ¥45.6万 | 31%   | +8%    |                              │   │
│  │  | 销售  | ¥12.3万 |  8%   | -5%    |                              │   │
│  │  | **总计** | **¥147.4万** | 100% | +2%  |                          │   │
│  │                                                                       │   │
│  │  建议：销售差旅费用控制良好，可关注财务部门的增长趋势                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Sequential 模式（流程性任务）

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Sequential 协作流程示例                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户请求："帮我处理这批发票识别和报销"                                    │
│                                                                             │
│  Step 1: Finance Agent (OCR)                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 输入：发票图片（5张）                                                │   │
│  │ 工具：finance_ocr (light model)                                    │   │
│  │ 输出：                                                              │   │
│  │ 1. 发票#001: ¥1,230.00 (增值税专用发票) ✓                        │   │
│  │ 2. 发票#002: ¥560.00 (增值税普通发票) ✓                          │   │
│  │ 3. 发票#003: 识别失败（图片模糊）需要重新上传                     │   │
│  │ 4. 发票#004: ¥890.00 (定额发票) ✓                                 │   │
│  │ 5. 发票#005: ¥2,100.00 (电子发票) ✓                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  Step 2: Finance Agent (Validation)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 发票验真：                                                          │   │
│  │ - 发票#001-005: 税务局验证通过 ✓                                 │   │
│  │                                                                       │   │
│  │ 报销规则检查：                                                       │   │
│  │ - 单笔限额 ¥5,000 → 发票#005需拆分 ✓                              │   │
│  │ - 发票类型: 全部合规 ✓                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  Step 3: Approval Flow (审批)                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ approval_action({                                                    │   │
│  │   action: "create",                                                 │   │
│  │   entity: "expense_report",                                         │   │
│  │   data: {                                                          │   │
│  │     total_amount: 4780.00,                                         │   │
│  │     items: [发票#001, #002, #004],                                │   │
│  │     applicant: current_user,                                        │   │
│  │     department: "sales",                                            │   │
│  │     status: "pending_approval"                                      │   │
│  │   }                                                                 │   │
│  │ })                                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  最终输出：报销单已创建，等待部门经理审批                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. 与现有架构的对齐

### 10.1 ADR 对齐

| ADR | 内容 | 与 ADR-059 的关系 |
|-----|------|------------------|
| ADR-018 | 字段级权限采用后台动态配置 | 继承，扩展到 Subagent 权限矩阵 |
| ADR-019 | 敏感操作确认采用聊天界面内弹出方式 | 继承，敏感操作触发审批门禁 |
| ADR-025 | 工具系统采用通用工具架构 | 补充，部门专用工具封装为 Subagent |
| ADR-052 | 权限控制采用三级动作模型 | 继承，在 Subagent 层面实现 |
| ADR-055 | Plan/Act 双配置模式 | 补充，主模型/轻量模型分层 |

### 10.2 与 Capability Supply Layer 的关系

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Capability Supply Layer 扩展                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Capability Registry                                 │   │
│  │  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │   │
│  │  │ Core Tools │   Skills    │    MCP      │ Department       │  │   │
│  │  │  (内置)     │  (内置)     │  Services   │ Plugins/Agents  │  │   │
│  │  └─────────────┴─────────────┴─────────────┴─────────────────┘  │   │
│  │                                                                       │   │
│  │  新增：                                                              │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │  Department Subagents                                      │    │   │
│  │  │  ├── hr_agent: { tools, skills, mcp, rolePermissions } │    │   │
│  │  │  ├── sales_agent: { ... }                               │    │   │
│  │  │  ├── finance_agent: { ... }                              │    │   │
│  │  │  └── ...                                                 │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.3 迁移策略

**Phase 1: 向后兼容**
- 保持现有工具系统不变
- 新增 Subagent 层，工具仍可被主 Agent 调用
- 权限检查优先于 Subagent 层

**Phase 2: 渐进收敛**
- 新增插件默认使用 Subagent 封装
- 旧有工具逐步迁移到 Subagent
- 主 Agent 逐步禁用直接调用部门工具

**Phase 3: 完整迁移**
- 所有部门业务通过 Subagent 执行
- 主 Agent 只保留编排和通用能力
- 工具系统完全通过 Subagent 暴露

---

## 11. 实施路线图

### Phase 1: MVP（1-2 周）

| 任务 | 描述 | 产出物 |
|------|------|---------|
| Subagent 框架 | 实现基础的 Subagent 类型和加载机制 | `subagent/mod.rs` |
| Finance Subagent | 创建财务 Subagent，包含基础工具 | `plugins/finance/agent/` |
| 权限基础 | 实现角色×部门权限矩阵 | `permission/matrix.rs` |
| 路由基础 | 实现意图分类和基础路由 | `agent/router.rs` |
| 集成测试 | 端到端测试 Finance Subagent | `tests/integration/finance/` |

### Phase 2: 核心部门（2-3 周）

| 任务 | 描述 | 产出物 |
|------|------|---------|
| HR Subagent | 人事 Subagent | `plugins/hr/agent/` |
| Sales Subagent | 销售 Subagent | `plugins/sales/agent/` |
| Warehouse Subagent | 仓储 Subagent | `plugins/warehouse/agent/` |
| Orchestrator | 跨部门编排 | `agent/orchestrator.rs` |
| 权限配置 UI | 管理员配置界面 | `pages/admin/permissions/` |

### Phase 3: 高级特性（3-4 周）

| 任务 | 描述 | 产出物 |
|------|------|---------|
| 轻量模型路由 | 根据任务复杂度选择模型 | `agent/model_router.rs` |
| Hidden Agents | 标题、摘要、压缩 Agent | `agent/hidden/` |
| 字段级权限 | 精细化字段控制 | `permission/field_level.rs` |
| 数据范围限制 | 行级数据隔离 | `permission/data_scope.rs` |
| 性能优化 | Subagent 缓存、预热 | `agent/subagent_cache.rs` |

### Phase 4: 生态完善（持续）

| 任务 | 描述 |
|------|------|
| Plugin SDK | Subagent 开发工具包 |
| 市场模板 | 预设的部门 Subagent 配置 |
| 监控治理 | Subagent 调用统计、健康度 |
| A/B 测试 | 不同路由策略的效果对比 |

---

## 附录

### A. 术语表

| 术语 | 定义 |
|------|------|
| Primary Agent | 主 Agent，负责用户交互和任务编排 |
| Department Subagent | 部门级 Subagent，处理特定业务域 |
| Hidden Agent | 系统级 Agent，处理辅助任务（标题、摘要） |
| Delegation Contract | 委派协议，定义 Subagent 的执行约束 |
| Role Permission | 角色权限，定义不同角色的能力边界 |
| Data Scope | 数据范围，限制 Subagent 可访问的数据 |

### B. 参考资料

1. kilocode Agent System: `packages/opencode/src/agent/agent.ts`
2. kilocode Session Processor: `packages/opencode/src/session/processor.ts`
3. kilocode Task Tool: `packages/opencode/src/tool/task.ts`
4. ADR-051 ~ ADR-058: 权限与配置相关决策

### C. 变更日志

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-04-03 | 1.0.0 | 初始版本 |
