# 八、技术栈总结

## 8.1 运行时环境

### 8.1.1 Bun（主要运行时）

| 特性 | 说明 |
|-----|------|
| **启动速度** | 比 Node.js 快 4 倍 |
| **内置功能** | 打包器、测试框架、包管理器 |
| **兼容性** | Node.js API 兼容 |
| **TypeScript** | 原生支持，无需编译 |

```json
{
  "scripts": {
    "dev": "bun run --hot packages/opencode/src/index.ts",
    "build": "bun build ./packages/opencode/src/index.ts --outdir ./dist",
    "test": "bun test"
  }
}
```

### 8.1.2 Node.js（备选运行时）

通过 `bun-types` 和 `@types/node` 实现跨运行时兼容：

```typescript
// 运行时检测
const isBun = typeof Bun !== "undefined"
const isNode = !isBun && typeof process !== "undefined"
```

## 8.2 包管理

### 8.2.1 Monorepo 结构

```
packages/
├── opencode/        # CLI 核心
├── app/             # 前端应用
└── internal/        # 内部包
```

### 8.2.2 Workspace 配置

```json
// package.json
{
  "workspaces": [
    "packages/*"
  ]
}
```

### 8.2.3 依赖管理

```json
{
  "dependencies": {
    "ai": "^5.0.0-beta",           // Vercel AI SDK
    "hono": "^4.10.7",             // Web 框架
    "zod": "^3.25.76",             // Schema 验证
    "effect": "^3.17.10",          // 函数式编程
    "solid-js": "^1.9.10"          // UI 框架
  },
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/bun": "^1.2.19",
    "drizzle-kit": "^0.31.4"
  }
}
```

## 8.3 核心依赖详解

### 8.3.1 Vercel AI SDK

**用途:** LLM 调用和流式处理

```typescript
import { streamText, tool } from "ai"

const stream = await streamText({
  model,
  messages,
  tools: {
    bash: tool({
      description: "Execute bash command",
      parameters: z.object({ command: z.string() }),
      execute: async ({ command }) => { ... }
    })
  }
})

for await (const part of stream.fullStream) {
  // 处理流式响应
}
```

**关键特性:**
- 多模型支持（OpenAI、Anthropic、Google 等）
- 工具调用标准化
- 流式响应处理
- Token 计数

### 8.3.2 Hono

**用途:** Web 服务器框架

```typescript
import { Hono } from "hono"
import { cors, logger } from "hono/middleware"

const app = new Hono()

app.use("*", cors())
app.use("*", logger())

app.get("/api/hello", (c) => {
  return c.json({ message: "Hello" })
})

export default app
```

**关键特性:**
- 零依赖
- 中间件生态
- 多运行时支持
- OpenAPI 集成

### 8.3.3 Zod

**用途:** Schema 验证

```typescript
import { z } from "zod"

const ToolParams = z.object({
  command: z.string().describe("The command to execute"),
  timeout: z.number().optional().default(30000)
})

type ToolParamsType = z.infer<typeof ToolParams>

// 验证
const result = ToolParams.safeParse(input)
if (!result.success) {
  console.error(result.error.flatten())
}
```

**关键特性:**
- TypeScript 类型推断
- 详细的错误信息
- 组合式 Schema
- 描述注解

### 8.3.4 Effect

**用途:** 函数式编程和错误处理

```typescript
import { Effect, Schema } from "effect"

// 定义品牌类型
const SessionID = Schema.String.pipe(
  Schema.brand("SessionID")
)

// 使用 Effect 处理异步操作
const program = Effect.gen(function* (_) {
  const session = yield* _(getSession(id))
  const messages = yield* _(getMessages(session.id))
  return { session, messages }
})

// 运行
Effect.runPromise(program)
```

**关键特性:**
- 品牌类型（Branded Types）
- 结构化错误处理
- 依赖注入
- 资源管理

### 8.3.5 SolidJS

