# 五、MCP 集成方案

## 5.1 MCP 协议概述

### 5.1.1 什么是 MCP？

**Model Context Protocol (MCP)** 是一个开放协议，用于 AI 模型与外部工具/数据源的标准化通信。

**核心概念:**
- **Client** - AI 应用（如 OpenCode）
- **Server** - 工具/数据提供者
- **Transport** - 通信方式（stdio、SSE、WebSocket）

### 5.1.2 MCP 能力

| 能力 | 描述 |
|-----|------|
| **Tools** | 可调用的函数 |
| **Resources** | 可读取的资源（文件、数据） |
| **Prompts** | 预定义的提示词模板 |

## 5.2 OpenCode MCP 架构

### 5.2.1 模块结构

```
packages/opencode/src/mcp/
├── index.ts           # MCP 管理主模块
├── auth.ts            # 认证逻辑
├── oauth-provider.ts  # OAuth 提供者
└── oauth-callback.ts  # OAuth 回调处理
```

### 5.2.2 核心状态

```typescript
interface McpState {
  clients: Record<string, McpClient>  // MCP 客户端实例
  status: Record<string, McpStatus>   // 连接状态
}

type McpStatus = 
  | { status: "connecting" }
  | { status: "connected" }
  | { status: "failed"; error: string }
  | { status: "auth_required"; authUrl: string }
```

## 5.3 MCP 连接管理

### 5.3.1 连接流程

```typescript
export async function connect(name: string): Promise<void> {
  // 1. 获取配置
  const cfg = await Config.get()
  const mcp = cfg.mcp?.[name]
  
  if (!mcp || !isMcpConfigured(mcp)) {
    log.error("MCP config not found", { name })
    return
  }
  
  // 2. 创建客户端
  const result = await create(name, { ...mcp, enabled: true })
  
  if (!result) {
    s.status[name] = {
      status: "failed",
      error: "Unknown error during connection"
    }
    return
  }
  
  // 3. 更新状态
  s.status[name] = result.status
  if (result.mcpClient) {
    // 关闭旧客户端
    if (s.clients[name]) {
      await s.clients[name].close().catch(log.error)
    }
    s.clients[name] = result.mcpClient
  }
}
```

### 5.3.2 创建客户端

```typescript
export async function create(
  name: string,
  config: McpConfig
): Promise<{ status: McpStatus; mcpClient?: McpClient }> {
  // 1. 创建传输层
  const transport = await createTransport(config)
  
  // 2. 创建客户端
  const client = new McpClient({
    name: "opencode",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  })
  
  // 3. 连接
  try {
    await client.connect(transport)
    
    // 4. 注册通知处理器
    registerNotificationHandlers(client, name)
    
    return {
      status: { status: "connected" },
      mcpClient: client
    }
  } catch (error) {
    // 处理认证需求
    if (error.code === "AUTH_REQUIRED") {
      return {
        status: {
          status: "auth_required",
          authUrl: error.authUrl
        }
      }
    }
    
    return {
      status: {
        status: "failed",
        error: error.message
      }
    }
  }
}
```

### 5.3.3 传输层创建

```typescript
async function createTransport(config: McpConfig): Promise<Transport> {
  switch (config.type) {
    case "stdio":
      return new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
        env: { ...process.env, ...config.env }
      })
      
    case "sse":
      return new SSEClientTransport(
        new URL(config.url),
        {
          headers: config.headers
        }
      )
      
    case "websocket":
      return new WebSocketClientTransport(
        new URL(config.url)
      )
      
    default:
      throw new Error(`Unknown transport type: ${config.type}`)
  }
}
```

## 5.4 MCP 工具集成

### 5.4.1 获取 MCP 工具

