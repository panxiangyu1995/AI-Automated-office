---
name: xianyu-task-openspec
description: 基于Epic/Story自动生成OpenSpec变更和task.json任务。使用此skill可以将epics.md中的Story转换为符合OpenSpec规范的变更，并同步更新task.json。特色：包含测试要点、实现类型标记、依赖追踪。当用户要求为特定Epic或Story生成变更时触发。
license: MIT
compatibility: 需要openspec CLI，需要项目存在epics.md和task.json
metadata:
  author: team
  version: "2.0"
  generatedBy: "xianyu-mvp"
---

# Task/OpenSpec 同步生成器

## 概述

此Skill用于根据 `_bmad-output/planning-artifacts/epics.md` 中的 Epic 和 Story 定义，使用 `openspec` CLI 工具生成符合 OpenSpec 规范的变更文档，并同步更新 `task.json`。

**特色保留：**
- 测试要点部分
- 实现类型标记（new/refactor/polish/debug）
- 依赖追踪
- spec.md 包含需求来源

## 核心原则

**一个 Task = 一个 OpenSpec 变更 = 一个 Story**

每个 Story 从 epics.md 转换为：
1. OpenSpec 变更目录：`openspec/changes/epic-X-story-Y-<name>/`
2. task.json 中的一个任务条目

## 铁律合规检查

**在执行任何生成操作前，必须完成铁律合规检查：**

```
┌─────────────────────────────────────────────────────────────┐
│                   铁律合规检查流程                           │
├─────────────────────────────────────────────────────────────┤
│  Step 1: 读取 epics.md，确认 Story 定义                      │
│  Step 2: 读取 PRD 文档，确认功能需求和验收标准                │
│  Step 3: 读取架构文档，确认技术方案                           │
│  Step 4: 读取 UX 设计规范，确认 UI/UX 要求                    │
│  Step 5: 使用 openspec CLI 生成变更                         │
│  Step 6: 确保变更内容符合四方约束                             │
└─────────────────────────────────────────────────────────────┘
```

## 输入参数

| 参数 | 必填 | 描述 |
|------|------|------|
| `epic_id` | 否 | 指定Epic编号（如 51, 52...），不指定则处理所有Epic |
| `story_id` | 否 | 指定Story编号（如 51.1, 51.2...），需配合epic_id使用 |
| `mode` | 否 | `single`（单个生成）或 `batch`（批量生成），默认 `single` |

## 执行步骤

### Step 1: 验证前置条件

**必须验证以下文件存在：**
- `openspec` CLI 工具可用
- `_bmad-output/planning-artifacts/epics.md` - Epic/Story 定义
- `task.json` - 任务定义文件

如果 openspec CLI 不可用，**停止并报告错误**。

### Step 2: 使用 openspec CLI 创建变更

**变更命名规范：**
```
epic-{X}-story-{Y}-{kebab-case-title}
```

示例：`epic-51-story-51-1-agent-orchestrator-core`

**创建变更：**
```bash
openspec new change "<change-name>"
```

### Step 3: 获取 Artifact 构建顺序

```bash
openspec status --change "<change-name>" --json
```

解析 JSON 获取：
- `applyRequires`: 实施前需要完成的 artifact 列表
- `artifacts`: 所有 artifact 及其状态和依赖

### Step 4: 创建 Artifacts

使用 **TodoWrite** 工具追踪进度。

循环处理 artifacts（按依赖顺序）：

**a. 获取 artifact 指令：**
```bash
openspec instructions <artifact-id> --change "<change-name>" --json
```

指令 JSON 包含：
- `context`: 项目背景（约束，不写入文件）
- `rules`: artifact 规则（约束，不写入文件）
- `template`: 输出结构模板
- `instruction`: Schema 相关指导
- `outputPath`: 输出路径
- `dependencies`: 需先读的已完成 artifact

**b. 读取依赖 artifact 获取上下文**

**c. 创建 artifact 文件**
- 按 `template` 结构填充内容
- 应用 `context` 和 `rules` 作为约束（不复制到文件）

### Step 5: 特色内容保留

创建 artifacts 时，**必须**保留以下特色内容：

#### 5.1 proposal.md 特色结构

```markdown
# Proposal: [Story标题]

## 变更类型
- [x] 新功能 / [x] 重构 / [x] 优化 / [x] 开发

## 背景

[从Story提取价值说明]

## 目标

[从Story提取功能描述]

## 范围

### 包含
- [从Acceptance Criteria提取]

### 不包含
- 明确排除的内容

## 影响范围

### 前端
- 受影响的前端模块

### 后端
- 受影响的后端模块

### 数据库
- 受影响的数据表

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| [风险1] | 低/中/高 | 低/中/高 | [缓解方案] |

## 依赖

- **前置依赖**: [需要先完成的其他Story]
- **后置依赖**: [依赖此Story的其他Story]
```

