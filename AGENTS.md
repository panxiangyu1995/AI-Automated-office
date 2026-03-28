# AI-Automated-office - Claude AI 工作指南
## 使用UTF-8格式进行编码
## 项目概述

**AI-Automated-office** 是一款**AI赋能的ERP系统**，采用部门化架构设计。核心价值在于：

- 每个部门都有专属 AI 助手
- 跨部门数据自动联动
- 统一数据中台，打破数据孤岛
- 企业只需开通对应部门模块即可

**产品定位：**
- 核心部门（内置不可卸载）：人事部、审批中心、销售部、财务部、仓储部、管理层
- 扩展部门（按需安装）：售后服务、招投标、市场宣传
- 平台能力：AI Agent 框架、部门权限系统、统一消息系统、知识库 RAG

**差异化核心：**
> *"钉钉/飞书给企业一堆工具，企业自己拼凑流程；我们给企业一个 AI 赋能的 ERP，看企业有哪些部门，就提供哪些部门的 AI 能力。"*

**技术栈：** Tauri + Rust (桌面端) + React + TypeScript (前端) + Shadcn/ui + Tailwind CSS + 云端服务

---

## 🔒 铁律文档（MANDATORY DOCUMENTS）

**以下文档是本项目的铁律，所有开发决策必须以此为基准，不可违背：**

### 1️⃣ PRD 文档 - 产品铁律
📄 **位置：** `_bmad-output/planning-artifacts/prd.md`

**内容要点：**
- 439条功能需求（FR1-FR439）
- 覆盖8个业务部门模块：人事管理、财务OCR、数据看板、销售自动化、售后工单、知识库RAG、仓库管理、标书制定
- 核心平台能力：桌面端UI、AI Agent框架、插件系统、权限系统、统一消息系统
- 用户旅程定义（8个核心旅程）
- MVP范围：桌面端 + AI Agent核心框架 + 6个核心部门模块 + 部门权限系统 + 公告消息通知
- 验收标准

**约束力：**
- ❌ 不得实现PRD之外的功能
- ❌ 不得省略PRD定义的功能点
- ✅ 实现细节可在架构框架内调整

### 2️⃣ 架构文档 - 技术铁律
📄 **位置：** `_bmad-output/planning-artifacts/architecture.md`

**内容要点：**
- 技术栈选型：Tauri + Rust (桌面端) + React + TypeScript (前端) + Shadcn/ui + Tailwind CSS
- 分层微内核架构：Presentation Layer → Agent Core Layer → Plugin Layer → Data Layer → Cloud Layer
- LLM接入：适配器模式（OpenAI兼容格式），支持百炼、智谱AI、Minimax、DeepSeek等
- 工具系统：混合模式（Core Tools + MCP Tools + Plugin Tools）
- 记忆系统：三层架构（个人记忆 + 企业知识库 + 图记忆）
- 命名约定：`{plugin}_{entity}_{action}` 格式
- 本地优先存储：SQLite + 增量同步 + 智能冲突解决
- 多租户：数据库级隔离

**约束力：**
- ❌ 不得更换技术栈核心组件
- ❌ 不得违背模块边界
- ❌ 不得绕过安全设计（TLS 1.3、AES-256加密）
- ✅ 具体实现方案可在架构框架内优化

### 3️⃣ UX设计规范 - 体验铁律
📄 **位置：** `_bmad-output/planning-artifacts/ux-design-specification.md`

