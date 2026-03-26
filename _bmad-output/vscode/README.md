# VSCode (Code - OSS) PRD 文档索引

## 文档概览

本文档集合为 **Visual Studio Code - Open Source (Code - OSS)** 项目的完整产品需求文档（PRD），基于源代码 v1.113.0 分析生成。

---

## 文档列表

### 1. vscode-oss-prd.md - 主 PRD 文档

**描述：** 完整的产品需求文档，包含执行摘要、项目分类、成功标准、产品范围、用户旅程、技术需求、功能需求和非功能需求。

**主要内容：**
- Executive Summary（执行摘要）
- Project Classification（项目分类）
- Success Criteria（成功标准）
- Product Scope（产品范围）
- User Journeys（用户旅程）
- Technical Requirements（技术需求）
- Functional Requirements（功能需求）- 13个模块，100+功能点
- Non-Functional Requirements（非功能需求）
- Appendix（附录）

**适用场景：**
- 理解 VSCode 产品定位和功能范围
- 项目立项和需求确认
- 功能优先级排序
- 跨团队沟通

---

### 2. vscode-oss-architecture.md - 技术架构文档

**描述：** 详细的技术架构分析文档，涵盖系统架构、分层设计、扩展系统、服务定位与依赖注入、工作台布局、命令系统、配置系统、主题系统、文件系统、调试架构、Git 集成、终端架构、遥测系统和存储系统。

**主要内容：**
- 多进程架构详解
- 分层架构（Base → Platform → Workbench → Editor）
- 扩展系统架构
- 服务定位与依赖注入
- 工作台布局系统
- 命令系统
- 配置系统
- 主题系统
- 文件系统
- 调试架构
- Git 集成
- 终端架构
- 遥测系统
- 存储系统

**适用场景：**
- 深入理解 VSCode 技术实现
- 扩展开发
- 故障排查
- 系统集成

---

### 3. vscode-oss-functional-spec.md - 功能需求详述

**描述：** 各功能模块的详细规格说明，包括编辑器核心、文件管理、工作区配置、搜索系统、调试功能、终端、Git 集成、扩展系统、主题系统、辅助功能、远程开发、Notebook 支持和 AI 集成。

**主要内容：**
- FR-001: 编辑器核心功能（语法高亮、智能补全、代码折叠等）
- FR-002: 文件管理（资源管理器、多标签、编辑器组）
- FR-003: 工作区与配置
- FR-004: 搜索系统
- FR-005: 调试功能
- FR-006: 集成终端
- FR-007: Git 集成
- FR-008: 扩展系统
- FR-009: 主题系统
- FR-010: 辅助功能
- FR-011: 远程开发
- FR-012: Notebook 支持
- FR-013: AI 集成

**适用场景：**
- 功能开发详细设计
- 测试用例编写
- 用户手册编写
- 功能验收标准

---

### 4. vscode-oss-data-model.md - 数据模型与存储

**描述：** VSCode 数据存储架构的详细分析，包括用户数据模型、工作区存储、扩展数据模型、历史记录、Git 相关数据、调试配置等。

**主要内容：**
- 数据存储概述
- 用户数据模型（settings.json、keybindings.json 等）
- 工作区存储（SQLite state.vscdb、storage.json）
- 扩展数据模型
- 历史记录
- Git 相关数据
- 调试配置（launch.json、tasks.json）
- 用户配置继承
- 状态持久化
- 备份与恢复

**适用场景：**
- 数据迁移
- 扩展开发数据存储设计
- 故障恢复
- 数据分析

---

### 5. vscode-oss-user-journeys.md - 用户旅程与交互流程

**描述：** 详细的用户旅程分析和交互流程说明，包括核心交互流程、视图与面板、快捷键映射、通知与反馈、状态栏信息、上下文菜单等。

**主要内容：**
- Journey 1: 日常代码编辑（详细7阶段流程）
- Journey 2: 扩展探索
- Journey 3: GitHub PR 协作
- Journey 4: 远程开发
- 命令面板交互流程
- 快速打开流程
- 调试启动流程
- 视图与面板详解
- 快捷键映射（文件/编辑/导航/调试/视图）
- 通知与反馈
- 状态栏信息
- 上下文菜单

**适用场景：**
- UX 设计参考
- 用户培训
- 产品演示
- 支持文档编写

---

## 文档关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        vscode-oss-prd.md                        │
│                     (主 PRD 文档 - 入口)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ vscode-oss-       │ │ vscode-oss-        │ │ vscode-oss-        │
│ architecture.md   │ │ functional-spec.md │ │ user-journeys.md   │
│                   │ │                    │ │                   │
│ 技术架构          │ │ 功能需求详述        │ │ 用户旅程与交互      │
│ (深入理解实现)     │ │ (功能规格说明)      │ │ (UX/交互)          │
└───────────────────┘ └────────────────────┘ └───────────────────┘
        │
        ▼
┌───────────────────┐
│ vscode-oss-       │
│ data-model.md     │
│                   │
│ 数据模型与存储     │
│ (数据层面)         │
└───────────────────┘
```

---

## 快速导航

### 按角色查找

| 角色 | 推荐文档 |
|------|----------|
| 产品经理 | vscode-oss-prd.md (主文档) |
| 项目经理 | vscode-oss-prd.md, vscode-oss-functional-spec.md |
| 前端/桌面开发 | vscode-oss-architecture.md |
| 扩展开发者 | vscode-oss-architecture.md, vscode-oss-data-model.md |
| 测试工程师 | vscode-oss-functional-spec.md |
| UX/UI 设计 | vscode-oss-user-journeys.md |
| 技术文档 | vscode-oss-architecture.md, vscode-oss-functional-spec.md |
| 培训讲师 | vscode-oss-user-journeys.md, vscode-oss-prd.md |

### 按任务查找

| 任务 | 推荐文档 |
|------|----------|
| 理解产品功能 | vscode-oss-prd.md (Executive Summary + Product Scope) |
| 技术选型 | vscode-oss-prd.md (Technical Requirements) |
| 系统设计 | vscode-oss-architecture.md |
| 功能设计 | vscode-oss-functional-spec.md |
| 数据建模 | vscode-oss-data-model.md |
| 用户研究 | vscode-oss-user-journeys.md |
| 编写测试用例 | vscode-oss-functional-spec.md |
| 故障排查 | vscode-oss-architecture.md, vscode-oss-data-model.md |

---

## 版本信息

| 文档 | 版本 | 日期 | 状态 |
|------|------|------|------|
| vscode-oss-prd.md | 1.0 | 2026-03-26 | 完成 |
| vscode-oss-architecture.md | 1.0 | 2026-03-26 | 完成 |
| vscode-oss-functional-spec.md | 1.0 | 2026-03-26 | 完成 |
| vscode-oss-data-model.md | 1.0 | 2026-03-26 | 完成 |
| vscode-oss-user-journeys.md | 1.0 | 2026-03-26 | 完成 |

---

## 维护说明

- 本文档集合基于 Code - OSS v1.113.0 源代码分析生成
- 如有代码变更，请重新分析并更新相应文档
- 建议每季度审查一次文档与实际功能的差异

---

*最后更新: 2026-03-26*
