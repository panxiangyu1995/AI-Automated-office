# KiloCode SubAgent 架构参考实现文档

> 本文档作为 AI-Automated-office 项目参考 KiloCode subagent 架构设计的开发依据
> 参考仓库：`i:/AI-Automated-office/开源库参考项目/kilocode`
> 生成时间：2026-03-30

---

## 一、核心概念定义

### 1.1 Agent Mode 分类

KiloCode 将 Agent 分为三种模式：

| Mode | 名称 | 说明 | 可作为默认 |
|------|------|------|-----------|
| `primary` | 主 Agent | 执行主要任务，可调用 subagent | Yes |
| `subagent` | 子 Agent | 被主 agent 委托执行特定任务 | No |
| `all` | 通用 Agent | 既可作为主 agent 也可作为 subagent | Yes |

**关键约束**：
- `subagent` 模式的 agent 不可设置为默认 agent
- `hidden` 的 agent 不在 UI 中显示
- `native` 表示内置 agent，不可删除

### 1.2 Agent.Info Schema

```typescript
// packages/opencode/src/agent/agent.ts:32-58
export const Info = z.object({
  name: z.string(),
  displayName: z.string().optional(),  // 人类可读名称，用于 org modes
  description: z.string().optional(),
  mode: z.enum(["subagent", "primary", "all"]),
  native: z.boolean().optional(),
  hidden: z.boolean().optional(),
  topP: z.number().optional(),
  temperature: z.number().optional(),
  color: z.string().optional(),        // UI 显示颜色
  permission: PermissionNext.Ruleset,  // 权限规则集
  model: z.object({
    modelID: z.string(),
    providerID: z.string(),
  }).optional(),
  variant: z.string().optional(),
  prompt: z.string().optional(),
  options: z.record(z.string(), z.any()),
  steps: z.number().int().positive().optional(),
})
```

---

## 二、配置文件格式

### 2.1 文件存储结构

```
.opencode/agent/
├── docs.md           # 文档撰写 agent
├── duplicate-pr.md   # PR 去重 agent
├── translator.md     # 翻译 agent
└── triage.md        # 分诊 agent
```

### 2.2 Markdown + YAML Front Matter 格式

```yaml
---
description: Translate content for a specified locale while preserving technical terms
mode: subagent
model: kilo/google/gemini-3.1-pro-preview
color: "#38A3EE"
---

You are a professional translator and localization specialist.

Translate the user's content into the requested target locale (language + region, e.g. fr-FR).

Requirements:
- Preserve meaning, intent, tone, and formatting
- Preserve all technical terms and artifacts exactly
- Do not modify fenced code blocks
- Output ONLY the translation (no commentary)
```

### 2.3 配置元数据字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `description` | string | Yes | Agent 功能描述 |
| `mode` | enum | Yes | `subagent` / `primary` / `all` |
| `model` | string | No | 指定模型，格式：`provider/model` |
| `color` | string | No | UI 显示颜色，hex 格式 |
| `hidden` | boolean | No | 是否在 UI 隐藏 |
| `disable` | boolean | No | 是否禁用 |

---

## 三、内置 Agent 定义

### 3.1 Primary Agents

```typescript
// packages/opencode/src/agent/agent.ts:135-260

code: {
  name: "code",
  description: "The default agent. Executes tools based on configured permissions.",
  mode: "primary",
  native: true,
  permission: PermissionNext.merge(defaults, user, {
    question: "allow",
    plan_enter: "allow",
  }),
}

plan: {
  name: "plan",
  description: "Plan mode. Disallows all edit tools.",
  mode: "primary",
  native: true,
  permission: PermissionNext.merge(defaults, user, {
    question: "allow",
    plan_exit: "allow",
  }),
}

debug: {
  name: "debug",
  description: "Diagnose and fix software issues with systematic debugging methodology.",
  mode: "primary",
  native: true,
  prompt: PROMPT_DEBUG,
}

orchestrator: {
  name: "orchestrator",
  description: "Coordinate complex tasks by delegating to specialized agents in parallel.",
  mode: "primary",
  native: true,
  prompt: PROMPT_ORCHESTRATOR,
  permission: PermissionNext.merge(defaults, user, {
    "*": "deny",
    read: "allow",
    grep: "allow",
    question: "allow",
    task: "allow",
    webfetch: "allow",
    websearch: "allow",
    bash: "deny",  // 禁止 shell，防止 orchestrator 直接写文件
  }),
}

ask: {
  name: "ask",
  description: "Get answers and explanations without making changes to the codebase.",
  mode: "primary",
  native: true,
  permission: PermissionNext.merge(defaults, user, {
    "*": "deny",
    read: "allow",
    grep: "allow",
    question: "allow",
  }),
}
```