**内容要点：**
- 设计方向：VSCode风格四栏布局（活动栏 + 侧边栏 + 工作区 + AI对话面板）
- 组件库：Shadcn/ui（可复制、可修改）
- 样式方案：Tailwind CSS
- 颜色系统：深蓝色系品牌色 (#1E3A5F)
- 图标库：Lucide React
- 核心交互：和AI说话就能完成任务（透明 + 可控）
- 体验原则：AI即入口、透明可控、零学习成本、即时价值、插件化扩展

**约束力：**
- ❌ 不得违背颜色系统和状态色定义
- ❌ 不得违背组件设计规范
- ❌ 不得改变核心布局结构
- ✅ 细节样式可在规范内微调

### 4️⃣ Epic 文档 - 实现铁律
📄 **位置：** `_bmad-output/planning-artifacts/epics.md`

**内容要点：**
- 多个 Epic 定义
- 详细的用户故事（Story）拆分
- 需求覆盖映射表（FR/NFR/ARCH/UX）
- 验收标准（Acceptance Criteria）

**Epic 列表：**
| Epic | 名称 | Stories |
|:----:|------|:-------:|
| 1 | 桌面端UI与系统交互 | 多个故事 |
| 2 | AI Agent核心能力 | 多个故事 |
| 3 | 部门模块系统 | 多个故事 |
| 4 | 用户与权限管理 | 多个故事 |
| 5 | 多租户管理 | 多个故事 |
| 6 | 数据同步与存储 | 多个故事 |
| ... | ... | ... |

**约束力：**
- ❌ 不得实现 Epic 之外的功能
- ❌ 不得跳过 Story 或省略验收标准
- ✅ 实现细节可在验收标准框架内调整

### 5️⃣ 测试规范铁律 - 质量铁律
📄 **位置：** `_bmad-output/planning-artifacts/testing-specification.md`

**内容要点：**
- 分层测试策略：单元测试 → 集成测试 → E2E 测试（测试金字塔）
- Mock 使用原则：Mock at the boundary, test your stack end-to-end
- E2E 测试必须使用真实 API，禁止 Mock 自有后端
- 集成测试使用 Testing Library，Mock 外部依赖
- 单元测试纯函数优先，完全 Mock 外部依赖
- 测试数据管理：Fixtures + Helpers
- 测试覆盖率要求：单元 ≥ 80%，集成 ≥ 60%，E2E 核心流程 100%
- 反模式清单：禁止 E2E Mock 自有 API、禁止测试间共享状态等

**Mock 使用决策表：**
| 场景 | 是否 Mock |
|------|----------|
| 自有 REST/GraphQL API | ❌ 永不 |
| 自有数据库 | ❌ 永不 |
| 认证系统 | ⚠️ 使用 storageState |
| 第三方服务（支付/邮件/OAuth） | ✅ 总是 |
| LLM API | ✅ 总是 |
| CDN/静态资源 | ❌ 永不 |

**约束力：**
- ❌ 不得违背分层测试策略
- ❌ E2E 测试不得 Mock 自有 API
- ❌ 不得提交失败的测试
- ✅ 新功能必须包含对应测试
- ✅ 测试代码遵循与业务代码相同的质量标准

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

### 测试规范合规
- [ ] 单元测试覆盖核心业务逻辑（如适用）
- [ ] 集成测试覆盖模块间交互（如适用）
- [ ] E2E 测试不 Mock 自有 API
- [ ] 测试命名符合规范（描述行为，非实现）
- [ ] 使用语义化选择器（role/label/testId）
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
5. **测试规范铁律**：`_bmad-output/planning-artifacts/testing-specification.md`

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
- **使用 Shadcn/ui 组件和 Lucide React 图标**

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

## 完整项目目录结构

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
│   │   │   ├── alert.tsx
│   │   │   ├── button.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   ├── layout/                     # 布局入口
│   │   │   ├── AppLayout.tsx           # 布局入口导出
│   │   │   └── TopBar.tsx              # 顶部菜单栏导出
│   │   ├── common/                     # 业务通用组件
│   │   │   ├── AppLayout.tsx           # 应用布局
│   │   │   ├── TopBar.tsx              # 顶部菜单栏
│   │   │   ├── ActivityBar.tsx         # 活动栏
│   │   │   ├── Sidebar.tsx             # 侧边栏
│   │   │   ├── Workbench.tsx           # 工作区
│   │   │   ├── AiChatPanel.tsx         # AI 对话面板
│   │   │   ├── StatusBar.tsx           # 状态栏
│   │   │   └── ResizablePanel.tsx      # 可调节面板
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
├── 📁 业务插件 (plugins/)
│   ├── hr/                             # 人事管理插件 (P0)
│   │   ├── package.json
│   │   ├── index.ts                    # 插件入口
│   │   ├── manifest.json               # 插件清单
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── backend/
│   │
│   ├── finance/                        # 财务OCR插件 (P1)
│   ├── knowledge/                      # 知识库RAG插件 (P1)
│   ├── warehouse/                      # 仓库管理插件 (P2)
│   ├── sales/                          # 销售自动化插件 (P1)
│   ├── service/                        # 售后工单插件 (P1)
│   ├── tender/                         # 标书制定插件 (P2)
│   └── dashboard/                      # 数据看板插件 (P1)
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

---

## 💻 Commands

```bash
# 前端开发 (React + TypeScript + Vite)
npm install           # 安装依赖
npm run dev           # 启动开发服务器
npm run build         # 生产构建
npm run lint          # 代码检查
npm run preview       # 预览构建结果

# Tauri 开发 (Rust 桌面端)
npm run tauri dev     # 启动 Tauri 开发模式
npm run tauri build  # 构建桌面应用
npm run tauri build -- --debug  # 调试构建

# 开发环境配置
cp .env.example .env  # 复制环境变量模板
# 配置以下变量：
# - VITE_API_URL: 云端API地址
# - VITE_WS_URL: WebSocket地址
```

---

## 📝 Coding Conventions

### TypeScript/React 规范
- TypeScript strict mode
- 使用 Shadcn/ui 组件库（基于 Radix UI）
- 组件命名：PascalCase（如 `ChatPanel.tsx`）
- 文件命名：kebab-case（如 `use-chat.ts`）
- Hooks 命名：`use{Feature}.ts` 格式

### 样式规范
- 使用 Tailwind CSS 进行样式开发
- 遵循 UX 设计规范的颜色系统（#1E3A5F 主色）
- 使用 shadcn/ui 设计令牌系统
- **图标统一使用 Lucide React**，禁止使用 emoji

### Rust/Tauri 规范
- 遵循 Rust 官方代码风格
- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 进行代码检查
- 模块划分清晰，遵循微内核架构

### 工具命名规范
- 工具命名采用 `{plugin}_{entity}_{action}` 格式
- 示例：`hr_employee_create`、`finance_invoice_process`

### 数据库规范
- 遵循 PRD 数据字典定义
- 使用 SQLite 本地存储 + 云端同步
- 表名：snake_case
- 敏感数据使用 AES-256 加密存储

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
10. **无 emoji** - 图标统一使用 Lucide React
11. **AI Agent 优先** - 核心交互是对话驱动，优先考虑自然语言交互场景
12. **本地优先** - 数据存储采用本地优先 + 增量同步策略
13. **UI占位不适用模拟数据** - 前端 UI 占位符不使用模拟数据，如有需要仅展示功能描述

## 🚀 快速启动清单

**新会话启动清单：**

1. [ ] 阅读本 AGENTS.md 文件
2. [ ] 阅读 PRD 文档（`_bmad-output/planning-artifacts/prd.md`）
3. [ ] 阅读架构文档（`_bmad-output/planning-artifacts/architecture.md`）
4. [ ] 阅读 UX 设计规范（`_bmad-output/planning-artifacts/ux-design-specification.md`）
5. [ ] 阅读 Epic 文档（`_bmad-output/planning-artifacts/epics.md`）
6. [ ] 查看 task.json 选择任务
7. [ ] 安装依赖：`npm install`
8. [ ] 启动开发：`npm run dev`
9. [ ] 开始工作！

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
│  9. 按照OpenSpec 变更文档设计实现(调用opensx-apply skill)功能代码                      │
│     ↓                                                       │
│  10. 执行测试验证                                            │
│     → lint / build / playwright mcp浏览器测试                │
│     ↓                                                       │
│  11. 更新 progress.txt/标记tasks.md中的内容为已完成                   │
│     ↓                                                       │
│  12. 更新 task.json (passes: true)                           │
│     ↓                                                       │
│  13. 提交 git commit                                         │
│     ↓                                                       │
│  14. 返回 Step 4，读取 task.json，选择 passes=false 的任务，执行到 Step14，不断循环执行，直到所有任务 passes=true │
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
新增注意事项：Qdrant 云端只接受数字或 UUID 格式的 ID
现有测试框架：参考：I:\AI-Automated-office\tests\README.md
UI原型图设计使用：pencil mcp