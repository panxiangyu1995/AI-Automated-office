# 三、工具系统设计

## 3.1 工具定义接口

### 3.1.1 核心接口

```typescript
export interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
  id: string
  init: (ctx?: InitContext) => Promise<{
    description: string
    parameters: Parameters
    execute(
      args: z.infer<Parameters>,
      ctx: Context,
    ): Promise<{
      title: string
      metadata: M
      output: string
      attachments?: Omit<MessageV2.FilePart, "id" | "sessionID" | "messageID">[]
    }>
    formatValidationError?(error: z.ZodError): string
  }>
}
```

### 3.1.2 工具定义函数

```typescript
export function define<Parameters extends z.ZodType, Result extends Metadata>(
  id: string,
  init: Info<Parameters, Result>["init"] | Awaited<ReturnType<Info<Parameters, Result>["init"]>>
): Info<Parameters, Result>
```

**功能:**
1. 定义工具 ID
2. 初始化工具配置
3. 包装 execute 函数，添加：
   - 参数验证
   - 输出截断
   - 错误处理

### 3.1.3 执行上下文

```typescript
interface Context {
  sessionID: SessionID      // 会话 ID
  messageID: MessageID      // 消息 ID
  callID: string            // 调用 ID
  abort: AbortSignal        // 中断信号
  messages: ModelMessage[]  // 消息历史
  extra?: Record<string, any>  // 额外数据
  
  // 方法
  ask: (permission: PermissionRequest) => Promise<void>
  metadata: (metadata: object) => void
}
```

## 3.2 工具注册表

### 3.2.1 注册函数

```typescript
export async function register(tool: Tool.Info): Promise<void>
```

**功能:** 注册自定义工具到注册表

### 3.2.2 获取所有工具

```typescript
export async function tools(
  model: { providerID: ProviderID; modelID: ModelID },
  agent?: Agent.Info
): Promise<Tool.Info[]>
```

**功能:** 获取当前可用的所有工具

**过滤逻辑:**
1. 根据 Agent 过滤工具
2. 根据模型特性过滤（如 GPT 使用 apply_patch 替代 edit）
3. 根据配置过滤（如启用 batch_tool）

### 3.2.3 内置工具列表

```typescript
async function all(): Promise<Tool.Info[]> {
  return [
    InvalidTool,      // 处理无效工具调用
    QuestionTool,     // 向用户提问
    BashTool,         // Shell 命令
    ReadTool,         // 读取文件
    GlobTool,         // 文件匹配
    GrepTool,         // 内容搜索
    EditTool,         // 编辑文件
    WriteTool,        // 写入文件
    TaskTool,         // 子任务
    WebFetchTool,     // 获取网页
    TodoWriteTool,    // 任务列表
    WebSearchTool,    // 网页搜索
    CodeSearchTool,   // 代码搜索
    SkillTool,        // 执行技能
    ApplyPatchTool,   // 应用补丁
    // 可选工具
    ...(Flag.EXPERIMENTAL_LSP_TOOL ? [LspTool] : []),
    ...(config.experimental?.batch_tool ? [BatchTool] : []),
    // 自定义工具
    ...custom,
  ]
}
```

## 3.3 典型工具实现

### 3.3.1 Bash 工具

```typescript
BashTool = Tool.define("bash", async () => {
  const shell = Shell.acceptable()
  
  return {
    description: `Execute a bash command in the terminal.
      Working directory: ${Instance.directory}
      Max output: ${Truncate.MAX_LINES} lines / ${Truncate.MAX_BYTES} bytes`,
    
    parameters: z.object({
      command: z.string().describe("The command to execute"),
      timeout: z.number().describe("Optional timeout in milliseconds").optional(),
      workdir: z.string().describe("The working directory").optional(),
      description: z.string().describe("Clear, concise description of what this command does"),
    }),
    
    async execute(params, ctx) {
      const cwd = params.workdir || Instance.directory
      const timeout = params.timeout ?? DEFAULT_TIMEOUT
      
      // 1. 解析命令，提取权限模式
      const tree = await parser().then((p) => p.parse(params.command))
      const patterns = extractPatterns(tree)
      
      // 2. 请求权限
      if (patterns.size > 0) {
        await ctx.ask({
          permission: "bash",
          patterns: Array.from(patterns),
          always: Array.from(always),
          metadata: {},
        })
      }
      
      // 3. 执行命令
      const proc = spawn(params.command, {
        shell,
        cwd,
        env: { ...process.env, ...shellEnv.env },
        stdio: ["ignore", "pipe", "pipe"],
      })
      
      // 4. 收集输出
      let output = ""
      proc.stdout?.on("data", (chunk) => {
        output += chunk.toString()
        ctx.metadata({ output, description: params.description })
      })
      
      // 5. 处理超时和中断
      const timeoutTimer = setTimeout(() => proc.kill(), timeout)
      ctx.abort.addEventListener("abort", () => proc.kill())
      
      // 6. 等待完成
      await new Promise((resolve) => proc.once("exit", resolve))
      
      return {
        title: params.description,
        metadata: { output, exit: proc.exitCode, description: params.description },
        output,
      }
    },
  }
})
```