### 3.2 Subagent Agents

```typescript
general: {
  name: "general",
  description: "General-purpose agent for researching complex questions and executing multi-step tasks.",
  mode: "subagent",
  native: true,
  permission: PermissionNext.merge(defaults, user, {
    todoread: "deny",
    todowrite: "deny",
  }),
}

explore: {
  name: "explore",
  description: `Fast agent specialized for exploring codebases. Use when you need to quickly find files,
search code for keywords, or answer questions about the codebase.`,
  mode: "subagent",
  native: true,
  prompt: PROMPT_EXPLORE,
  permission: PermissionNext.merge(defaults, user, {
    "*": "deny",
    grep: "allow",
    glob: "allow",
    list: "allow",
    bash: "allow",
    read: "allow",
  }),
}
```

### 3.3 Hidden Agents (系统使用)

| Agent | 用途 | 说明 |
|-------|------|------|
| `compaction` | 上下文压缩 | hidden，不在 UI 显示 |
| `title` | 会话标题生成 | hidden，温度 0.5 |
| `summary` | 会话摘要生成 | hidden，只读权限 |

---

## 四、权限系统

### 4.1 PermissionNext.Ruleset 结构

```typescript
// 权限规则示例
permission: PermissionNext.merge(
  defaults,                    // 默认规则
  PermissionNext.fromConfig({ // 用户配置
    question: "allow",
    plan_enter: "allow",
  }),
  user,                        // 用户级别覆盖
)

// 默认规则定义
const defaults = PermissionNext.fromConfig({
  "*": "allow",
  bash: {
    "*": "ask",
    // 安全的 read-only 命令
    "cat *": "allow",
    "head *": "allow",
    "tail *": "allow",
    "ls *": "allow",
    "grep *": "allow",
    // 写操作需要确认
    "tsc *": "allow",
  },
  doom_loop: "ask",
  question: "deny",
  plan_enter: "deny",
  plan_exit: "deny",
  read: {
    "*": "allow",
    "*.env": "ask",
    "*.env.*": "ask",
  },
})
```

### 4.2 权限操作类型

| 操作 | 说明 | 可能的值 |
|------|------|---------|
| `bash` | Shell 命令执行 | `allow` / `ask` / `deny` |
| `read` | 文件读取 | `allow` / `ask` / `deny` |
| `edit` | 文件编辑 | `allow` / `ask` / `deny` |
| `question` | 提问工具 | `allow` / `ask` / `deny` |
| `plan_enter` | 进入计划模式 | `allow` / `ask` / `deny` |
| `plan_exit` | 退出计划模式 | `allow` / `ask` / `deny` |
| `webfetch` | Web 请求 | `allow` / `ask` / `deny` |
| `websearch` | Web 搜索 | `allow` / `ask` / `deny` |
| `mcp_*` | MCP 工具 | `allow` / `ask` / `deny` |

### 4.3 权限匹配规则

- 规则按优先级顺序匹配
- `deny` 优先于 `allow`
- 用户配置可覆盖默认规则
- 支持 glob 模式匹配

---

## 五、Agent 切换机制

### 5.1 Per-Session Agent Selection

```typescript
// packages/kilo-vscode/webview-ui/src/context/session.tsx:1168-1188

function selectAgent(name: string) {
  const id = currentSessionID()
  if (id) {
    // 已存在会话：直接切换
    setStore("agentSelections", id, name)
    // 清除 per-session model override
    setStore("sessionOverrides", produce((overrides) => {
      delete overrides[id]
    }),)
  } else {
    // 无会话时：设置 pending selection
    setPendingAgentSelection(name)
    // 为新 agent 初始化 model
    if (!userSetAgents()[name] && !store.modelSelections[name]) {
      setStore("modelSelections", name, resolveModel(name))
    }
  }
}
```