**用途:** 前端 UI 框架

```typescript
import { createSignal, createEffect, For, Show } from "solid-js"

function Counter() {
  const [count, setCount] = createSignal(0)
  
  createEffect(() => {
    console.log("Count changed:", count())
  })
  
  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
    </div>
  )
}
```

**关键特性:**
- 细粒度响应式
- 无虚拟 DOM
- 编译时优化
- 类 React API

### 8.3.6 Drizzle ORM

**用途:** 数据库 ORM

```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { drizzle } from "drizzle-orm/bun-sqlite"
import { eq } from "drizzle-orm"

// 定义表
const users = sqliteTable("users", {
  id: integer().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique()
})

// 查询
const db = drizzle(sqlite)
const user = await db.select().from(users).where(eq(users.id, 1))
```

**关键特性:**
- 类型安全
- SQL-like 语法
- 迁移工具
- 多数据库支持

## 8.4 开发工具

### 8.4.1 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "paths": {
      "@opencode/*": ["./packages/*/src"]
    }
  }
}
```

### 8.4.2 Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:4096"
      }
    }
  }
})
```

### 8.4.3 Biome（Linter/Formatter）

```json
// biome.json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

## 8.5 外部服务集成

### 8.5.1 LLM 提供商

| 提供商 | 模型示例 | 特点 |
|-------|---------|------|
| OpenAI | GPT-4o, o1 | 主流选择 |
| Anthropic | Claude 3.5 | 长上下文 |
| Google | Gemini 2.0 | 多模态 |
| AWS Bedrock | 多模型 | 企业级 |
| Groq | Llama | 快速推理 |
| Ollama | 本地模型 | 私有化 |

### 8.5.2 MCP 服务器

| 服务器 | 功能 |
|-------|------|
| filesystem | 文件系统操作 |
| postgres | 数据库查询 |
| github | GitHub API |
| puppeteer | 浏览器自动化 |
| slack | Slack 集成 |

## 8.6 技术选型决策

### 8.6.1 为什么选择这些技术？

| 决策 | 原因 |
|-----|------|
| **Bun 而非 Node** | 更快的启动和执行速度 |
| **Hono 而非 Express** | 更轻量，更好的类型支持 |
| **SolidJS 而非 React** | 更好的性能，更小的体积 |
| **SQLite 而非 PostgreSQL** | 本地优先，零配置 |
| **Zod 而非 Yup** | 更好的 TypeScript 集成 |
| **Effect 而非 io-ts** | 更完整的函数式编程方案 |

### 8.6.2 架构权衡

| 权衡 | 选择 | 放弃 |
|-----|------|------|
| 性能 vs 易用性 | 性能 | 部分易用性 |
| 类型安全 vs 灵活性 | 类型安全 | 部分灵活性 |
| 本地优先 vs 云优先 | 本地优先 | 云端协作 |
| 单体 vs 微服务 | 单体 | 微服务扩展性 |

## 8.7 对 AI-Automated-office 的参考价值

### 8.7.1 推荐技术栈

```yaml
运行时: Bun / Node.js
语言: TypeScript
后端框架: Hono
前端框架: SolidJS / React
数据库: SQLite (本地) + PostgreSQL (云端)
ORM: Drizzle
验证: Zod
LLM SDK: Vercel AI SDK
UI 组件: Kobalte / Shadcn
样式: TailwindCSS
构建: Vite
```

### 8.7.2 关键借鉴点

1. **本地优先** - 优先考虑本地部署和数据处理
2. **类型安全** - 全栈 TypeScript + Zod 验证
3. **轻量框架** - 选择轻量、高性能的框架
4. **流式处理** - 使用 SSE 实现实时通信
5. **模块化设计** - 清晰的模块边界和依赖关系

---

*下一章节: [09-reference-recommendations.md](./09-reference-recommendations.md) - 对 AI-Automated-office 的参考建议*
