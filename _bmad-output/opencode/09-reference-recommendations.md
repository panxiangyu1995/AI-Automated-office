# 九、对 AI-Automated-office 的参考建议

## 9.1 需求映射分析

### 9.1.1 PRD 核心需求与 OpenCode 能力对照

| PRD 需求 | OpenCode 对应能力 | 参考价值 |
|---------|------------------|---------|
| **AI Agent 框架** | Agent 系统（build/plan 双模式） | ⭐⭐⭐⭐⭐ |
| **工具调用系统** | Tool 系统（Zod + 统一接口） | ⭐⭐⭐⭐⭐ |
| **部门模块系统** | MCP 集成 + 工具注册 | ⭐⭐⭐⭐ |
| **会话管理** | Session + Message Part | ⭐⭐⭐⭐⭐ |
| **权限控制** | Permission 系统 | ⭐⭐⭐⭐ |
| **记忆管理** | 上下文压缩 + 快照 | ⭐⭐⭐⭐ |
| **桌面端 UI** | SolidJS + Vite 架构 | ⭐⭐⭐⭐ |
| **后端 API** | Hono + SQLite | ⭐⭐⭐⭐⭐ |

### 9.1.2 可直接复用的设计

| 设计模式 | OpenCode 实现 | AI-Automated-office 应用 |
|---------|--------------|-------------------------|
| **工具定义接口** | `Tool.define()` | 部门工具定义 |
| **消息分片系统** | Part 类型设计 | AI 对话 + 工具调用展示 |
| **权限请求流程** | `ctx.ask()` | 部门权限控制 |
| **会话状态管理** | SessionStatus | 任务状态追踪 |
| **SSE 实时通信** | Event 路由 | 实时消息推送 |
| **上下文压缩** | Compaction 机制 | 长对话管理 |

## 9.2 架构设计建议

### 9.2.1 部门 Agent 架构

基于 OpenCode 的 Agent 系统，建议采用以下架构：

```typescript
// 部门 Agent 定义
interface DepartmentAgent {
  id: string                    // 部门标识
  name: string                  // 显示名称
  description: string           // 描述
  prompt: string                // 系统提示词
  
  // 权限配置
  permissions: {
    data: PermissionRule[]      // 数据访问权限
    tools: PermissionRule[]     // 工具调用权限
    actions: PermissionRule[]   // 操作权限
  }
  
  // 工具绑定
  tools: {
    builtIn: string[]           // 内置工具
    mcp: string[]               // MCP 工具
    custom: string[]            // 自定义工具
  }
  
  // 模型配置
  model: {
    provider: string
    modelId: string
    temperature: number
    contextWindow: number
  }
  
  // 记忆配置
  memory: {
    personal: boolean           // 个人记忆
    enterprise: boolean         // 企业知识库
    graph: boolean              // 图记忆（Post-MVP）
  }
}

// 权限规则
interface PermissionRule {
  pattern: string               // glob 模式
  effect: "allow" | "deny"      // 效果
  scope: "always" | "ask"       // 作用域
}
```

### 9.2.2 部门工具系统

```typescript
// 部门工具定义
interface DepartmentTool {
  id: string                    // 工具 ID
  department: string            // 所属部门
  category: "tool" | "skill" | "mcp"  // 类型
  
  // 工具定义（参考 OpenCode）
  definition: {
    description: string
    parameters: z.ZodType       // Zod Schema
    execute: (args, ctx) => Promise<ToolResult>
  }
  
  // 权限声明
  permissions: {
    data: string[]              // 访问的数据
    risk: "low" | "medium" | "high"  // 风险等级
    requiresApproval: boolean   // 是否需要审批
  }
  
  // UI 集成
  ui?: {
    icon: string
    label: string
    shortcut?: string
  }
}

// 工具注册示例
const CreateOrderTool: DepartmentTool = {
  id: "sales_create_order",
  department: "sales",
  category: "tool",
  definition: {
    description: "创建销售订单",
    parameters: z.object({
      customerId: z.string(),
      products: z.array(z.object({
        productId: z.string(),
        quantity: z.number(),
        price: z.number()
      })),
      deliveryDate: z.string().optional()
    }),
    async execute(args, ctx) {
      // 1. 权限检查
      await ctx.ask({
        permission: "sales.order.create",
        patterns: [args.customerId],
        metadata: { department: "sales" }
      })
      
      // 2. 业务逻辑
      const order = await ctx.services.order.create(args)
      
      // 3. 跨部门通知
      await ctx.notify("warehouse", {
        type: "order_created",
        orderId: order.id
      })
      
      return {
        title: `订单创建成功: ${order.id}`,
        output: order,
        metadata: { orderId: order.id }
      }
    }
  },
  permissions: {
    data: ["sales.orders", "sales.customers"],
    risk: "medium",
    requiresApproval: false
  },
  ui: {
    icon: "shopping-cart",
    label: "创建订单",
    shortcut: "Ctrl+Shift+O"
  }
}
```

