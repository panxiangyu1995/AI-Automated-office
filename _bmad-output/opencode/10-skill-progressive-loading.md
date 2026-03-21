# 十、Skill 渐进式加载机制

## 10.1 概述

### 10.1.1 什么是 Skill？

**Skill** 是 OpenCode 中的一种可复用指令机制，用于为 Agent 提供特定领域的专业指导。与直接注入系统提示词不同，Skill 采用**渐进式加载**策略：

- **初始化阶段**：只扫描和索引 Skill 的元数据（名称、描述、位置）
- **调用阶段**：Agent 需要时才加载完整的 Skill 内容

### 10.1.2 渐进式加载的优势

| 优势 | 说明 |
|-----|------|
| **节省上下文** | 不一次性加载所有 Skill 内容，减少 Token 消耗 |
| **按需加载** | Agent 根据任务需要选择性地加载 Skill |
| **动态发现** | 运行时自动发现新增的 Skill |
| **权限控制** | 可以控制 Agent 对特定 Skill 的访问权限 |

## 10.2 Skill 定义格式

### 10.2.1 文件结构

每个 Skill 是一个包含 `SKILL.md` 文件的目录：

```
.opencode/skills/
├── git-release/
│   ├── SKILL.md           # 必需：Skill 定义文件
│   ├── scripts/           # 可选：脚本文件
│   │   └── release.sh
│   └── templates/         # 可选：模板文件
│       └── changelog.md
└── code-review/
    ├── SKILL.md
    └── checklist.md
```

### 10.2.2 SKILL.md 格式

```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.

## Instructions

1. First, check the current version...
2. Then, analyze merged PRs...
3. Finally, generate release notes...
```

### 10.2.3 Frontmatter 字段

| 字段 | 必需 | 说明 |
|-----|------|------|
| `name` | ✅ | Skill 名称，必须符合命名规范 |
| `description` | ✅ | 描述，1-1024 字符 |
| `license` | ❌ | 许可证 |
| `compatibility` | ❌ | 兼容性标识 |
| `metadata` | ❌ | 自定义元数据 |

### 10.2.4 名称验证规则

```typescript
// 正则表达式
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

// 规则
// 1. 长度 1-64 字符
// 2. 仅小写字母和数字
// 3. 可用单个连字符分隔
// 4. 不以 - 开头或结尾
// 5. 不包含连续的 --
// 6. 必须与目录名一致
```

## 10.3 Skill 发现机制

### 10.3.1 扫描位置

OpenCode 按优先级扫描以下位置：

```typescript
const EXTERNAL_DIRS = [".claude", ".agents"]
const EXTERNAL_SKILL_PATTERN = "skills/**/SKILL.md"
const OPENCODE_SKILL_PATTERN = "{skill,skills}/**/SKILL.md"
```

| 位置 | 类型 | 说明 |
|-----|------|------|
| `.opencode/skill/<name>/SKILL.md` | 项目级 | OpenCode 原生格式 |
| `.opencode/skills/<name>/SKILL.md` | 项目级 | OpenCode 原生格式（复数） |
| `.claude/skills/<name>/SKILL.md` | 项目级 | Claude 兼容格式 |
| `.agents/skills/<name>/SKILL.md` | 项目级 | 通用 Agent 格式 |
| `~/.config/opencode/skills/<name>/SKILL.md` | 全局级 | OpenCode 全局配置 |
| `~/.claude/skills/<name>/SKILL.md` | 全局级 | Claude 全局兼容 |
| `~/.agents/skills/<name>/SKILL.md` | 全局级 | Agent 全局兼容 |

### 10.3.2 目录遍历算法

```typescript
// 从当前工作目录向上遍历，直到 git worktree 根目录
for await (const root of Filesystem.up({
  targets: EXTERNAL_DIRS,
  start: instance.directory,
  stop: instance.project.worktree,
})) {
  await scan(state, root, EXTERNAL_SKILL_PATTERN, { dot: true, scope: "project" })
}
```

**遍历流程：**

```
当前目录: /project/src/components
         │
         ▼ 扫描 .claude/skills/, .agents/skills/
/project/src/components/
         │
         ▼ 向上一级
/project/src/
         │
         ▼ 向上一级
/project/
         │
         ▼ 到达 git worktree 根目录，停止
```

