# 二、Agent 系统实现

## 2.1 Agent 定义

### 2.1.1 Agent 接口

```typescript
interface AgentInfo {
  name: string           // Agent 标识符
  prompt: string         // 系统提示词
  mode: 'build' | 'plan' // 运行模式
  permission: object     // 权限规则集
  options: object        // 模型选项
  temperature: number    // 温度参数
  topP?: number         // Top-P 采样
}
```

### 2.1.2 内置 Agent

OpenCode 提供两个内置 Agent：

#### Build Agent（默认）

```typescript
{
  name: "build",
  mode: "build",
  prompt: BUILD_PROMPT,  // 完整的开发提示词
  permission: {
    // 允许所有操作
  },
  options: {},
  temperature: 0.3
}
```

**特点:**
- 完整的文件系统访问权限
- 可以执行任意 shell 命令
- 可以创建、编辑、删除文件
- 用于实际的开发工作

#### Plan Agent

```typescript
{
  name: "plan",
  mode: "plan",
  prompt: PLAN_PROMPT,  // 只读分析提示词
  permission: {
    // 默认拒绝写操作
    deny: ["write", "edit", "bash"]
  },
  options: {},
  temperature: 0.3
}
```

**特点:**
- 只读文件访问
- 执行 shell 命令需要用户确认
- 用于代码分析和规划
- 适合探索不熟悉的代码库

### 2.1.3 Agent 切换

用户可以通过 `Tab` 键在 build 和 plan Agent 之间切换。

## 2.2 Agent 核心函数

### 2.2.1 获取 Agent

```typescript
export async function get(name: string): Promise<AgentInfo>
```

**功能:** 根据名称获取 Agent 配置

**流程:**
1. 从配置中读取自定义 Agent
2. 如果不存在，返回内置 Agent
3. 合并默认值

### 2.2.2 列出所有 Agent

```typescript
export async function list(): Promise<AgentInfo[]>
```

**功能:** 返回所有可用 Agent

**返回:** 内置 Agent + 自定义 Agent

### 2.2.3 生成自定义 Agent

```typescript
export async function generate(input: {
  description: string
  model?: { providerID: ProviderID; modelID: ModelID }
}): Promise<{
  identifier: string
  whenToUse: string
  systemPrompt: string
}>
```

**功能:** 使用 AI 生成新的 Agent 配置

**流程:**
1. 接收用户描述
2. 构建系统提示词
3. 调用 LLM 生成配置
4. 返回结构化配置

**示例:**
```typescript
const agent = await Agent.generate({
  description: "一个专门用于代码审查的 Agent"
})
// 返回:
// {
//   identifier: "code-reviewer",
//   whenToUse: "当需要审查代码质量、发现潜在问题时使用",
//   systemPrompt: "你是一个专业的代码审查专家..."
// }
```

## 2.3 Agent 与 Session 的关系

### 2.3.1 Session 绑定 Agent

每个 Session 关联一个 Agent：

```typescript
interface Session {
  id: SessionID
  agent: string  // Agent 名称
  // ...
}
```

### 2.3.2 Agent 影响 Session 行为

Agent 配置影响 Session 的多个方面：

1. **系统提示词** - Agent.prompt 作为系统消息
2. **工具权限** - Agent.permission 控制工具执行
3. **模型参数** - Agent.temperature、topP 影响生成
4. **模型选项** - Agent.options 传递给模型

## 2.4 Agent 提示词系统

### 2.4.1 提示词结构

Agent 提示词由多个部分组成：

```
┌─────────────────────────────────────┐
│        Agent 核心提示词              │
│  (定义 Agent 的角色和能力)           │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        工具使用指南                  │
│  (如何使用各种工具)                  │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        项目上下文                    │
│  (当前项目的信息)                    │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│        用户自定义指令                │
│  (从 .opencode/instructions.md)     │
└─────────────────────────────────────┘
```

### 2.4.2 提示词文件位置

```
.opencode/
├── instructions.md      # 项目级自定义指令
├── agent/
│   ├── build.md        # build Agent 提示词
│   └── plan.md         # plan Agent 提示词
└── command/
    └── *.md            # 自定义命令
```

### 2.4.3 提示词转换

通过 Plugin Hook 可以动态修改系统提示词：

```typescript
await Plugin.trigger(
  "experimental.chat.system.transform",
  { sessionID, model },
  { system }  // 可修改
)
```

## 2.5 Agent 权限系统

### 2.5.1 权限规则结构