### 9.2.3 会话与消息系统

```typescript
// 会话定义（参考 OpenCode Session）
interface DepartmentSession {
  id: SessionID
  department: string            // 所属部门
  userId: string                // 用户 ID
  agent: string                 // Agent ID
  
  // 状态
  status: "idle" | "busy" | "waiting" | "error"
  
  // 上下文
  context: {
    currentTask?: string        // 当前任务
    pendingApprovals: string[]  // 待审批
    linkedSessions: string[]    // 关联会话
  }
  
  // 时间戳
  time: {
    created: number
    updated: number
  }
}

// 消息定义（参考 OpenCode Message）
interface DepartmentMessage {
  id: MessageID
  sessionId: SessionID
  type: "user" | "assistant" | "system"
  
  // 消息分片（参考 OpenCode Part）
  parts: MessagePart[]
  
  // 元数据
  metadata: {
    tokens?: { input: number; output: number }
    cost?: number
    model?: string
  }
  
  time: {
    created: number
    completed?: number
  }
}

// 消息分片类型
type MessagePart = 
  | TextPart
  | ToolCallPart
  | ToolResultPart
  | FilePart
  | ApprovalPart
  | CrossDepartmentPart

// 跨部门消息分片
interface CrossDepartmentPart {
  id: PartID
  type: "cross_department"
  from: { department: string; userId: string }
  to: { department: string; userId: string }
  action: string
  data: any
  status: "pending" | "approved" | "rejected"
}
```

### 9.2.4 权限系统设计

```typescript
// 部门权限模型
interface DepartmentPermissionModel {
  // 基础权限（人事权限）
  base: {
    profile: "read" | "write"
    attendance: "read" | "write"
    announcements: "read"
  }
  
  // 部门权限
  department: {
    [departmentId: string]: {
      data: {
        [resource: string]: "none" | "read" | "write" | "admin"
      }
      tools: {
        [toolId: string]: boolean | "ask"
      }
      actions: {
        [action: string]: boolean | "ask"
      }
    }
  }
  
  // 审批发起权限
  approval: {
    canInitiate: string[]       // 可发起的审批类型
    canApprove: string[]        // 可审批的类型
    maxAmount?: number          // 最大审批金额
  }
}

// 权限检查流程（参考 OpenCode）
async function checkPermission(
  userId: string,
  permission: PermissionRequest
): Promise<PermissionResult> {
  // 1. 获取用户权限模型
  const userModel = await getUserPermissionModel(userId)
  
  // 2. 检查 always 规则
  if (matchAlways(userModel, permission)) {
    return { allowed: true, reason: "always_allowed" }
  }
  
  // 3. 检查 never 规则
  if (matchNever(userModel, permission)) {
    return { allowed: false, reason: "never_allowed" }
  }
  
  // 4. 检查 allow 规则
  if (matchAllow(userModel, permission)) {
    return { allowed: true, reason: "allowed" }
  }
  
  // 5. 检查 deny 规则
  if (matchDeny(userModel, permission)) {
    return { allowed: false, reason: "denied" }
  }
  
  // 6. 需要用户确认
  return { allowed: "ask", reason: "confirmation_required" }
}
```