**关键设计点:**
1. **命令解析** - 使用 tree-sitter 解析 bash 命令
2. **权限控制** - 根据命令类型请求权限
3. **超时处理** - 支持自定义超时
4. **中断支持** - 支持用户中断
5. **实时反馈** - 通过 metadata 实时更新状态

### 3.3.2 Read 工具

```typescript
ReadTool = Tool.define("read", {
  description: `Read a file or directory from the local filesystem.
    Max lines: ${DEFAULT_READ_LIMIT}
    Max bytes: ${MAX_BYTES}`,
  
  parameters: z.object({
    filePath: z.string().describe("The absolute path to the file or directory"),
    offset: z.coerce.number().describe("The line number to start reading from").optional(),
    limit: z.coerce.number().describe("The maximum number of lines to read").optional(),
  }),
  
  async execute(params, ctx) {
    let filepath = params.filePath
    if (!path.isAbsolute(filepath)) {
      filepath = path.resolve(Instance.directory, filepath)
    }
    
    // 1. 检查权限
    await ctx.ask({
      permission: "read",
      patterns: [filepath],
      always: ["*"],
      metadata: {},
    })
    
    // 2. 检查文件是否存在
    const stat = Filesystem.stat(filepath)
    if (!stat) {
      // 提供相似文件建议
      const suggestions = await findSimilarFiles(filepath)
      throw new Error(`File not found: ${filepath}\nDid you mean: ${suggestions.join(", ")}?`)
    }
    
    // 3. 处理目录
    if (stat.isDirectory()) {
      const entries = await fs.readdir(filepath, { withFileTypes: true })
      return {
        title: path.relative(Instance.worktree, filepath),
        output: formatDirectoryListing(entries),
        metadata: { truncated: false, loaded: [] },
      }
    }
    
    // 4. 处理图片和 PDF
    const mime = Filesystem.mimeType(filepath)
    if (isImage(mime) || mime === "application/pdf") {
      return {
        title: filepath,
        output: `${isImage ? "Image" : "PDF"} read successfully`,
        metadata: { truncated: false, loaded: [] },
        attachments: [{
          type: "file",
          mime,
          url: `data:${mime};base64,${await readFileAsBase64(filepath)}`,
        }],
      }
    }
    
    // 5. 处理文本文件
    const content = await readFileWithPagination(
      filepath,
      params.offset ?? 1,
      params.limit ?? DEFAULT_READ_LIMIT
    )
    
    return {
      title: path.relative(Instance.worktree, filepath),
      output: content.text,
      metadata: { truncated: content.truncated, loaded: [] },
    }
  },
})
```

**关键设计点:**
1. **路径处理** - 支持相对路径和绝对路径
2. **错误提示** - 文件不存在时提供相似文件建议
3. **多类型支持** - 支持目录、文本、图片、PDF
4. **分页读取** - 支持 offset 和 limit 参数
5. **二进制检测** - 自动检测并拒绝二进制文件

### 3.3.3 Edit 工具

```typescript
EditTool = Tool.define("edit", {
  description: `Perform exact string replacements in files.
    Supports multiple replacement strategies for fuzzy matching.`,
  
  parameters: z.object({
    filePath: z.string().describe("The absolute path to the file"),
    old_str: z.string().describe("The text to replace"),
    new_str: z.string().describe("The text to replace it with"),
  }),
  
  async execute(params, ctx) {
    // 1. 读取文件
    const content = await fs.readFile(params.filePath, "utf-8")
    
    // 2. 尝试多种替换策略
    const replacers = [
      SimpleReplacer,           // 精确匹配
      IndentationFlexibleReplacer,  // 缩进灵活匹配
      WhitespaceNormalizedReplacer, // 空白规范化
      LineTrimmedReplacer,      // 行尾空白忽略
      EscapeNormalizedReplacer, // 转义字符规范化
      ContextAwareReplacer,     // 上下文感知匹配
    ]
    
    let result = null
    for (const replacer of replacers) {
      result = replacer.replace(content, params.old_str, params.new_str)
      if (result.success) break
    }
    
    // 3. 处理失败情况
    if (!result.success) {
      // 提供相似内容建议
      const suggestions = findSimilarContent(content, params.old_str)
      throw new Error(`Text not found in file. Similar content:\n${suggestions}`)
    }
    
    // 4. 写入文件
    await fs.writeFile(params.filePath, result.content)
    
    return {
      title: `Edited ${path.basename(params.filePath)}`,
      output: `Successfully replaced text in ${params.filePath}`,
      metadata: { replaced: result.count },
    }
  },
})
```

**关键设计点:**
1. **多策略匹配** - 支持多种模糊匹配策略
2. **错误恢复** - 匹配失败时提供相似内容建议
3. **原子操作** - 单次替换，避免部分修改

## 3.4 工具调用流程

### 3.4.1 LLM 工具调用