```typescript
interface PermissionRuleset {
  // 允许的模式列表
  allow?: string[]
  
  // 拒绝的模式列表
  deny?: string[]
  
  // 总是允许的模式（不询问用户）
  always?: string[]
  
  // 总是拒绝的模式
  never?: string[]
}
```

### 2.5.2 权限模式匹配

权限使用 glob 模式匹配：

```typescript
// 示例权限规则
{
  allow: ["*"],                    // 允许所有
  deny: ["rm -rf *"],              // 拒绝危险命令
  always: ["git status", "ls *"],  // 总是允许
  never: ["rm -rf /"]              // 总是拒绝
}
```

### 2.5.3 权限请求流程

```
工具需要权限
      │
      ▼
┌──────────────┐
│ 检查 always   │──Yes──▶ 直接允许
└──────┬───────┘
       │ No
       ▼
┌──────────────┐
│ 检查 never    │──Yes──▶ 直接拒绝
└──────┬───────┘
       │ No
       ▼
┌──────────────┐
│ 检查 allow    │──No───▶ 询问用户
└──────┬───────┘
       │ Yes
       ▼
┌──────────────┐
│ 检查 deny     │──Yes──▶ 询问用户
└──────┬───────┘
       │ No
       ▼
    允许执行
```

## 2.6 Agent 与工具的交互

### 2.6.1 工具初始化时获取 Agent 信息

```typescript
export interface InitContext {
  agent?: AgentInfo  // 当前 Agent 信息
}

// 工具定义时可以访问 Agent
const MyTool = Tool.define("my-tool", async (ctx?: InitContext) => {
  const agent = ctx?.agent
  
  // 根据 Agent 调整行为
  if (agent?.mode === 'plan') {
    // 只读模式下的行为
  }
  
  return {
    description: "...",
    parameters: z.object({...}),
    async execute(args, ctx) {
      // ...
    }
  }
})
```

### 2.6.2 工具执行时的权限检查

```typescript
async execute(args, ctx) {
  // 请求权限
  await ctx.ask({
    permission: "bash",
    patterns: [args.command],
    always: [BashArity.prefix(args.command).join(" ") + " *"],
    metadata: {}
  })
  
  // 执行操作
  // ...
}
```

## 2.7 Agent 配置存储

### 2.7.1 配置文件位置

```
~/.config/opencode/
├── config.json        # 主配置文件
└── agents/            # 自定义 Agent 配置
    ├── code-reviewer.json
    └── test-generator.json
```

### 2.7.2 配置格式

```json
{
  "agents": {
    "code-reviewer": {
      "name": "code-reviewer",
      "prompt": "你是一个专业的代码审查专家...",
      "mode": "plan",
      "permission": {
        "deny": ["write", "edit", "bash"]
      },
      "temperature": 0.2
    }
  }
}
```

## 2.8 对 AI-Automated-office 的参考价值

### 2.8.1 部门 Agent 设计建议

基于 OpenCode 的 Agent 系统，AI-Automated-office 可以设计：

```typescript
interface DepartmentAgent {
  department: string      // 部门标识（hr, finance, sales...）
  name: string           // Agent 名称
  prompt: string         // 部门专属提示词
  capabilities: string[] // 能力列表
  permissions: {         // 权限配置
    data: string[]       // 可访问的数据
    actions: string[]    // 可执行的操作
  }
  tools: string[]        // 可用的工具
}
```

### 2.8.2 部门 Agent 示例

```typescript
const FinanceAgent: DepartmentAgent = {
  department: "finance",
  name: "财务助手",
  prompt: `你是财务部门的 AI 助手。
    你可以帮助处理：
    - 发票识别和录入
    - 台账生成
    - 应收应付管理
    - 财务数据分析
    ...`,
  capabilities: [
    "invoice_ocr",
    "ledger_generation",
    "financial_analysis"
  ],
  permissions: {
    data: ["finance.*", "sales.orders", "hr.employees"],
    actions: ["read", "write", "approve"]
  },
  tools: ["ocr", "excel", "report"]
}
```

### 2.8.3 关键借鉴点

1. **Agent 配置化** - 通过配置文件定义 Agent，无需修改代码
2. **权限分离** - 不同 Agent 有不同的权限边界
3. **提示词系统** - 支持自定义提示词扩展
4. **工具绑定** - Agent 可以绑定特定工具集

---

*下一章节: [03-tool-system.md](./03-tool-system.md) - 工具系统设计*