## 9.3 技术实现建议

### 9.3.1 技术栈选择

基于 OpenCode 的技术选型，建议：

| 层级 | 推荐技术 | 原因 |
|-----|---------|------|
| **运行时** | Bun / Node.js | OpenCode 验证的跨平台方案 |
| **后端框架** | Hono | 轻量、快速、类型安全 |
| **前端框架** | SolidJS / React | SolidJS 性能更好，React 生态更丰富 |
| **数据库** | SQLite（本地）+ PostgreSQL（云端） | 本地优先，云端同步 |
| **ORM** | Drizzle | 类型安全，轻量 |
| **验证** | Zod | 与 TypeScript 完美集成 |
| **LLM SDK** | Vercel AI SDK | 多模型支持，流式处理 |
| **UI 组件** | Kobalte / Shadcn | 无障碍支持，美观 |
| **样式** | TailwindCSS | 快速开发，一致性 |
| **构建** | Vite | 快速 HMR，生态丰富 |
| **桌面框架** | Tauri | Rust 后端，性能优秀 |

### 9.3.2 项目结构建议

```
ai-automated-office/
├── packages/
│   ├── core/                    # 核心库
│   │   ├── agent/               # Agent 系统
│   │   ├── tool/                # 工具系统
│   │   ├── session/             # 会话管理
│   │   ├── permission/          # 权限系统
│   │   ├── memory/              # 记忆系统
│   │   └── mcp/                 # MCP 集成
│   │
│   ├── server/                  # 后端服务
│   │   ├── routes/              # API 路由
│   │   ├── services/            # 业务服务
│   │   ├── storage/             # 数据存储
│   │   └── bus/                 # 事件总线
│   │
│   ├── app/                     # 前端应用
│   │   ├── components/          # UI 组件
│   │   ├── pages/               # 页面
│   │   ├── context/             # 状态管理
│   │   └── hooks/               # 自定义 Hooks
│   │
│   ├── desktop/                 # 桌面端
│   │   ├── src-tauri/           # Rust 后端
│   │   └── src/                 # 前端入口
│   │
│   └── departments/             # 部门模块
│       ├── hr/                  # 人事部
│       ├── finance/             # 财务部
│       ├── sales/               # 销售部
│       ├── warehouse/           # 仓储部
│       ├── approval/            # 审批中心
│       └── management/          # 管理层
│
├── shared/                      # 共享代码
│   ├── types/                   # 类型定义
│   ├── utils/                   # 工具函数
│   └── constants/               # 常量
│
└── tools/                       # 开发工具
    ├── cli/                     # CLI 工具
    └── scripts/                 # 脚本
```

### 9.3.3 关键接口设计

```typescript
// Agent 接口（参考 OpenCode）
interface AgentInterface {
  // 获取 Agent
  get(id: string): Promise<DepartmentAgent>
  
  // 列出所有 Agent
  list(): Promise<DepartmentAgent[]>
  
  // 生成自定义 Agent
  generate(description: string): Promise<DepartmentAgent>
}

// Tool 接口（参考 OpenCode）
interface ToolInterface {
  // 注册工具
  register(tool: DepartmentTool): Promise<void>
  
  // 获取工具
  get(id: string): Promise<DepartmentTool>
  
  // 列出部门工具
  listByDepartment(department: string): Promise<DepartmentTool[]>
  
  // 执行工具
  execute(id: string, args: any, ctx: ToolContext): Promise<ToolResult>
}

// Session 接口（参考 OpenCode）
interface SessionInterface {
  // 创建会话
  create(department: string, userId: string): Promise<DepartmentSession>
  
  // 获取会话
  get(id: SessionID): Promise<DepartmentSession>
  
  // 发送消息
  sendMessage(id: SessionID, message: NewMessage): Promise<DepartmentMessage>
  
  // 订阅更新
  subscribe(id: SessionID, callback: (update: SessionUpdate) => void): () => void
}

// Permission 接口（参考 OpenCode）
interface PermissionInterface {
  // 检查权限
  check(userId: string, request: PermissionRequest): Promise<PermissionResult>
  
  // 请求权限
  ask(request: PermissionRequest): Promise<void>
  
  // 响应权限请求
  respond(requestId: string, allow: boolean, always?: boolean): Promise<void>
}
```

