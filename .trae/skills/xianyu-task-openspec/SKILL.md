---
name: xianyu-task-openspec
description: 为项目创建基于Epic/Story的OpenSpec变更和task.json任务。使用此skill可以将epics.md中的每个Story转换为符合规范的OpenSpec变更，并同步更新task.json。
license: MIT
compatibility: 需要openspec CLI，需要项目存在epics.md和task.json
metadata:
  author: team
  version: "1.0"
  generatedBy: "xianyu-mvp"
---

# Task/OpenSpec 同步生成器

## 概述

此Skill用于根据 `_bmad-output/planning-artifacts/epics.md` 中的 Epic 和 Story 定义，自动生成符合 OpenSpec 规范的变更文档，并同步更新 `task.json`。

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
│  Step 5: 生成 OpenSpec 变更内容                              │
│  Step 6: 确保变更内容符合四方约束                             │
└─────────────────────────────────────────────────────────────┘
```

## 输入参数

| 参数 | 必填 | 描述 |
|------|------|------|
| `epic_id` | 否 | 指定Epic编号（如 1, 2, 3...），不指定则处理所有Epic |
| `story_id` | 否 | 指定Story编号（如 1.1, 1.2...），需配合epic_id使用 |
| `mode` | 否 | `single`（单个生成）或 `batch`（批量生成），默认 `single` |

## 执行步骤

### Step 1: 验证前置条件

**必须验证以下文件存在：**
- `_bmad-output/planning-artifacts/epics.md` - Epic/Story 定义
- `_bmad-output/planning-artifacts/prd.md` - PRD 文档
- `_bmad-output/planning-artifacts/architecture.md` - 架构文档
- `_bmad-output/planning-artifacts/ux-design-specification.md` - UX 设计规范
- `task.json` - 任务定义文件

如果任何文件不存在，**停止并报告错误**。

### Step 2: 读取并解析 epics.md

从 epics.md 中提取 Story 信息：

```markdown
### Story X.Y: [Story标题]

As a [角色],
I want [功能],
So that [价值]。

**Acceptance Criteria:**
[验收标准列表]
```

提取字段：
- `epic_id`: Epic 编号 (X)
- `story_id`: Story 编号 (X.Y)
- `title`: Story 标题
- `as_a`: 角色
- `i_want`: 功能描述
- `so_that`: 价值/目的
- `acceptance_criteria`: 验收标准列表
- `frs_covered`: 覆盖的功能需求（从Epic头部获取）
- `nfrs_covered`: 覆盖的非功能需求（从Epic头部获取）
- `arch_covered`: 覆盖的架构需求（从Epic头部获取）
- `ux_covered`: 覆盖的UX需求（从Epic头部获取）

### Step 3: 生成 OpenSpec 变更

**变更命名规范：**
```
epic-{X}-story-{Y}-{kebab-case-title}
```

示例：`epic-1-story-1-tauri-project-init`

**变更目录结构：**
```
openspec/changes/epic-X-story-Y-<name>/
├── .openspec.yaml      # OpenSpec 配置
├── README.md           # 变更概述
├── proposal.md         # 提案文档
├── design.md           # 设计文档
├── tasks.md            # 任务列表
└── specs/
    └── spec.md         # 规格说明
```

### Step 4: 创建各文档内容

#### 4.1 创建 .openspec.yaml

```yaml
name: epic-X-story-Y-<name>
status: pending
created_at: [当前日期]
epic: X
story: X.Y
mapping:
  frs: [FR编号列表]
  nfrs: [NFR编号列表]
  arch: [ARCH编号列表]
  ux: [UX编号列表]
```

#### 4.2 创建 README.md

```markdown
# Epic X, Story X.Y: [Story标题]

## 概述

[Story的简短描述]

## 铁律映射

### PRD 需求
- **FRs**: [FR编号列表]
- **NFRs**: [NFR编号列表]

### 架构需求
- **ARCH**: [ARCH编号列表]

### UX 需求
- **UX**: [UX编号列表]

## 验收标准

[从epics.md提取的验收标准]

## 相关文档
- PRD: `_bmad-output/planning-artifacts/prd.md`
- 架构: `_bmad-output/planning-artifacts/architecture.md`
- UX规范: `_bmad-output/planning-artifacts/ux-design-specification.md`
```

#### 4.3 创建 proposal.md

```markdown
# Proposal: [Story标题]

## 变更类型
- [ ] 新功能
- [ ] 修复
- [ ] 优化
- [ ] 重构

## 背景

[从Story的"So that"提取价值说明]

## 目标

[从Story的"I want"提取功能描述]

## 范围