```typescript
// 1. LLM 返回工具调用
const stream = await streamText({
  model,
  messages,
  tools: {
    bash: tool({
      description: "...",
      parameters: z.object({...}),
      execute: async (args) => {...}
    })
  }
})

// 2. 处理工具调用
for await (const part of stream.fullStream) {
  if (part.type === "tool-call") {
    // 工具调用开始
    const toolPart = await createToolPart(part)
    
    // 执行工具
    try {
      const result = await executeTool(part.toolName, part.args)
      toolPart.state = { status: "completed", output: result }
    } catch (error) {
      toolPart.state = { status: "error", error: error.message }
    }
    
    // 更新消息
    await updatePart(toolPart)
  }
}
```

### 3.4.2 工具结果处理

```typescript
// 工具执行完成后，结果会添加到消息历史
const toolResultMessage = {
  role: "tool",
  content: [
    {
      type: "tool-result",
      toolCallId: toolPart.callID,
      toolName: toolPart.tool,
      result: toolPart.state.output
    }
  ]
}

// LLM 会根据工具结果继续生成
```

## 3.5 工具输出截断

### 3.5.1 截断策略

```typescript
export async function output(
  output: string,
  options: TruncateOptions,
  agent?: AgentInfo
): Promise<{ content: string; truncated: boolean; outputPath?: string }> {
  // 1. 检查是否需要截断
  if (output.length <= MAX_BYTES && lineCount(output) <= MAX_LINES) {
    return { content: output, truncated: false }
  }
  
  // 2. 截断处理
  const truncated = truncateToLimit(output, MAX_BYTES, MAX_LINES)
  
  // 3. 保存完整输出到文件
  const outputPath = await saveFullOutput(output)
  
  return {
    content: truncated,
    truncated: true,
    outputPath
  }
}
```

### 3.5.2 截断提示

```
... (truncated)
Full output saved to: /tmp/opencode/output-xxx.txt
Use 'read' tool with filePath='/tmp/opencode/output-xxx.txt' to see full output.
```

## 3.6 工具与 MCP 的集成

### 3.6.1 MCP 工具转换

```typescript
export async function convertMcpTool(
  mcpTool: McpTool,
  client: McpClient,
  timeout?: number
): Promise<Tool> {
  return tool({
    description: mcpTool.description,
    parameters: convertMcpSchema(mcpTool.inputSchema),
    execute: async (args) => {
      // 调用 MCP 工具
      const result = await client.callTool({
        name: mcpTool.name,
        arguments: args
      }, { timeout })
      
      return {
        output: formatMcpResult(result),
        title: mcpTool.name,
        metadata: {}
      }
    }
  })
}
```

### 3.6.2 MCP 工具命名

MCP 工具使用 `{clientName}_{toolName}` 格式命名：

```
filesystem_read_file
database_query
api_fetch
```

## 3.7 对 AI-Automated-office 的参考价值

### 3.7.1 部门工具设计建议

```typescript
// 财务部门工具示例
const InvoiceOCRTool = Tool.define("invoice_ocr", {
  description: "识别发票信息并录入系统",
  parameters: z.object({
    image_path: z.string().describe("发票图片路径"),
    company_id: z.string().describe("公司 ID")
  }),
  async execute(params, ctx) {
    // 1. OCR 识别
    const invoice = await ocrService.recognize(params.image_path)
    
    // 2. 数据验证
    await validateInvoice(invoice)
    
    // 3. 写入数据库
    const record = await db.invoices.create(invoice)
    
    return {
      title: `发票录入: ${invoice.number}`,
      output: `成功录入发票 ${invoice.number}`,
      metadata: { invoice_id: record.id }
    }
  }
})

const LedgerGenerateTool = Tool.define("ledger_generate", {
  description: "生成财务台账",
  parameters: z.object({
    type: z.enum(["receivable", "payable"]),
    period: z.string().describe("期间，如 2024-01"),
    format: z.enum(["excel", "pdf"]).optional()
  }),
  async execute(params, ctx) {
    // 生成台账逻辑
  }
})
```

### 3.7.2 工具权限设计

```typescript
interface DepartmentToolPermission {
  department: string
  tool: string
  permissions: {
    read: string[]    // 可读数据
    write: string[]   // 可写数据
    approve: string[] // 可审批数据
  }
}

// 示例
const financeToolPermissions: DepartmentToolPermission[] = [
  {
    department: "finance",
    tool: "invoice_ocr",
    permissions: {
      read: ["finance.invoices", "hr.employees"],
      write: ["finance.invoices"],
      approve: []
    }
  },
  {
    department: "finance",
    tool: "ledger_generate",
    permissions: {
      read: ["finance.*", "sales.orders"],
      write: ["finance.ledgers"],
      approve: []
    }
  }
]
```

### 3.7.3 关键借鉴点

1. **统一接口** - 所有工具使用相同的定义方式
2. **参数验证** - 使用 Zod 进行严格的参数验证
3. **权限集成** - 工具执行前自动请求权限
4. **输出截断** - 自动处理大输出
5. **错误恢复** - 提供友好的错误提示和建议

---

*下一章节: [04-session-management.md](./04-session-management.md) - 会话管理机制*
