# 七、后端 API 设计

## 7.1 技术栈

### 7.1.1 核心框架

| 技术 | 用途 | 版本 |
|-----|------|------|
| **Hono** | Web 框架 | 4.10.7 |
| **Hono OpenAPI** | OpenAPI 集成 | 1.1.2 |
| **SQLite** | 数据库 | 内置 |
| **Drizzle ORM** | ORM | 1.0.0-beta |

### 7.1.2 为什么选择 Hono？

1. **轻量** - 零依赖，体积小
2. **快速** - 基于 Web 标准，性能优秀
3. **类型安全** - 完整的 TypeScript 支持
4. **多运行时** - 支持 Bun、Node、Deno、Cloudflare Workers

## 7.2 API 架构

### 7.2.1 服务器创建

```typescript
// server/server.ts
export function createApp() {
  const app = new Hono()
  
  // 中间件
  app.use("*", cors())
  app.use("*", logger())
  
  // 路由
  app.route("/session", SessionRoutes)
  app.route("/event", EventRoutes)
  app.route("/file", FileRoutes)
  app.route("/mcp", McpRoutes)
  app.route("/permission", PermissionRoutes)
  app.route("/provider", ProviderRoutes)
  app.route("/config", ConfigRoutes)
  app.route("/project", ProjectRoutes)
  
  // 错误处理
  app.onError((err, c) => {
    log.error("Unhandled error", { error: err })
    return c.json({ error: err.message }, 500)
  })
  
  return app
}

export async function listen(port: number = 4096) {
  const app = createApp()
  
  const server = Bun.serve({
    port,
    fetch: app.fetch,
    development: process.env.NODE_ENV !== "production"
  })
  
  log.info("Server started", { port })
  return server
}
```

### 7.2.2 OpenAPI 集成

```typescript
export function openapi() {
  return createRoute({
    method: "get",
    path: "/api/sessions",
    responses: {
      200: {
        description: "List of sessions",
        content: {
          "application/json": {
            schema: z.array(SessionSchema)
          }
        }
      }
    }
  })
}
```

## 7.3 核心 API 路由

### 7.3.1 Session 路由

```typescript
// server/routes/session.ts
export const SessionRoutes = new Hono()

// 获取会话列表
SessionRoutes.get("/", async (c) => {
  const sessions = await Session.list()
  return c.json(sessions)
})

// 创建会话
SessionRoutes.post("/", async (c) => {
  const body = await c.req.json()
  const session = await Session.create(body)
  return c.json(session, 201)
})

// 获取会话详情
SessionRoutes.get("/:id", async (c) => {
  const id = c.req.param("id")
  const session = await Session.get(id)
  if (!session) return c.json({ error: "Not found" }, 404)
  return c.json(session)
})

// 获取会话消息
SessionRoutes.get("/:id/messages", async (c) => {
  const id = c.req.param("id")
  const messages = await MessageV2.list(id)
  return c.json(messages)
})

// 发送消息
SessionRoutes.post("/:id/messages", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()
  
  // 创建用户消息
  const userMessage = await MessageV2.create({
    sessionID: id,
    type: "user",
    parts: body.parts
  })
  
  // 触发处理
  Bus.publish(Session.Event.Message, { sessionID: id, message: userMessage })
  
  return c.json(userMessage, 201)
})

// 删除会话
SessionRoutes.delete("/:id", async (c) => {
  const id = c.req.param("id")
  await Session.delete(id)
  return c.json({ success: true })
})
```

### 7.3.2 Event 路由（SSE）

```typescript
// server/routes/event.ts
export const EventRoutes = new Hono()

// SSE 事件流
EventRoutes.get("/stream", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      
      // 订阅所有事件
      const unsubscribe = Bus.subscribeAll((event) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(data))
      })
      
      // 发送心跳
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"))
      }, 30000)
      
      // 清理
      const cleanup = () => {
        unsubscribe()
        clearInterval(heartbeat)
      }
      
      // 处理断开连接
      c.req.raw.signal.addEventListener("abort", () => {
        cleanup()
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  })
})
```

### 7.3.3 File 路由