## 9.4 实现路线图

### 9.4.1 Phase 1: 核心框架（MVP 基础）

**目标:** 构建 Agent 框架核心能力

| 任务 | 参考 OpenCode | 优先级 |
|-----|--------------|-------|
| Agent 系统实现 | `packages/opencode/src/agent/` | P0 |
| Tool 系统实现 | `packages/opencode/src/tool/` | P0 |
| Session 管理实现 | `packages/opencode/src/session/` | P0 |
| Permission 系统实现 | `packages/opencode/src/permission/` | P0 |
| 后端 API 实现 | `packages/opencode/src/server/` | P0 |
| 前端基础框架 | `packages/app/src/` | P0 |

### 9.4.2 Phase 2: 部门模块（MVP 核心）

**目标:** 实现 6 个核心部门模块

| 部门 | 核心工具 | 优先级 |
|-----|---------|-------|
| 人事部 | 员工管理、考勤管理 | P0 |
| 审批中心 | 流程创建、审批处理 | P0 |
| 销售部 | 报价单、合同、订单 | P0 |
| 财务部 | 发票 OCR、台账生成 | P0 |
| 仓储部 | 入库、出库、库存 | P0 |
| 管理层 | 数据看板、预警 | P0 |

### 9.4.3 Phase 3: 企业级功能（MVP 完善）

**目标:** 完善企业级能力

| 功能 | 参考 OpenCode | 优先级 |
|-----|--------------|-------|
| 多租户架构 | - | P0 |
| 数据同步 | Session 同步机制 | P0 |
| 记忆系统 | Context Compaction | P1 |
| MCP 集成 | MCP 模块 | P1 |
| 部门市场 | 工具注册机制 | P1 |

## 9.5 关键风险与应对

### 9.5.1 技术风险

| 风险 | 应对策略 |
|-----|---------|
| **LLM 调用不稳定** | 参考 OpenCode 的重试机制和 Failover 设计 |
| **上下文溢出** | 参考 OpenCode 的压缩机制 |
| **权限控制复杂** | 参考 OpenCode 的权限请求流程 |
| **跨部门数据联动** | 参考 OpenCode 的消息分片设计 |

### 9.5.2 业务风险

| 风险 | 应对策略 |
|-----|---------|
| **部门模块开发成本高** | 参考插件化设计，降低边际成本 |
| **用户学习成本** | 参考 OpenCode 的 Agent 提示词设计 |
| **数据安全** | 参考 OpenCode 的权限和审计机制 |

## 9.6 总结

### 9.6.1 OpenCode 的核心价值

OpenCode 为 AI-Automated-office 提供了：

1. **经过验证的架构** - Agent、Tool、Session、Permission 等核心模块
2. **成熟的设计模式** - 工具定义、消息分片、权限请求等
3. **技术选型参考** - Bun、Hono、SolidJS、Drizzle 等
4. **实现细节参考** - 具体的代码实现和接口设计

### 9.6.2 需要扩展的部分

AI-Automated-office 需要在 OpenCode 基础上扩展：

1. **部门化架构** - 从单 Agent 到多部门 Agent
2. **企业级权限** - 从简单权限到部门权限模型
3. **跨部门协作** - 从单会话到跨部门消息
4. **业务工具** - 从开发工具到业务工具
5. **多租户** - 从单用户到多租户

### 9.6.3 建议的实施策略

1. **先复用后扩展** - 先实现 OpenCode 的核心能力，再扩展业务功能
2. **模块化开发** - 参考插件化设计，降低耦合
3. **渐进式迭代** - 从核心部门开始，逐步扩展
4. **持续验证** - 每个阶段都进行用户验证

---

*研究报告完成*

**文档版本:** 1.0  
**生成日期:** 2026-03-21  
**基于项目:** OpenCode (https://github.com/opencode-ai/opencode)
