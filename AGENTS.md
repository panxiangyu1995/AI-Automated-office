# 匿名社区 - Claude AI 工作指南

## 项目概述

**匿名社区** 是一个企业内部匿名发声平台，服务于约80名员工。核心价值在于「真匿名」——技术层面的身份隔离，让员工敢于说真话，无需担心身份暴露带来的职业风险。

**产品定位：**
- 真匿名机制 - 系统不记录IP与账号的关联
- 邀请码注册 - 防止外部人员混入
- 行为风控 - 防止恶意刷号
- 内容治理 - 敏感词过滤 + 举报机制

**技术栈：** React 18 + TypeScript + NestJS + TypeORM + SQL Server 2019 + Socket.io

---

## 🔒 铁律文档（MANDATORY DOCUMENTS）

**以下文档是本项目的铁律，所有开发决策必须以此为基准，不可违背：**

### 1️⃣ PRD 文档 - 产品铁律
📄 **位置：** `_bmad-output/planning-artifacts/prd.md`

**内容要点：**
- 77条功能需求（FR1-FR79）
- 30条非功能需求（NFR1-NFR30）
- 用户旅程定义（4个核心旅程）
- MVP范围定义
- 验收标准

**约束力：**
- ❌ 不得实现PRD之外的功能
- ❌ 不得省略PRD定义的功能点
- ✅ 实现细节可在架构框架内调整

### 2️⃣ 架构文档 - 技术铁律
📄 **位置：** `_bmad-output/planning-artifacts/architecture.md`

**内容要点：**
- 技术栈选型（Vite + React 18 + NestJS + TypeORM + SQL Server 2019）
- 前后端项目结构
- 认证方案：JWT + Refresh Token
- 权限控制：RBAC 三级角色
- 匿名保护机制：IP-账号隔离
- 命名约定、API设计规范

**约束力：**
- ❌ 不得更换技术栈核心组件
- ❌ 不得违背模块边界
- ❌ 不得绕过匿名保护设计
- ✅ 具体实现方案可在架构框架内优化

### 3️⃣ UX设计规范 - 体验铁律
📄 **位置：** `_bmad-output/planning-artifacts/ux-design-specification.md`