```typescript
// server/routes/file.ts
export const FileRoutes = new Hono()

// 读取文件
FileRoutes.get("/read", async (c) => {
  const path = c.req.query("path")
  if (!path) return c.json({ error: "Path required" }, 400)
  
  const content = await Filesystem.read(path)
  return c.json({ content })
})

// 写入文件
FileRoutes.post("/write", async (c) => {
  const body = await c.req.json()
  await Filesystem.write(body.path, body.content)
  return c.json({ success: true })
})

// 列出目录
FileRoutes.get("/list", async (c) => {
  const path = c.req.query("path") || Instance.directory
  const entries = await Filesystem.list(path)
  return c.json(entries)
})

// 搜索文件
FileRoutes.get("/search", async (c) => {
  const pattern = c.req.query("pattern")
  const results = await Filesystem.search(pattern)
  return c.json(results)
})
```

### 7.3.4 MCP 路由

```typescript
// server/routes/mcp.ts
export const McpRoutes = new Hono()

// 获取 MCP 状态
McpRoutes.get("/status", async (c) => {
  const status = await MCP.status()
  return c.json(status)
})

// 连接 MCP
McpRoutes.post("/connect/:name", async (c) => {
  const name = c.req.param("name")
  await MCP.connect(name)
  return c.json({ success: true })
})

// 断开 MCP
McpRoutes.post("/disconnect/:name", async (c) => {
  const name = c.req.param("name")
  await MCP.disconnect(name)
  return c.json({ success: true })
})

// 获取 MCP 工具
McpRoutes.get("/tools", async (c) => {
  const tools = await MCP.tools()
  return c.json(tools)
})

// OAuth 认证
McpRoutes.get("/auth/:name", async (c) => {
  const name = c.req.param("name")
  const authUrl = await MCP.startAuth(name)
  return c.json({ authUrl })
})

McpRoutes.get("/auth/:name/callback", async (c) => {
  const name = c.req.param("name")
  const code = c.req.query("code")
  await MCP.finishAuth(name, code)
  return c.html("<script>window.close()</script>")
})
```

### 7.3.5 Permission 路由

```typescript
// server/routes/permission.ts
export const PermissionRoutes = new Hono()

// 获取待处理权限请求
PermissionRoutes.get("/pending", async (c) => {
  const pending = await Permission.listPending()
  return c.json(pending)
})

// 响应权限请求
PermissionRoutes.post("/respond", async (c) => {
  const body = await c.req.json()
  await Permission.respond(body.id, body.allow, body.always)
  return c.json({ success: true })
})

// 获取权限规则
PermissionRoutes.get("/rules", async (c) => {
  const rules = await Permission.getRules()
  return c.json(rules)
})

// 更新权限规则
PermissionRoutes.post("/rules", async (c) => {
  const body = await c.req.json()
  await Permission.updateRules(body)
  return c.json({ success: true })
})
```

## 7.4 数据持久化

### 7.4.1 数据库连接

```typescript
// storage/db.bun.ts
import { Database } from "bun:sqlite"
import { drizzle } from "drizzle-orm/bun-sqlite"

const sqlite = new Database("opencode.db")
export const db = drizzle(sqlite)

// storage/db.node.ts
import { Database } from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"

const sqlite = new Database("opencode.db")
export const db = drizzle(sqlite)
```

### 7.4.2 表结构定义

```typescript
// storage/schema.sql.ts
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core"

export const SessionTable = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  agent: text().notNull(),
  title: text(),
  time_created: integer().notNull(),
  time_updated: integer().notNull()
})

export const MessageTable = sqliteTable("message", {
  id: text().primaryKey(),
  session_id: text().notNull().references(() => SessionTable.id),
  type: text().notNull(),
  time_created: integer().notNull(),
  time_completed: integer(),
  tokens_input: integer(),
  tokens_output: integer(),
  cost: real(),
  finish: text(),
  error: text()
})

export const PartTable = sqliteTable("part", {
  id: text().primaryKey(),
  session_id: text().notNull().references(() => SessionTable.id),
  message_id: text().notNull().references(() => MessageTable.id),
  type: text().notNull(),
  data: text().notNull(),  // JSON
  time_created: integer().notNull()
})

export const PermissionTable = sqliteTable("permission", {
  id: text().primaryKey(),
  session_id: text().notNull(),
  permission: text().notNull(),
  patterns: text().notNull(),  // JSON array
  status: text().notNull(),  // pending, allowed, denied
  time_created: integer().notNull()
})
```