#### 5.2 specs/spec.md 特色结构

```markdown
# Specification: [Story标题]

## 需求来源

### PRD 需求
[引用PRD中的相关需求]

### 架构约束
[引用架构文档中的相关约束]

### UX 规范
[引用UX设计规范中的相关要求]

## 功能规格

### 用户故事
As a [角色],
I want [功能],
So that [价值]。

### 验收场景

#### Scenario 1: [场景名称]
- **GIVEN** [前置条件]
- **WHEN** [触发动作]
- **THEN** [预期结果]

## 数据规格

### 输入
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| [字段名] | [类型] | 是/否 | [校验规则] |

### 输出
| 字段 | 类型 | 描述 |
|------|------|------|
| [字段名] | [类型] | [描述] |

## 边界条件

- [边界条件1]
- [边界条件2]

## 错误处理

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| [错误码] | [错误信息] | [处理方式] |
```

#### 5.3 tasks.md 特色结构

```markdown
# Tasks: [Story标题]

## 实现类型
- **类型**: new / refactor / polish / debug
- **优先级**: critical / high / medium / low
- **阶段**: Phase X

## 任务列表

### Task 1: [任务名称]
- **描述**: [任务描述]
- **文件**: [涉及的文件]
- **验收**: [验收标准]

## 测试要点

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 浏览器测试（如涉及UI）
```

### Step 6: 更新 task.json

在 task.json 中添加对应的任务条目：

```json
{
  "id": "[自增ID]",
  "epic": "Epic X",
  "story": "Story X.Y",
  "title": "[Story标题]",
  "description": "[Story描述]",
  "implementationType": "new / refactor / polish / debug",
  "openspec_change": "epic-X-story-Y-<name>",
  "steps": [
    "[从Acceptance Criteria提取的步骤]"
  ],
  "frs_covered": ["FR编号"],
  "nfrs_covered": ["NFR编号"],
  "arch_covered": ["ARCH编号"],
  "ux_covered": ["UX编号"],
  "dependencies": ["前置Story编号"],
  "passes": false
}
```

### Step 7: 验证 artifacts

创建完每个 artifact 后验证文件存在：
```bash
openspec status --change "<change-name>"
```

## 输出

执行完成后，输出摘要：

```
✅ OpenSpec 变更生成完成

Epic X, Story X.Y: [Story标题]
├── openspec/changes/epic-X-story-Y-<name>/
│   ├── .openspec.yaml
│   ├── README.md
│   ├── proposal.md (含变更类型、依赖)
│   ├── design.md
│   ├── tasks.md (含测试要点)
│   └── specs/spec.md (含需求来源)
└── task.json (已更新)

📊 统计：
- 新增 OpenSpec 变更: X 个
- 更新 task.json 任务: X 个
- 实现类型: new=X, refactor=X, polish=X
```

## Guardrails

- **必须**在生成前完成铁律合规检查
- **必须**使用 openspec CLI 创建变更
- **必须**遵循 openspec instructions 获取 artifact 模板
- **必须**保留测试要点、实现类型、依赖追踪等特色
- **不得**生成 epics.md 中未定义的 Story
- 生成的 task.json 中 `passes` 初始值必须为 `false`

## 全自动开发集成

此Skill与全自动开发流程集成：

```
┌─────────────────────────────────────────────────────────────┐
│                    全自动开发流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 读取 task.json，选择 passes=false 的任务                 │
│     ↓                                                       │
│  2. 从任务中获取 openspec_change 字段                        │
│     ↓                                                       │
│  3. 读取对应的 OpenSpec 变更目录                             │
│     → openspec/changes/<openspec_change>/                   │
│     ↓                                                       │
│  4. 读取变更文档：proposal.md + design.md + tasks.md         │
│     ↓                                                       │
│  5. 执行铁律合规检查（PRD + 架构 + UX + Epic）               │
│     ↓                                                       │
│  6. 按照设计文档实现功能代码                                 │
│     ↓                                                       │
│  7. 执行测试验证                                             │
│     ↓                                                       │
│  8. 更新 progress.txt                                        │
│     ↓                                                       │
│  9. 更新 task.json (passes: true)                            │
│     ↓                                                       │
│  10. 提交 git commit                                         │
│     ↓                                                       │
│  11. 返回 Step 1，处理下一个任务                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 示例用法

### 为特定Story生成OpenSpec变更
```
使用 xianyu-task-openspec skill，为 Epic 51, Story 51.1 生成 OpenSpec 变更
```

### 批量生成所有Epic的OpenSpec变更
```
使用 xianyu-task-openspec skill，批量生成所有 Epic 的 OpenSpec 变更
```

### 只生成特定Epic的所有Story
```
使用 xianyu-task-openspec skill，为 Epic 52 的所有 Story 生成 OpenSpec 变更
```