### 5.2 Model Selection 优先级

```
per-session override
  > user override (全局 per-agent)
    > per-mode config (config.agent.{name}.model)
      > global config (config.model)
        > VS Code default
          > kilo-auto/free
```

### 5.3 切换时的 Model 处理

```typescript
// 切换 agent 时清除 model override，确保新 agent 使用其配置的 model
setStore("sessionOverrides", produce((overrides) => {
  delete overrides[id]
}),)

// 如果用户没有为新 agent 设置过 model，则初始化为默认值
if (!userSetAgents()[name] && !store.modelSelections[name]) {
  setStore("modelSelections", name, resolveModel(name))
}
```

---

## 六、UI 实现

### 6.1 ModeSwitcher 组件

**位置**：`packages/kilo-vscode/webview-ui/src/components/shared/ModeSwitcher.tsx`

**设计理念**：轻量级下拉选择器，集成在聊天输入框旁边

```typescript
export const ModeSwitcher: Component = () => {
  const session = useSession()

  return (
    <ModeSwitcherBase
      agents={session.agents()}
      value={session.selectedAgent()}
      onSelect={(name) => {
        session.selectAgent(name)
        // 切换后自动聚焦回输入框
        requestAnimationFrame(() => window.dispatchEvent(new Event("focusPrompt")))
      }}
    />
  )
}
```

**交互特性**：
- 键盘导航（↑↓ 选择，Enter 确认）
- 监听 `openModePicker` 事件（命令触发）
- 仅当存在多个 agent 时显示

### 6.2 Agent 设置界面

**位置**：`packages/kilo-vscode/webview-ui/src/components/settings/AgentBehaviourTab.tsx`

**Tab 结构**：

| Tab | 功能 |
|-----|------|
| Agents | 管理 agent 列表、创建/编辑/删除 |
| MCP Servers | MCP 服务器配置 |
| Rules | 指令文件管理 |
| Workflows | 工作流配置 |
| Skills | 技能路径和 URL 管理 |

### 6.3 Agent 列表展示

```typescript
// 列表项包含：
// - Agent 名称和描述
// - 模板类型 badge (native/custom)
// - 状态 badge (enabled/disabled/hidden)
// - 创建时间、使用次数、上次使用时间
// - 可展开查看详细配置（role、skills、tools、permissions）
```

### 6.4 创建/编辑 Dialog

```typescript
// 表单字段：
// - Name (必填)
// - Description (必填)
// - Template (选择模板)
// - Role (角色定义 textarea)
// - Skills (逗号分隔)
// - Tools (逗号分隔)
// - MCP Tools (逗号分隔)
// - Permissions (逗号分隔)
```

---

## 七、配置合并机制

### 7.1 Config 合并逻辑

```typescript
// packages/opencode/src/agent/agent.ts:357-393

for (const [key, value] of Object.entries(cfg.agent ?? {})) {
  const effectiveKey = key === "build" ? "code" : key  // 兼容旧名称

  if (value.disable) {
    delete result[effectiveKey]
    continue
  }

  let item = result[effectiveKey]
  if (!item) {
    // 创建新的 custom agent
    item = result[effectiveKey] = {
      name: effectiveKey,
      mode: "all",
      permission: PermissionNext.merge(defaults, user),
      options: {},
      native: false,
    }
  }

  // 合并配置
  if (value.model) item.model = Provider.parseModel(value.model)
  item.variant = value.variant ?? item.variant
  item.prompt = value.prompt ?? item.prompt
  item.description = value.description ?? item.description
  item.temperature = value.temperature ?? item.temperature
  item.topP = value.top_p ?? item.topP
  item.mode = value.mode ?? item.mode
  item.color = value.color ?? item.color
  item.hidden = value.hidden ?? item.hidden
  item.options = mergeDeep(item.options, value.options ?? {})
  item.permission = PermissionNext.merge(item.permission, PermissionNext.fromConfig(value.permission ?? {}))
}
```