### 7.4.3 查询操作

```typescript
// 使用 Drizzle ORM
import { eq, and, desc } from "drizzle-orm"

// 获取会话消息
export async function listMessages(sessionID: SessionID): Promise<Message[]> {
  return db
    .select()
    .from(MessageTable)
    .where(eq(MessageTable.session_id, sessionID))
    .orderBy(desc(MessageTable.time_created))
}

// 创建消息
export async function createMessage(message: NewMessage): Promise<Message> {
  const [result] = await db
    .insert(MessageTable)
    .values(message)
    .returning()
  return result
}

// 更新消息
export async function updateMessage(
  id: MessageID,
  data: Partial<Message>
): Promise<Message> {
  const [result] = await db
    .update(MessageTable)
    .set(data)
    .where(eq(MessageTable.id, id))
    .returning()
  return result
}
```

## 7.5 事件系统

### 7.5.1 Bus 实现

```typescript
// bus/bus-event.ts
type EventHandler<T = any> = (event: T) => void | Promise<void>

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()
  private allHandlers: Set<EventHandler> = new Set()
  
  // 订阅特定事件
  subscribe<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
    
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }
  
  // 订阅所有事件
  subscribeAll(handler: EventHandler): () => void {
    this.allHandlers.add(handler)
    return () => {
      this.allHandlers.delete(handler)
    }
  }
  
  // 发布事件
  async publish<T>(event: string, data: T): Promise<void> {
    // 调用特定事件处理器
    const handlers = this.handlers.get(event)
    if (handlers) {
      await Promise.all(Array.from(handlers).map(h => h(data)))
    }
    
    // 调用全局处理器
    await Promise.all(Array.from(this.allHandlers).map(h => h({ event, data })))
  }
}

export const Bus = new EventBus()
```

### 7.5.2 事件类型

```typescript
// 会话事件
Session.Event = {
  Created: "session.created",
  Updated: "session.updated",
  Deleted: "session.deleted",
  Message: "session.message",
  Part: "session.part",
  Status: "session.status",
  Error: "session.error"
}

// 权限事件
Permission.Event = {
  Request: "permission.request",
  Response: "permission.response"
}

// MCP 事件
MCP.Event = {
  Connected: "mcp.connected",
  Disconnected: "mcp.disconnected",
  ToolCall: "mcp.tool_call"
}
```

## 7.6 对 AI-Automated-office 的参考价值

### 7.6.1 部门 API 设计

```typescript
// 部门 API 路由
export const DepartmentRoutes = new Hono()

// 获取部门列表
DepartmentRoutes.get("/", async (c) => {
  const departments = await Department.list()
  return c.json(departments)
})

// 获取部门详情
DepartmentRoutes.get("/:id", async (c) => {
  const id = c.req.param("id")
  const department = await Department.get(id)
  return c.json(department)
})

// 获取部门工具
DepartmentRoutes.get("/:id/tools", async (c) => {
  const id = c.req.param("id")
  const tools = await Department.getTools(id)
  return c.json(tools)
})

// 跨部门数据请求
DepartmentRoutes.post("/:id/cross-request", async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json()
  
  // 创建跨部门请求
  const request = await CrossDepartment.create({
    fromDepartment: id,
    toDepartment: body.toDepartment,
    type: "request",
    data: body.data
  })
  
  // 通知目标部门
  Bus.publish("cross_department.request", request)
  
  return c.json(request, 201)
})
```

### 7.6.2 关键借鉴点

1. **Hono 框架** - 轻量、快速、类型安全
2. **SSE 实时通信** - 实时推送状态更新
3. **事件驱动** - 解耦的组件通信
4. **SQLite 持久化** - 本地优先的数据存储
5. **RESTful API** - 清晰的 API 设计

---

*下一章节: [08-tech-stack.md](./08-tech-stack.md) - 技术栈总结*