### 10.3.3 发现流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill 发现流程                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 全局目录扫描                                                │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ ~/.claude/skills/*/SKILL.md                         │    │
│     │ ~/.agents/skills/*/SKILL.md                         │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  2. 项目目录向上遍历                                            │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ 从 CWD 向上到 git worktree 根目录                    │    │
│     │ 扫描 .claude/skills/, .agents/skills/               │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  3. 配置目录扫描                                                │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ ~/.config/opencode/                                 │    │
│     │ config.skills.paths 中配置的路径                    │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  4. 远程 URL 发现                                               │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ config.skills.urls 中配置的远程仓库                  │    │
│     │ 下载 index.json，拉取 Skill 文件                     │    │
│     └─────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  5. 构建索引                                                    │
│     ┌─────────────────────────────────────────────────────┐    │
│     │ state.skills = {                                    │    │
│     │   "git-release": {                                  │    │
│     │     name: "git-release",                            │    │
│     │     description: "...",                             │    │
│     │     location: "/path/to/SKILL.md",                  │    │
│     │     content: "..." // 未加载                        │    │
│     │   }                                                 │    │
│     │ }                                                   │    │
│     └─────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 10.4 渐进式加载实现

### 10.4.1 核心数据结构

```typescript
// Skill 信息结构
export const Info = z.object({
  name: z.string(),           // Skill 名称
  description: z.string(),    // 描述
  location: z.string(),       // SKILL.md 文件路径
  content: z.string(),        // 完整内容（延迟加载）
})
export type Info = z.infer<typeof Info>

// 内部状态
type State = {
  skills: Record<string, Info>  // Skill 索引
  dirs: Set<string>             // Skill 目录集合
  task?: Promise<void>          // 加载任务（防止重复加载）
}
```

### 10.4.2 延迟初始化

```typescript
const create = (instance: InstanceContext.Shape, discovery: Discovery.Interface): Cache => {
  const state: State = {
    skills: {},
    dirs: new Set<string>(),
  }

  // 加载函数（只执行一次）
  const load = async () => {
    // 1. 扫描全局目录
    // 2. 扫描项目目录
    // 3. 扫描配置目录
    // 4. 拉取远程 Skill
    // ...
    log.info("init", { count: Object.keys(state.skills).length })
  }

  // 确保只加载一次
  const ensure = () => {
    if (state.task) return state.task  // 已在加载中
    state.task = load().catch((err) => {
      state.task = undefined
      throw err
    })
    return state.task
  }

  return { ...state, ensure }
}
```

### 10.4.3 Service 接口

```typescript
export interface Interface {
  // 获取单个 Skill（按名称）
  readonly get: (name: string) => Effect.Effect<Info | undefined>
  
  // 获取所有 Skill
  readonly all: () => Effect.Effect<Info[]>
  
  // 获取所有 Skill 目录
  readonly dirs: () => Effect.Effect<string[]>
  
  // 获取当前 Agent 可用的 Skill（过滤权限）
  readonly available: (agent?: Agent.Info) => Effect.Effect<Info[]>
}

// 实现
const get = Effect.fn("Skill.get")(function* (name: string) {
  yield* Effect.promise(() => state.ensure())  // 确保已加载
  return state.skills[name]
})

const available = Effect.fn("Skill.available")(function* (agent?: Agent.Info) {
  yield* Effect.promise(() => state.ensure())
  const list = Object.values(state.skills).toSorted((a, b) => a.name.localeCompare(b.name))
  if (!agent) return list
  // 根据权限过滤
  return list.filter((skill) => 
    PermissionNext.evaluate("skill", skill.name, agent.permission).action !== "deny"
  )
})
```

## 10.5 Skill 工具实现

### 10.5.1 工具定义

```typescript
export const SkillTool = Tool.define("skill", async (ctx) => {
  // 获取可用 Skill 列表
  const list = await Skill.available(ctx?.agent)

  // 动态生成描述（只包含名称和描述）
  const description = list.length === 0
    ? "Load a specialized skill... No skills are currently available."
    : [
        "Load a specialized skill that provides domain-specific instructions.",
        "",
        "When you recognize that a task matches one of the available skills,",
        "use this tool to load the full skill instructions.",
        "",
        "## Available Skills",
        ...list.map((skill) => `- **${skill.name}**: ${skill.description}`),
      ].join("\n")

  const parameters = z.object({
    name: z.string().describe(`The name of the skill from available_skills`),
  })

  return {
    description,
    parameters,
    async execute(params, ctx) {
      // 1. 获取 Skill
      const skill = await Skill.get(params.name)
      if (!skill) {
        throw new Error(`Skill "${params.name}" not found.`)
      }

      // 2. 请求权限
      await ctx.ask({
        permission: "skill",
        patterns: [params.name],
        always: [params.name],
        metadata: {},
      })

      // 3. 加载完整内容（此时才读取文件）
      // 4. 扫描关联文件
      const dir = path.dirname(skill.location)
      const files = await scanSkillFiles(dir)

      // 5. 返回格式化输出
      return {
        title: `Loaded skill: ${skill.name}`,
        output: [
          `<skill_content name="${skill.name}">`,
          `# Skill: ${skill.name}`,
          "",
          skill.content.trim(),
          "",
          `Base directory: ${pathToFileURL(dir).href}`,
          "<skill_files>",
          files,
          "</skill_files>",
          "</skill_content>",
        ].join("\n"),
        metadata: { name: skill.name, dir },
      }
    },
  }
})
```

### 10.5.2 工具描述示例

当 Agent 初始化时，`skill` 工具的描述如下：

```xml
<tool name="skill">
  <description>
    Load a specialized skill that provides domain-specific instructions.
    
    When you recognize that a task matches one of the available skills,
    use this tool to load the full skill instructions.
    
    ## Available Skills
    - **git-release**: Create consistent releases and changelogs
    - **code-review**: Perform thorough code reviews
    - **refactor**: Safe refactoring workflows
  </description>
</tool>
```

### 10.5.3 加载后输出示例

```
<skill_content name="git-release">
# Skill: git-release

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.

## Instructions

1. First, check the current version...
2. Then, analyze merged PRs...
3. Finally, generate release notes...

Base directory: file:///project/.opencode/skills/git-release/
<skill_files>
<file>/project/.opencode/skills/git-release/scripts/release.sh</file>
<file>/project/.opencode/skills/git-release/templates/changelog.md</file>
</skill_files>
</skill_content>
```

## 10.6 远程 Skill 发现

### 10.6.1 远程索引格式

远程 Skill 仓库需要提供 `index.json`：

```json
{
  "skills": [
    {
      "name": "git-release",
      "files": [
        "SKILL.md",
        "scripts/release.sh",
        "templates/changelog.md"
      ]
    },
    {
      "name": "code-review",
      "files": [
        "SKILL.md",
        "checklist.md"
      ]
    }
  ]
}
```

### 10.6.2 拉取流程

```typescript
const pull = Effect.fn("Discovery.pull")(function* (url: string) {
  const base = url.endsWith("/") ? url : `${url}/`
  const index = new URL("index.json", base).href

  // 1. 获取索引
  const data = yield* HttpClientRequest.get(index).pipe(
    HttpClientRequest.acceptJson,
    http.execute,
    Effect.flatMap(HttpClientResponse.schemaBodyJson(Index)),
  )

  // 2. 过滤有效 Skill
  const list = data.skills.filter((skill) => {
    return skill.files.includes("SKILL.md")
  })

  // 3. 并发下载文件
  const dirs = yield* Effect.forEach(list, (skill) =>
    Effect.gen(function* () {
      const root = path.join(cache, skill.name)
      
      yield* Effect.forEach(skill.files, (file) =>
        download(
          new URL(file, `${host}/${skill.name}/`).href,
          path.join(root, file)
        ),
        { concurrency: fileConcurrency }
      )
      
      return root
    }),
    { concurrency: skillConcurrency }
  )

  return dirs
})
```

### 10.6.3 配置远程 Skill

```json
// opencode.json
{
  "skills": {
    "urls": [
      "https://example.com/skills",
      "https://github.com/org/skills-repo"
    ]
  }
}
```

## 10.7 权限控制

### 10.7.1 权限配置

```json
// opencode.json
{
  "permission": {
    "skill": {
      "*": "allow",           // 默认允许所有
      "internal-*": "deny",   // 拒绝 internal- 开头的
      "experimental-*": "ask" // experimental- 开头的需要确认
    }
  }
}
```

### 10.7.2 权限效果

| 权限 | 行为 |
|-----|------|
| `allow` | Skill 立即加载，无需确认 |
| `deny` | Skill 对 Agent 隐藏，拒绝访问 |
| `ask` | 加载前提示用户确认 |

### 10.7.3 按 Agent 配置权限

```json
// opencode.json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"  // plan Agent 可以访问 internal-*
        }
      }
    }
  }
}
```

### 10.7.4 禁用 Skill 工具

```json
// opencode.json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false  // 完全禁用 skill 工具
      }
    }
  }
}
```

## 10.8 完整加载流程图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Skill 渐进式加载完整流程                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  阶段 1: 系统初始化                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. 创建 Skill.Service                                            │   │
│  │ 2. 初始化空状态 { skills: {}, dirs: Set, task: undefined }       │   │
│  │ 3. 不执行任何扫描                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  阶段 2: Agent 初始化                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. 调用 Skill.available(agent)                                   │   │
│  │ 2. 触发 state.ensure() → 执行扫描                                │   │
│  │ 3. 扫描所有位置，构建索引                                         │   │
│  │ 4. 只保存元数据，不加载完整内容                                   │   │
│  │ 5. 返回可用 Skill 列表（名称 + 描述）                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  阶段 3: 工具描述生成                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ skill 工具描述:                                                   │   │
│  │ "Load a specialized skill...                                     │   │
│  │  - **git-release**: Create consistent releases...                │   │
│  │  - **code-review**: Perform thorough code reviews..."            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  阶段 4: Agent 决策                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Agent 根据任务判断是否需要使用某个 Skill                          │   │
│  │ 例如：用户请求 "帮我发布一个新版本"                               │   │
│  │ Agent 识别匹配 git-release Skill                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  阶段 5: Skill 加载                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 1. Agent 调用 skill({ name: "git-release" })                     │   │
│  │ 2. 请求权限（如果需要）                                           │   │
│  │ 3. 读取 SKILL.md 完整内容                                        │   │
│  │ 4. 扫描关联文件                                                   │   │
│  │ 5. 返回格式化输出                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  阶段 6: 执行任务                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Agent 根据 Skill 内容执行任务                                     │   │
│  │ - 使用 Skill 中的指令                                             │   │
│  │ - 引用 Skill 中的脚本和模板                                       │   │
│  │ - 按照 Skill 定义的工作流执行                                     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 10.9 对 AI-Automated-office 的参考价值

### 10.9.1 部门 Skill 设计建议

```typescript
// 部门 Skill 定义
interface DepartmentSkill {
  name: string                    // Skill 名称
  department: string              // 所属部门
  description: string             // 描述
  triggers: string[]              // 触发关键词
  instructions: string            // 详细指令
  tools: string[]                 // 关联工具
  templates: Record<string, string>  // 模板文件
}

// 示例：财务部发票处理 Skill
const InvoiceProcessingSkill: DepartmentSkill = {
  name: "invoice-processing",
  department: "finance",
  description: "处理发票识别、录入和台账生成",
  triggers: ["发票", "invoice", "票据", "报销"],
  instructions: `
## 发票处理流程

1. **识别阶段**
   - 使用 OCR 工具识别发票信息
   - 验证发票真伪
   - 提取关键字段

2. **录入阶段**
   - 匹配公司抬头
   - 分类存储
   - 关联订单/合同

3. **台账生成**
   - 按月汇总
   - 生成应收/应付台账
   - 导出报表
`,
  tools: ["ocr", "invoice_create", "ledger_generate"],
  templates: {
    "invoice_template.xlsx": "发票录入模板",
    "ledger_template.xlsx": "台账模板"
  }
}
```

### 10.9.2 渐进式加载应用场景

| 场景 | 应用方式 |
|-----|---------|
| **部门工具指南** | 每个部门的工具使用指南作为 Skill |
| **业务流程模板** | 常见业务流程作为可加载的 Skill |
| **合规检查清单** | 行业合规要求作为 Skill |
| **最佳实践** | 部门最佳实践文档作为 Skill |

### 10.9.3 关键借鉴点

1. **元数据优先** - 初始化时只加载元数据，减少启动开销
2. **按需加载** - Agent 根据任务需要选择加载
3. **权限控制** - 细粒度控制 Skill 访问权限
4. **远程发现** - 支持从远程仓库拉取 Skill
5. **关联资源** - Skill 可以包含脚本、模板等资源文件

---

*本章节详细分析了 OpenCode 的 Skill 渐进式加载机制，为 AI-Automated-office 的部门 Skill 系统提供参考。*