**内容要点：**
- 设计方向：简洁专业型
- 组件库：Ant Design 5.x
- 颜色系统：蓝色系品牌色 (#1890ff)
- 图标库：Font Awesome
- 表情库：emoji-mart
- 自定义组件：PostCard, CommentItem, NotificationItem, AnonymousBadge, SecurityConfirm, OnboardingGuide, RichTextEditor
- 明暗主题支持

**约束力：**
- ❌ 不得违背颜色系统和状态色定义
- ❌ 不得违背组件设计规范
- ❌ 不得改变核心布局结构
- ✅ 细节样式可在规范内微调

### 4️⃣ Epic 文档 - 实现铁律
📄 **位置：** `_bmad-output/planning-artifacts/epics.md`

**内容要点：**
- 9个 Epic 定义
- 详细的用户故事（Story）拆分
- 需求覆盖映射表（FR/NFR/ARCH/UX）
- 验收标准（Acceptance Criteria）

**Epic 列表：**
| Epic | 名称 | Stories |
|:----:|------|:-------:|
| 1 | 项目初始化与认证基础 | 9 个故事 |
| 2 | 版块与内容浏览 | 9 个故事 |
| 3 | 帖子创作与编辑 | 9 个故事 |
| 4 | 互动功能 | 6 个故事 |
| 5 | 实时通知系统 | 7 个故事 |
| 6 | 内容治理与审核 | 10 个故事 |
| 7 | 管理后台 - 版块与邀请码 | 5 个故事 |
| 8 | 管理后台 - 用户、内容与系统 | 8 个故事 |
| 9 | 用户申诉与行为风控 | 4 个故事 |

**约束力：**
- ❌ 不得实现 Epic 之外的功能
- ❌ 不得跳过 Story 或省略验收标准
- ✅ 实现细节可在验收标准框架内调整

---

## ⚠️ 铁律执行机制（MANDATORY COMPLIANCE）

### 开发前必读（Before Any Implementation）

**每次开始新任务前，必须执行以下流程：**

```
┌─────────────────────────────────────────────────────────────┐
│                    铁律合规检查流程                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: 读取任务需求                                        │
│     ↓                                                       │
│  Step 2: 打开并查阅 PRD 文档                                 │
│     → 确认功能定义、需求编号、验收标准                        │
│     ↓                                                       │
│  Step 3: 打开并查阅架构文档                                  │
│     → 确认技术方案、模块边界、数据库设计                      │
│     ↓                                                       │
│  Step 4: 打开并查阅 UX 设计规范                              │
│     → 确认组件使用、颜色规范、交互模式                        │
│     ↓                                                       │
│  Step 5: 打开并查阅 Epic 文档                                │
│     → 确认 Story 定义、验收标准、依赖关系                     │
│     ↓                                                       │
│  Step 6: 生成实现方案                                        │
│     → 方案必须同时满足 PRD + 架构 + UX + Epic 四方约束        │
│     ↓                                                       │
│  Step 7: 开始实现                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 合规检查清单（Compliance Checklist）

**每个任务实现前必须填写：**

```markdown
## 铁律合规检查

### PRD 合规
- [ ] 功能定义来源：FR-XX（填写具体需求编号）
- [ ] 无 PRD 外功能添加

### 架构合规
- [ ] 技术方案符合架构设计
- [ ] 模块边界明确
- [ ] 命名约定遵循规范

### UX 合规
- [ ] 使用 Ant Design 组件
- [ ] 颜色使用规范色值
- [ ] 布局符合设计方向

### Epic 合规
- [ ] Story 来源：Epic X, Story X.X（填写具体故事编号）
- [ ] 验收标准全部满足
```
---

## 📋 MANDATORY: Agent Workflow

Every new agent session MUST follow this workflow:

### Step 1: Initialize Environment

```bash
./init.sh
```

This will:
- Install all dependencies
- Start the development server

**DO NOT skip this step.** Ensure the server is running before proceeding.

### Step 2: 铁律合规检查

**在开始任何任务之前，必须阅读以下文档：**

1. **PRD 文档**：`_bmad-output/planning-artifacts/prd.md`
2. **架构文档**：`_bmad-output/planning-artifacts/architecture.md`
3. **UX 设计规范**：`_bmad-output/planning-artifacts/ux-design-specification.md`
4. **Epic 文档**：`_bmad-output/planning-artifacts/epics.md`

### Step 3: Select Next Task

Read `task.json` and select ONE task to work on.

**任务结构规范：**

每个任务对应一个 OpenSpec 变更，结构如下：

```json
{
  "id": 1,
  "epic": "Epic 1",
  "story": "Story 1.1",
  "title": "Tauri 项目初始化",
  "description": "创建一个可运行的 Tauri 2.0 项目脚手架",
  "openspec_change": "epic-1-story-1-tauri-project-init",
  "steps": [...],
  "frs_covered": [],
  "nfrs_covered": ["NFR1", "NFR5"],
  "arch_covered": ["ARCH-01"],
  "ux_covered": ["UX-04"],
  "dependencies": [],
  "passes": false
}
```

**核心原则：一个 Task = 一个 OpenSpec 变更 = 一个 Story**

Selection criteria (in order of priority):
1. Choose a task where `passes: false`
2. Consider dependencies - check `dependencies` field for prerequisite stories
3. 按 Epic 顺序：Epic 1 → Epic 2 → ... → Epic 8
4. 按 Story 顺序：Story X.1 → Story X.2 → ... → Story X.Y

### Step 4: Implement the Task

- 执行铁律合规检查
- Read the task description and steps carefully
- Implement the functionality to satisfy all steps
- Follow existing code patterns and conventions
- **使用 Element Plus 组件和 Element Plus Icons**

### Step 5: Test Thoroughly

After implementation, verify ALL steps in the task:

**强制测试要求（Testing Requirements - MANDATORY）：**

1. **大幅度页面修改**（新建页面、重写组件、修改核心交互）：
   - **必须在浏览器中测试！** 使用 chrome devtools mcp或者playwright mcp 工具
   - 验证页面能正确加载和渲染
   - 验证表单提交、按钮点击等交互功能
   - 截图确认 UI 正确显示

2. **小幅度代码修改**（修复 bug、调整样式、添加辅助函数）：
   - 可以使用单元测试或 lint/build 验证
   - 如有疑虑，仍使用浏览器测试

3. **所有修改必须通过**：
   - `npm run lint` 无错误
   - `npm run build` 构建成功
   - 浏览器/单元测试验证功能正常

**测试清单：**
- [ ] 代码没有 TypeScript 错误
- [ ] lint 通过
- [ ] build 成功
- [ ] 功能在浏览器中正常工作（对于 UI 相关修改）

### Step 6: Update Progress

Write your work to `progress.txt`:

```
## [Date] - Task: [task description]

### 铁律合规检查：
- PRD 合规：[FR-XX]
- 架构合规：[说明]
- UX 合规：[说明]

### What was done:
- [specific changes made]

### Testing:
- [how it was tested]

### Notes:
- [any relevant notes for future agents]
```

### Step 7: Commit Changes (包含 task.json 更新)

**IMPORTANT: 所有更改必须在同一个 commit 中提交，包括 task.json 的更新！**

流程：
1. 更新 `task.json`，将任务的 `passes` 从 `false` 改为 `true`
2. 更新 `progress.txt` 记录工作内容
3. 一次性提交所有更改：

```bash
git add .
git commit -m "[修改类型]+[系统模块]+[修改内容总结]"
```

**提交规范：**
- `[功能]+[前端]+[添加账号管理页面]`
- `[bug]+[后端]+[修复消息监听异常]`
- `[UI]+[前端]+[优化消息卡片样式]`

**规则:**
- 只有在所有步骤都验证通过后才标记 `passes: true`
- 永远不要删除或修改任务描述
- 永远不要从列表中移除任务
- **一个 task 的所有内容（代码、progress.txt、task.json）必须在同一个 commit 中提交**

---

## ⚠️ 阻塞处理（Blocking Issues）

**如果任务无法完成测试或需要人工介入，必须遵循以下规则：**

### 需要停止任务并请求人工帮助的情况：

1. **缺少环境配置**：
   - 需要填写真实的 API 密钥
   - 需要创建外部服务账号

2. **外部依赖不可用**：
   - 第三方 API 服务宕机
   - 需要人工授权的 OAuth 流程

3. **铁律冲突**：
   - 发现 PRD/架构/UX 文档之间存在矛盾
   - 实现需求与铁律文档冲突

### 阻塞时的正确操作：

**DO NOT（禁止）：**
- ❌ 提交 git commit
- ❌ 将 task.json 的 passes 设为 true
- ❌ 假装任务已完成
- ❌ 绕过铁律文档

**DO（必须）：**
- ✅ 在 progress.txt 中记录当前进度和阻塞原因
- ✅ 输出清晰的阻塞信息，说明需要人工做什么
- ✅ 停止任务，等待人工介入

### 阻塞信息格式：

```
🚫 任务阻塞 - 需要人工介入

**当前任务**: [任务名称]

**已完成的工作**:
- [已完成的代码/配置]

**阻塞原因**:
- [具体说明为什么无法继续]

**需要人工帮助**:
1. [具体的步骤 1]
2. [具体的步骤ic
...

**解除阻塞后**:
- 运行 [命令] 继续任务
```

---

## 📁 Project Structure

```
/
├── AGENTS.md                              # Agent 工作指南
├── CLAUDE.md                              # 本文件 - Claude AI 配置
├── task.json                              # 任务定义
├── progress.txt                           # 进度日志
├── init.sh                                # 初始化脚本
│
├── _bmad-output/                          # 规划文档输出目录
│   └── planning-artifacts/
│       ├── prd.md                         # 🔒 PRD 文档（产品铁律）
│       ├── architecture.md                # 🔒 架构文档（技术铁律）
│       ├── ux-design-specification.md     # 🔒 UX设计规范（体验铁律）
│       └── epics.md                       # 🔒 Epic 文档（实现铁律）
│
├── openspec/                              # OpenSpec 变更管理
│   └── changes/
│       └── xianyu-mvp-epics/              # MVP Epic 定义
│           ├── specs/                     # 各功能模块规格
│           └── tasks.md
│
└── hello-nextjs/                          # 应用代码目录
    ├── src/                               # 源代码
    ├── src-tauri/                         # Tauri 后端
    └── python-backend/                    # Python FastAPI 后端
```

---

## 💻 Commands

```bash
# 初始化项目
./init.sh

# 前端开发
cd hello-nextjs
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run lint         # 代码检查

# Tauri 开发
npm run tauri dev    # 启动 Tauri 开发模式
npm run tauri build  # 构建桌面应用

# Python 后端
cd python-backend
python -m uvicorn main:app --reload
```

---

## 📝 Coding Conventions

### TypeScript/Vue 规范
- TypeScript strict mode
- Composition API + `<script setup>`
- 组件命名：PascalCase
- 文件命名：kebab-case

### 样式规范
- 使用 Element Plus 组件库
- 遵循 UX 设计规范的颜色系统
- 使用 CSS 变量（设计 Token）
- **禁止使用 emoji 作为图标**，使用 Element Plus Icons

### 数据库规范
- 遵循 PRD 数据字典定义
- 使用 SQLite + 加密存储敏感数据
- 表名：snake_case
- 字段名：snake_case

---

## 🎯 Key Rules

1. **铁律优先** - PRD、架构、UX、Epic 文档是铁律，所有决策以此为基准
2. **One task per session** - Focus on completing one task well
3. **合规检查** - 实现前必须完成铁律合规检查
4. **Test before marking complete** - All steps must pass
5. **Browser testing for UI changes** - 新建或大幅修改页面必须在浏览器测试
6. **Document in progress.txt** - Help future agents understand your work
7. **One commit per task** - 所有更改（代码、progress.txt、task.json）必须在同一个 commit 中提交
8. **Never remove tasks** - Only flip `passes: false` to `true`
9. **Stop if blocked** - 需要人工介入时，不要提交，输出阻塞信息并停止
10. **无 emoji** - 图标统一使用 Element Plus Icons

---

## 🚀 快速启动清单

**新会话启动清单：**

1. [ ] 阅读本 CLAUDE.md 文件
2. [ ] 阅读 PRD 文档（`_bmad-output/planning-artifacts/prd.md`）
3. [ ] 阅读架构文档（`_bmad-output/planning-artifacts/architecture.md`）
4. [ ] 阅读 UX 设计规范（`_bmad-output/planning-artifacts/ux-design-specification.md`）
5. [ ] 阅读 Epic 文档（`_bmad-output/planning-artifacts/epics.md`）
6. [ ] 查看 task.json 选择任务
7. [ ] 开始工作！

---

## 🤖 全自动开发流程

### 流程概述

```
┌─────────────────────────────────────────────────────────────┐
│                    全自动开发流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: 任务初始化（使用 xianyu-task-openspec）      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  1. 读取 epics.md，解析所有 Epic 和 Story                   │
│     ↓                                                       │
│  2. 为每个 Story 生成 OpenSpec 变更目录                      │
│     → openspec/changes/epic-X-story-Y-<name>/               │
│     ↓                                                       │
│  3. 同步生成 task.json 任务条目                              │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  Phase 2: 任务执行循环                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  4. 读取 task.json，选择 passes=false 的任务                 │
│     ↓                                                       │
│  5. 检查依赖关系，确保前置任务已完成                          │
│     ↓                                                       │
│  6. 从任务获取 openspec_change 字段                        │
│     ↓                                                       │
│  7. 读取 OpenSpec 变更文档                                   │
│     → openspec/changes/<openspec_change>/                   │
│     → proposal.md + design.md + tasks.md + specs/spec.md    │
│     ↓                                                       │
│  8. 执行铁律合规检查                                         │
│     → PRD + 架构 + UX + Epic 四方约束                        │
│     ↓                                                       │
│  9. 按照OpenSpec 变更文档设计实现功能代码                                  │
│     ↓                                                       │
│  10. 执行测试验证                                            │
│     → lint / build / playwright mcp浏览器测试                              │
│     ↓                                                       │
│  11. 更新 progress.txt/标记tasks.md为已完成                                      │
│     ↓                                                       │
│  12. 更新 task.json (passes: true)                           │
│     ↓                                                       │
│  13. 提交 git commit                                         │
│     ↓                                                       │
│  14. 返回 Step 4，处理下一个任务                             │
│     ↓                                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  Phase 3: 完成确认                                     │   │
│                                                             │
│  15. 所有任务 passes=true                                    │
│     ↓                                                       │
│  16. 执行最终集成测试                                         │
│     ↓                                                       │
│  17. 归档 OpenSpec 变更                                      │
│     → openspec/changes/archive/                             │
│     ↓                                                       │
│  18. 发布版本                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
---