```typescript
export async function tools(): Promise<Record<string, Tool>> {
  const result: Record<string, Tool> = {}
  const s = await state()
  const clientsSnapshot = await clients()
  
  // 1. 筛选已连接的客户端
  const connectedClients = Object.entries(clientsSnapshot).filter(
    ([clientName]) => s.status[clientName]?.status === "connected"
  )
  
  // 2. 获取每个客户端的工具
  const toolsResults = await Promise.all(
    connectedClients.map(async ([clientName, client]) => {
      try {
        const toolsResult = await client.listTools()
        return { clientName, client, toolsResult }
      } catch (e) {
        log.error("failed to get tools", { clientName, error: e.message })
        s.status[clientName] = { status: "failed", error: e.message }
        delete s.clients[clientName]
        return undefined
      }
    })
  )
  
  // 3. 转换工具格式
  for (const { clientName, client, toolsResult } of toolsResults) {
    if (!toolsResult) continue
    
    for (const mcpTool of toolsResult.tools) {
      const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9_-]/g, "_")
      const sanitizedToolName = mcpTool.name.replace(/[^a-zA-Z0-9_-]/g, "_")
      
      result[sanitizedClientName + "_" + sanitizedToolName] = 
        await convertMcpTool(mcpTool, client)
    }
  }
  
  return result
}
```

### 5.4.2 工具格式转换

```typescript
export async function convertMcpTool(
  mcpTool: McpTool,
  client: McpClient,
  timeout?: number
): Promise<Tool> {
  return tool({
    description: mcpTool.description ?? `MCP tool: ${mcpTool.name}`,
    parameters: convertMcpSchema(mcpTool.inputSchema),
    execute: async (args) => {
      // 调用 MCP 工具
      const result = await client.callTool({
        name: mcpTool.name,
        arguments: args
      }, { timeout })
      
      // 格式化结果
      return {
        output: formatMcpResult(result),
        title: mcpTool.name,
        metadata: {
          source: "mcp",
          tool: mcpTool.name
        }
      }
    }
  })
}
```

### 5.4.3 Schema 转换

```typescript
function convertMcpSchema(mcpSchema: any): z.ZodType {
  // MCP 使用 JSON Schema
  // 需要转换为 Zod Schema
  
  switch (mcpSchema.type) {
    case "object":
      const shape: Record<string, z.ZodType> = {}
      for (const [key, value] of Object.entries(mcpSchema.properties ?? {})) {
        shape[key] = convertMcpSchema(value)
        if (mcpSchema.required?.includes(key)) {
          // 保持 required
        } else {
          shape[key] = shape[key].optional()
        }
      }
      return z.object(shape)
      
    case "string":
      return z.string().describe(mcpSchema.description ?? "")
      
    case "number":
    case "integer":
      return z.number().describe(mcpSchema.description ?? "")
      
    case "boolean":
      return z.boolean().describe(mcpSchema.description ?? "")
      
    case "array":
      return z.array(convertMcpSchema(mcpSchema.items)).describe(mcpSchema.description ?? "")
      
    default:
      return z.any()
  }
}
```

## 5.5 MCP 认证

### 5.5.1 OAuth 流程

```typescript
export async function startAuth(name: string): Promise<string> {
  const client = await clients().then(c => c[name])
  if (!client) throw new Error("Client not found")
  
  // 1. 获取 OAuth URL
  const { authUrl, codeVerifier } = await client.authenticate({
    type: "oauth"
  })
  
  // 2. 保存 codeVerifier
  await saveOAuthState(name, { codeVerifier })
  
  // 3. 返回授权 URL
  return authUrl
}

export async function finishAuth(
  name: string,
  code: string
): Promise<void> {
  const state = await loadOAuthState(name)
  
  // 1. 交换 token
  const client = await clients().then(c => c[name])
  await client.completeAuthenticate({
    type: "oauth",
    code,
    codeVerifier: state.codeVerifier
  })
  
  // 2. 保存 token
  await saveToken(name, client.token)
  
  // 3. 重新连接
  await connect(name)
}
```

### 5.5.2 Token 管理

```typescript
export async function hasStoredTokens(name: string): Promise<boolean> {
  const tokens = await loadToken(name)
  return tokens !== null
}

export async function removeAuth(name: string): Promise<void> {
  // 1. 删除存储的 token
  await deleteToken(name)
  
  // 2. 断开连接
  await disconnect(name)
  
  // 3. 清除状态
  const s = await state()
  delete s.clients[name]
  delete s.status[name]
}
```

## 5.6 MCP 资源和提示词

### 5.6.1 获取资源