### 7.2 配置优先级

```
Native Agent 默认配置
  ↓ (merge)
Config 中的 agent 配置 (config.agent.{name})
  ↓ (merge)
用户级别权限配置
  ↓ (merge)
Agent 特定权限配置
```

---

## 八、我们的差距与改进建议

### 8.1 核心差距

| 维度 | KiloCode | 我们项目 | 差距 |
|------|----------|---------|------|
| **配置存储** | 文件系统 + Markdown | 代码定义 + 前端表单 | 灵活性差 |
| **配置格式** | YAML front matter | Rust struct | 可移植性差 |
| **权限模型** | PermissionNext.Ruleset (细粒度) | allowed/denied tools (粗粒度) | 安全性低 |
| **Agent 分类** | primary/subagent/all | 无明确分类 | 概念模糊 |
| **切换 UI** | ModeSwitcher (轻量) | 注册表 (重量) | 体验差 |
| **Per-session** | 完全支持 | 部分支持 | 不完整 |

### 8.2 改进建议

#### Phase 1: 短期改进（可在现有架构内实现）

**1. 增加轻量 ModeSwitcher 组件**
- 参考 `ModeSwitcher.tsx` 实现
- 集成在聊天输入框旁边
- 支持键盘导航

**2. 配置文件支持**
- 新增从 `.md` 文件加载 agent 配置的能力
- 使用与 KiloCode 相似的 YAML front matter 格式

**3. Per-session Agent Selection 完善**
- 确保切换 agent 时正确处理 model override
- 支持 pending selection

#### Phase 2: 中期改进（架构调整）

**1. 明确 Agent Mode 分类**
- 引入 `primary` / `subagent` / `all` 概念
- subagent 不可作为默认 agent

**2. 权限模型增强**
- 支持操作级别的权限控制
- 引入 `PermissionNext.Ruleset` 概念

**3. 配置文件格式标准化**
- 采用 Markdown + YAML front matter 格式
- 支持从文件系统加载 agent 配置

#### Phase 3: 长期改进（完整对齐）

**1. 配置合并机制**
- 实现多层配置合并
- 支持用户级别和 agent 级别的覆盖

**2. UI/UX 优化**
- 参考 KiloCode 的 Agent 设置界面
- 提供更精细的 agent 管理功能

---

## 九、参考文件索引

### 9.1 KiloCode 核心文件

| 文件 | 说明 |
|------|------|
| `packages/opencode/src/agent/agent.ts` | Agent 定义和配置管理 |
| `packages/kilo-vscode/webview-ui/src/context/session.tsx` | 会话上下文和 agent 切换 |
| `packages/kilo-vscode/webview-ui/src/components/shared/ModeSwitcher.tsx` | Mode 切换组件 |
| `packages/kilo-vscode/webview-ui/src/components/settings/AgentBehaviourTab.tsx` | Agent 设置界面 |
| `.opencode/agent/*.md` | Agent 配置文件示例 |

### 9.2 我们项目相关文件

| 文件 | 说明 |
|------|------|
| `src-tauri/src/agent/routing.rs` | SubAgent 路由服务 |
| `src-tauri/src/agent/nested.rs` | SubAgent 嵌套执行 |
| `src-tauri/src/agent/execution.rs` | SubAgent 执行 |
| `src/features/settings/components/SubAgentRegistry.tsx` | SubAgent 注册表 UI |
| `src/features/settings/components/SubAgentRouting.tsx` | 路由配置 UI |

---

## 十、总结

KiloCode 在 SubAgent 架构设计上提供了优秀的参考：

1. **清晰的概念模型**：primary / subagent / all 三种模式
2. **灵活的配置文件**：Markdown + YAML front matter 格式
3. **精细的权限控制**：PermissionNext.Ruleset 系统
4. **优秀的交互体验**：轻量级 ModeSwitcher

建议我们项目分阶段参考 KiloCode 的设计，逐步完善 SubAgent 架构。

---

*文档版本：1.0.0*
*参考版本：KiloCode latest*
