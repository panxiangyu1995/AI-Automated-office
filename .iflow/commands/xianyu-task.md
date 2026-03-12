---
name: /xianyu-task
id: xianyu-task
category: Workflow
description: 为项目创建基于Epic/Story的OpenSpec变更和task.json任务
---

将 epics.md 中的 Story 转换为符合规范的 OpenSpec 变更，并同步更新 task.json。

**核心原则**: 一个 Task = 一个 OpenSpec 变更 = 一个 Story

**输入**: 命令后的参数可以是：
- 无参数 → 批量生成所有 Epic/Story 的 OpenSpec 变更
- `epic <编号>` → 生成指定 Epic 的所有 Story
- `epic <编号> story <编号>` → 生成指定的单个 Story
- `status` → 查看当前任务生成状态

**前置条件**

执行前必须验证以下文件存在：
- `_bmad-output/planning-artifacts/epics.md` - Epic/Story 定义
- `_bmad-output/planning-artifacts/prd.md` - PRD 文档
- `_bmad-output/planning-artifacts/architecture.md` - 架构文档
- `_bmad-output/planning-artifacts/ux-design-specification.md` - UX 设计规范
- `task.json` - 任务定义文件

如果任何文件不存在，**停止并报告错误**。

**Steps**

1. **解析命令参数**

   根据用户输入确定生成模式：
   
   | 参数 | 模式 | 说明 |
   |------|------|------|
   | 无参数 | `batch` | 批量生成所有 Epic/Story |
   | `epic 2` | `epic` | 生成 Epic 2 的所有 Story |
   | `epic 1 story 1` | `single` | 生成 Epic 1, Story 1.1 |
   | `status` | `status` | 显示当前生成状态 |

2. **执行铁律合规检查**

   在生成前必须完成铁律合规检查：
   ```
   Step 1: 读取 epics.md，确认 Story 定义
   Step 2: 读取 PRD 文档，确认功能需求和验收标准
   Step 3: 读取架构文档，确认技术方案
   Step 4: 读取 UX 设计规范，确认 UI/UX 要求
   Step 5: 确保变更内容符合四方约束
   ```

3. **读取并解析 epics.md**

   从 epics.md 中提取 Story 信息：
   - `epic_id`: Epic 编号
   - `story_id`: Story 编号
   - `title`: Story 标题
   - `as_a`: 角色
   - `i_want`: 功能描述
   - `so_that`: 价值/目的
   - `acceptance_criteria`: 验收标准列表
   - `frs_covered`: 覆盖的功能需求
   - `nfrs_covered`: 覆盖的非功能需求
   - `arch_covered`: 覆盖的架构需求
   - `ux_covered`: 覆盖的 UX 需求

4. **生成 OpenSpec 变更目录**

   变更命名规范：`epic-{X}-story-{Y}-{kebab-case-title}`
   
   示例：`epic-1-story-1-tauri-project-init`

   创建目录结构：
   ```
   openspec/changes/epic-X-story-Y-<name>/
   ├── .openspec.yaml      # OpenSpec 配置和需求映射
   ├── README.md           # 变更概述和铁律映射
   ├── proposal.md         # 提案：背景、目标、范围、风险
   ├── design.md           # 设计：技术方案、API、组件
   ├── tasks.md            # 任务：执行步骤、测试要点
   └── specs/
       └── spec.md         # 规格：验收场景、数据规格
   ```

5. **创建各文档内容**

   根据模板生成各文档：
   
   - `.openspec.yaml`: 包含变更名称、状态、Epic/Story 编号、需求映射
   - `README.md`: 包含概述、铁律映射、验收标准、相关文档链接
   - `proposal.md`: 包含变更类型、背景、目标、范围、影响范围、风险评估
   - `design.md`: 包含技术方案、API 设计、组件设计、安全考虑
   - `tasks.md`: 包含任务列表、执行顺序、测试要点
   - `specs/spec.md`: 包含需求来源、验收场景、数据规格、错误处理

6. **更新 task.json**

   添加对应的任务条目：
   ```json
   {
     "id": "[自增ID]",
     "epic": "Epic X",
     "story": "Story X.Y",
     "title": "[Story标题]",
     "description": "[Story描述]",
     "openspec_change": "epic-X-story-Y-<name>",
     "steps": [...],
     "frs_covered": [...],
     "nfrs_covered": [...],
     "arch_covered": [...],
     "ux_covered": [...],
     "dependencies": [...],
     "passes": false
   }
   ```

7. **输出摘要**

   执行完成后输出统计信息。

**Output**

完成后输出摘要：

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

🎯 下一步：使用 /opsx:apply 开始实现第一个任务
```

**示例用法**

### 批量生成所有 Story

```
/xianyu-task
```
生成所有 Epic (1-8) 的所有 Story 的 OpenSpec 变更。

### 生成指定 Epic 的所有 Story

```
/xianyu-task epic 1
```
只生成 Epic 1（项目基础设施与核心框架）的 9 个 Story。

### 生成单个 Story

```
/xianyu-task epic 1 story 1
```
只生成 Epic 1, Story 1.1（Tauri 项目初始化）。

### 查看状态

```
/xianyu-task status
```
显示当前已生成的 OpenSpec 变更和 task.json 状态。

**Epic 顺序**

批量生成按以下顺序执行（考虑依赖关系）：

1. Epic 1: 项目基础设施与核心框架 (Story 1.1 → 1.9)
2. Epic 2: 账号管理 (Story 2.1 → 2.5)
3. Epic 3: 消息中心与系统托盘 (Story 3.1 → 3.5)
4. Epic 4: AI 智能回复与议价策略 (Story 4.1 → 4.7)
5. Epic 5: 本地知识库与买家画像 (Story 5.1 → 5.5)
6. Epic 6: 自动发货与商品管理 (Story 6.1 → 6.6)
7. Epic 7: 消息推送与数据统计 (Story 7.1 → 7.6)
8. Epic 8: 系统集成与优化 (Story 8.1 → 8.8)

**Guardrails**

- **必须**在生成前完成铁律合规检查
- **不得**生成 epics.md 中未定义的 Story
- **不得**跳过任何已定义的 Story（批量模式）
- **必须**确保 OpenSpec 变更内容符合四方约束（PRD/架构/UX/Epic）
- 如发现 epics.md 与 PRD/架构/UX 文档冲突，**必须**停止并报告
- 生成的 task.json 中 `passes` 初始值必须为 `false`
- 如果 OpenSpec 变更目录已存在，跳过并提示用户

**与开发流程集成**

此命令是全自动开发流程的第一步：

```
/xianyu-task → 生成 OpenSpec 变更和 task.json
      ↓
选择 passes=false 的任务
      ↓
读取 OpenSpec 变更文档
      ↓
执行铁律合规检查
      ↓
实现功能代码
      ↓
测试验证
      ↓
更新 progress.txt 和 task.json
      ↓
提交 git commit
      ↓
处理下一个任务
```

**相关命令**

| 命令 | 用途 |
|------|------|
| `/opsx:apply` | 实现 OpenSpec 变更 |
| `/opsx:verify` | 验证实现是否匹配变更 |
| `/opsx:archive` | 归档已完成的变更 |