### 包含
- [从Acceptance Criteria提取的功能点]

### 不包含
- [明确排除的内容]

## 影响范围

### 前端
- [受影响的前端模块]

### 后端
- [受影响的后端模块]

### 数据库
- [受影响的数据表]

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| [风险1] | 低/中/高 | 低/中/高 | [缓解方案] |

## 依赖

- **前置依赖**: [需要先完成的其他Story]
- **后置依赖**: [依赖此Story的其他Story]
```

#### 4.4 创建 design.md

```markdown
# Design: [Story标题]

## 技术方案

### 前端实现
[详细的前端实现方案，参考架构文档]

### 后端实现
[详细的后端实现方案，参考架构文档]

### 数据库设计
[涉及的数据库表结构变更]

## API 设计

### 新增接口
\`\`\`
POST /api/xxx
Request: { ... }
Response: { ... }
\`\`\`

### 修改接口
[如有修改的接口]

## 组件设计

### 新增组件
- `[组件名]`: [组件描述]

### 修改组件
- `[组件名]`: [修改内容]

## 状态管理

[涉及的 Pinia store 设计]

## 安全考虑

[安全相关的设计，参考架构文档的安全章节]

## 性能考虑

[性能相关的设计，参考NFR]
```

#### 4.5 创建 tasks.md

```markdown
# Tasks: [Story标题]

## 任务列表

### 任务 1: [任务名称]
- **描述**: [任务描述]
- **文件**: [涉及的文件]
- **验收**: [验收标准]

### 任务 2: [任务名称]
- **描述**: [任务描述]
- **文件**: [涉及的文件]
- **验收**: [验收标准]

## 执行顺序

1. [任务1] → 2. [任务2] → ...

## 测试要点

- [ ] 单元测试
- [ ] 集成测试
- [ ] E2E 测试
- [ ] 浏览器测试（如涉及UI）
```

#### 4.6 创建 specs/spec.md

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

#### Scenario 2: [场景名称]
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

### Step 5: 更新 task.json

在 task.json 中添加对应的任务条目：

```json
{
  "id": "[自增ID]",
  "epic": "Epic X",
  "story": "Story X.Y",
  "title": "[Story标题]",
  "description": "[Story描述]",
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

### Step 6: 批量生成模式

如果 `mode=batch`，按以下顺序批量生成所有Story的OpenSpec变更：

**Epic 优先级顺序（考虑依赖关系）：**
1. Epic 1: 项目基础设施与核心框架 (Story 1.1 → 1.9)
2. Epic 2: 账号管理 (Story 2.1 → 2.5)
3. Epic 3: 消息中心与系统托盘 (Story 3.1 → 3.5)
4. Epic 4: AI 智能回复与议价策略 (Story 4.1 → 4.7)
5. Epic 5: 本地知识库与买家画像 (Story 5.1 → 5.5)
6. Epic 6: 自动发货与商品管理 (Story 6.1 → 6.6)
7. Epic 7: 消息推送与数据统计 (Story 7.1 → 7.6)
8. Epic 8: 系统集成与优化 (Story 8.1 → 8.8)

## 输出

执行完成后，输出摘要：

```
✅ OpenSpec 变更生成完成

Epic X, Story X.Y: [Story标题]
├── openspec/changes/epic-X-story-Y-<name>/
│   ├── .openspec.yaml
│   ├── README.md
│   ├── proposal.md
│   ├── design.md
│   ├── tasks.md
│   └── specs/spec.md
└── task.json (已更新)

📊 统计：
- 新增 OpenSpec 变更: X 个
- 更新 task.json 任务: X 个
- 覆盖 FR: X 个
- 覆盖 NFR: X 个
- 覆盖 ARCH: X 个
- 覆盖 UX: X 个
```

## Guardrails

- **必须**在生成前完成铁律合规检查
- **不得**生成 epics.md 中未定义的 Story
- **不得**跳过任何已定义的 Story（批量模式）
- **必须**确保 OpenSpec 变更内容符合四方约束（PRD/架构/UX/Epic）
- 如发现 epics.md 与 PRD/架构/UX 文档冲突，**必须**停止并报告
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

### 生成单个 Story 的 OpenSpec 变更

```
使用 task-openspec skill，为 Epic 1, Story 1.1 生成 OpenSpec 变更
```

### 批量生成所有 Story 的 OpenSpec 变更

```
使用 task-openspec skill，批量生成所有 Epic 和 Story 的 OpenSpec 变更
```

### 只生成特定 Epic 的所有 Story

```
使用 task-openspec skill，为 Epic 2 的所有 Story 生成 OpenSpec 变更