```typescript
export async function resources(): Promise<McpResource[]> {
  const result: McpResource[] = []
  const clientsSnapshot = await clients()
  
  for (const [clientName, client] of Object.entries(clientsSnapshot)) {
    if (s.status[clientName]?.status !== "connected") continue
    
    try {
      const resourcesResult = await client.listResources()
      for (const resource of resourcesResult.resources) {
        result.push({
          clientName,
          uri: resource.uri,
          name: resource.name,
          description: resource.description
        })
      }
    } catch (e) {
      log.error("failed to get resources", { clientName, error: e.message })
    }
  }
  
  return result
}
```

### 5.6.2 读取资源

```typescript
export async function readResource(
  clientName: string,
  uri: string
): Promise<string> {
  const client = await clients().then(c => c[clientName])
  if (!client) throw new Error("Client not found")
  
  const result = await client.readResource({ uri })
  
  // 返回资源内容
  return result.contents[0].text ?? result.contents[0].blob
}
```

### 5.6.3 获取提示词

```typescript
export async function prompts(): Promise<McpPrompt[]> {
  const result: McpPrompt[] = []
  const clientsSnapshot = await clients()
  
  for (const [clientName, client] of Object.entries(clientsSnapshot)) {
    if (s.status[clientName]?.status !== "connected") continue
    
    try {
      const promptsResult = await client.listPrompts()
      for (const prompt of promptsResult.prompts) {
        result.push({
          clientName,
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments
        })
      }
    } catch (e) {
      log.error("failed to get prompts", { clientName, error: e.message })
    }
  }
  
  return result
}
```

## 5.7 MCP 配置

### 5.7.1 配置格式

```json
{
  "mcp": {
    "filesystem": {
      "type": "stdio",
      "command": "mcp-filesystem",
      "args": ["/path/to/project"],
      "env": {
        "LOG_LEVEL": "debug"
      }
    },
    "database": {
      "type": "stdio",
      "command": "mcp-postgres",
      "args": ["postgresql://localhost/mydb"]
    },
    "api": {
      "type": "sse",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### 5.7.2 配置验证

```typescript
function isMcpConfigured(config: any): config is McpConfig {
  return config && typeof config.type === "string"
}
```

## 5.8 对 AI-Automated-office 的参考价值

### 5.8.1 外部工具接入设计

```typescript
interface ExternalToolConfig {
  id: string
  name: string
  type: "mcp" | "api" | "plugin"
  config: {
    // MCP 配置
    mcp?: {
      type: "stdio" | "sse" | "websocket"
      command?: string
      args?: string[]
      url?: string
      headers?: Record<string, string>
    }
    // API 配置
    api?: {
      baseUrl: string
      authType: "none" | "api_key" | "oauth"
      apiKey?: string
      oauthConfig?: OAuthConfig
    }
    // 插件配置
    plugin?: {
      package: string
      options: Record<string, any>
    }
  }
  permissions: {
    departments: string[]  // 可使用的部门
    actions: string[]      // 可执行的操作
  }
}
```

### 5.8.2 部门工具市场设计

```typescript
interface DepartmentToolMarket {
  tools: MarketTool[]
  
  // 安装工具到部门
  install(toolId: string, department: string): Promise<void>
  
  // 卸载工具
  uninstall(toolId: string, department: string): Promise<void>
  
  // 获取部门已安装的工具
  getInstalled(department: string): Promise<MarketTool[]>
}

interface MarketTool {
  id: string
  name: string
  description: string
  category: "finance" | "hr" | "sales" | "warehouse" | "general"
  provider: string
  version: string
  config: ExternalToolConfig
  rating: number
  downloads: number
}
```

### 5.8.3 关键借鉴点

1. **标准化协议** - 使用 MCP 作为外部工具接入标准
2. **多传输层支持** - 支持 stdio、SSE、WebSocket
3. **OAuth 集成** - 完整的 OAuth 认证流程
4. **工具转换** - 自动将外部工具转换为内部格式
5. **状态管理** - 清晰的连接状态追踪

---

*下一章节: [06-frontend-architecture.md](./06-frontend-architecture.md) - 前端架构*
