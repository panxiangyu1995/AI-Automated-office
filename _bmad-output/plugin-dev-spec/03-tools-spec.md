# 第3章：工具层规范 (Tools Specification)

> 工具层是插件的核心能力层，提供 AI Agent 可调用的原子操作和复杂技能。采用**混合架构**设计，根据场景选择最优实现方式。

---

## 3.1 概述

### 3.1.1 混合架构设计理念

工具层采用**三层混合架构**，根据操作特性选择最优实现：

```
┌─────────────────────────────────────────────────────────────────────┐
│                    工具层混合架构                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   统一工具接口 (Unified Interface)            │   │
│  │  - name, description, parameters                            │   │
│  │  - handler: Native | CLI | MCP                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                               │                                     │
│         ┌─────────────────────┼─────────────────────┐              │
│         ▼                     ▼                     ▼              │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐      │
│  │ Native Tools│       │ CLI Wrapper │       │MCP Adapters │      │
│  │  (高频/简单) │       │ (低频/复杂)  │       │ (外部服务)   │      │
│  ├─────────────┤       ├─────────────┤       ├─────────────┤      │
│  │ • 数据查询   │       │ • 媒体处理   │       │ • 闲鱼API   │      │
│  │ • 数据变更   │       │ • 文档转换   │       │ • 钉钉集成   │      │
│  │ • 业务操作   │       │ • 批量处理   │       │ • 企业微信   │      │
│  │ • 权限验证   │       │ • 工具链组合 │       │ • 第三方服务 │      │
│  └─────────────┘       └─────────────┘       └─────────────┘      │
│                                                                     │
│  Token 消耗：低          Token 消耗：极低        Token 消耗：中      │
│  执行速度：快            执行速度：中            执行速度：取决于网络 │
│  调试难度：低            调试难度：中            调试难度：中        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1.2 工具类型对比

| 类型 | 说明 | 复杂度 | Token消耗 | 适用场景 |
|------|------|:------:|:---------:|---------|
| **Native Tools** | 原生函数调用，直接执行 | 低 | 中 | 高频、简单、需要类型安全 |
| **CLI Wrapper** | 命令行包装，子进程执行 | 中 | 极低 | 复杂工具链、媒体处理、文档转换 |
| **MCP Adapters** | 外部服务接入，网络调用 | 高 | 中 | 第三方API、认证管理 |
| **Skills** | 复杂技能，多步骤组合 | 高 | 可变 | AI生成、智能分析 |

### 3.1.3 选择决策矩阵

| 操作类型 | 推荐方案 | 理由 |
|---------|---------|------|
| 数据查询 (query) | Native Tool | 高频、简单、需要类型安全 |
| 数据变更 (mutate) | Native Tool | 需要事务、权限检查 |
| 业务操作 (action) | Native Tool | 需要复杂验证和事件发布 |
| 统计聚合 (aggregate) | Native Tool | 高频、需要实时响应 |
| 数据导出 (export) | Native Tool | 需要权限控制和审计 |
| 图像处理 | CLI Wrapper | 复杂工具链、低频、已有成熟 CLI |
| 音频处理 | CLI Wrapper | 复杂工具链、低频 |
| 视频处理 | CLI Wrapper | 复杂工具链、低频 |
| 文档转换 | CLI Wrapper | 低频、复杂格式处理 |
| 批量处理 | CLI Wrapper | 适合命令行批处理 |
| 闲鱼 API | MCP Adapter | 外部服务、OAuth认证 |
| 钉钉集成 | MCP Adapter | 外部服务、Webhook |
| 企业微信 | MCP Adapter | 外部服务、API调用 |

---

## 3.2 通用工具架构 (ADR-025)

### 3.2.1 设计原则

为避免"工具爆炸"问题，采用**通用工具 + 参数化**设计：

```
❌ 错误模式：每个场景一个专用工具
sales_contract_query_by_date
sales_contract_query_by_sales
sales_contract_query_by_customer
... (无限增长)

✅ 正确模式：通用查询工具 + 灵活参数
sales_query(entity: "contract", filters: { dateRange, salesId, ... })
```

### 3.2.2 核心工具类型

每个插件最多注册 **5个核心工具**：

| 工具类型 | 命名格式 | 用途 | 推荐实现 |
|---------|---------|------|---------|
| **query** | `{plugin}_query` | 通用数据查询 | Native |
| **aggregate** | `{plugin}_aggregate` | 统计聚合 | Native |
| **mutate** | `{plugin}_mutate` | 数据变更（增删改） | Native |
| **action** | `{plugin}_action` | 业务操作 | Native |
| **export** | `{plugin}_export` | 数据导出 | Native |

### 3.2.3 工具数量对比

| 部门 | 专用工具数（旧方案） | 通用工具数（新方案） | 减少 |
|------|---------------------|---------------------|------|
| 销售部 | 30+ | 4 | 87% |
| 财务部 | 25+ | 4 | 84% |
| 人事部 | 20+ | 4 | 80% |
| 审批中心 | 20+ | 4 | 80% |
| **总计** | **150+** | **~25** | **83%** |

---

## 3.3 Native Tools 规范

Native Tools 是最常用的工具类型，适用于高频、简单的操作。

### 3.3.1 通用查询工具

```typescript
// tools/query.ts
import { defineTool } from '@office/plugin-sdk';
import { ContractRepository, OrderRepository, CustomerRepository } from '../data/repositories';

export default defineTool({
  name: 'sales_query',
  type: 'native',  // 明确声明类型
  
  description: `
    查询销售部数据（合同、订单、客户、报价单）
    适用场景：获取具体记录列表、查看详情、筛选数据
    
    实体类型：
    - contract: 合同
    - order: 订单
    - customer: 客户
    - quote: 报价单
    
    参数：
    - entity: 实体类型（必填）
    - filters: 过滤条件（可选）
    - fields: 返回字段（可选）
    - page: 页码（默认1）
    - pageSize: 每页数量（默认20）
  `,
  
  parameters: {
    type: 'object',
    properties: {
      entity: {
        type: 'string',
        enum: ['contract', 'order', 'customer', 'quote'],
        description: '实体类型'
      },
      filters: {
        type: 'object',
        properties: {
          dateRange: {
            type: 'object',
            properties: {
              start: { type: 'string', format: 'date' },
              end: { type: 'string', format: 'date' }
            }
          },
          status: {
            type: ['string', 'array'],
            items: { type: 'string' }
          },
          ownerId: { type: 'string' },
          keyword: { type: 'string' }
        }
      },
      fields: {
        type: 'array',
        items: { type: 'string' }
      },
      page: { type: 'number', default: 1 },
      pageSize: { type: 'number', default: 20 }
    },
    required: ['entity']
  },
  
  handler: async (params: UniversalQueryParams, context: ToolContext) => {
    const { entity, filters, fields, page = 1, pageSize = 20 } = params;
    
    // 权限检查
    await context.checkPermission(`sales:${entity}:read`);
    
    // 根据实体类型选择Repository
    const repository = getRepository(entity, context);
    
    // 执行查询
    const result = await repository.query({
      filters,
      fields,
      page,
      pageSize,
      orderBy: params.orderBy
    });
    
    // 记录审计日志
    context.auditLog({
      action: 'query',
      entity,
      filters,
      resultCount: result.total
    });
    
    return {
      entity,
      total: result.total,
      page,
      pageSize,
      items: result.items
    };
  }
});
```

### 3.3.2 数据变更工具

```typescript
// tools/mutate.ts
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'sales_mutate',
  type: 'native',
  
  description: `
    变更销售数据（创建、更新、删除）
    适用场景：新增记录、修改数据、删除记录
    
    注意：
    - 敏感操作会触发用户确认
    - 删除操作需要特殊权限
  `,
  
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['create', 'update', 'delete'] },
      entity: { type: 'string' },
      data: { type: 'object' },
      where: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          ids: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['action', 'entity']
  },
  
  handler: async (params: UniversalMutateParams, context: ToolContext) => {
    const { action, entity, data, where } = params;
    
    // 根据操作类型检查权限
    const permission = action === 'delete' ? 'delete' : 'write';
    await context.checkPermission(`sales:${entity}:${permission}`);
    
    // 敏感操作需要确认
    if (action === 'delete') {
      await context.requireConfirmation({
        message: `确定要删除${entity}吗？此操作不可撤销。`,
        level: 'danger'
      });
    }
    
    const repository = getRepository(entity, context);
    let result;
    
    switch (action) {
      case 'create':
        result = await repository.create(data);
        context.emitEvent(`sales:${entity}:created`, result);
        break;
        
      case 'update':
        result = await repository.update(where!.id, data);
        context.emitEvent(`sales:${entity}:updated`, result);
        break;
        
      case 'delete':
        result = await repository.delete(where!.id || where!.ids);
        context.emitEvent(`sales:${entity}:deleted`, where);
        break;
    }
    
    context.auditLog({ action, entity, data, where });
    
    return {
      success: true,
      action,
      entity,
      affected: result.affected,
      id: result.id
    };
  }
});
```

---

## 3.4 CLI Wrapper 规范

CLI Wrapper 用于包装命令行工具，实现极低的 Token 消耗。

### 3.4.1 设计理念

```
传统方式（高 Token 消耗）：
┌─────────────┐     需要详细描述     ┌─────────────┐
│  AI Agent   │ ──────────────────▶ │   工具 API  │
└─────────────┘                     └─────────────┘
      每次调用需要传输完整的参数描述和结果

CLI 方式（极低 Token 消耗）：
┌─────────────┐     SKILL.md 按需加载    ┌─────────────┐
│  AI Agent   │ ◀────────────────────▶ │  CLI 命令   │
└─────────────┘                        └─────────────┘
      只加载 YAML frontmatter，--help 即时获取详情
```

### 3.4.2 CLI 工具定义

```typescript
// tools/image-process.ts
import { defineTool, CLIToolWrapper } from '@office/plugin-sdk';
import { execSync } from 'child_process';
import path from 'path';

export default defineTool({
  name: 'image_process',
  type: 'cli',  // 声明为 CLI 类型
  
  description: `
    图像处理工具（基于 GIMP CLI）
    
    支持操作：
    - blur: 模糊处理
    - sharpen: 锐化
    - resize: 调整大小
    - crop: 裁剪
    - filter: 滤镜效果
    
    详细用法请使用 --help 查看
  `,
  
  // CLI 配置
  cli: {
    command: 'cli-anything-gimp',
    skillFile: './skills/gimp-skill.md',
    jsonOutput: true,  // 强制 JSON 输出
    timeout: 30000     // 超时时间
  },
  
  parameters: {
    type: 'object',
    properties: {
      operation: { 
        type: 'string', 
        enum: ['blur', 'sharpen', 'resize', 'crop', 'filter'] 
      },
      inputFile: { type: 'string' },
      outputFile: { type: 'string' },
      params: { type: 'object' }
    },
    required: ['operation', 'inputFile', 'outputFile']
  },
  
  handler: async (params, context) => {
    const { operation, inputFile, outputFile, params: opParams } = params;
    
    // 验证文件存在
    if (!await context.fs.exists(inputFile)) {
      throw new Error(`输入文件不存在: ${inputFile}`);
    }
    
    // 创建临时项目文件
    const tempProject = path.join(context.tempDir, `gimp-${Date.now()}.json`);
    
    // 生成 CLI 命令序列
    const commands = generateCLICommands({
      operation,
      inputFile,
      outputFile,
      tempProject,
      params: opParams
    });
    
    // 执行 CLI 命令
    const results = await context.executeCLI(commands, {
      timeout: 30000,
      jsonOutput: true
    });
    
    // 清理临时文件
    await context.fs.unlink(tempProject);
    
    return {
      success: true,
      outputFile,
      operation,
      metadata: results.metadata
    };
  }
});

// CLI 命令生成器
function generateCLICommands(config: CLIConfig): string[] {
  const { operation, inputFile, outputFile, tempProject, params } = config;
  
  const baseCommands = [
    `cli-anything-gimp --json project new -o ${tempProject}`,
    `cli-anything-gimp --project ${tempProject} layer import 0 ${inputFile}`
  ];
  
  const operationCommands: Record<string, string[]> = {
    blur: [
      `cli-anything-gimp --project ${tempProject} filter apply blur --radius ${params.radius || 5}`
    ],
    sharpen: [
      `cli-anything-gimp --project ${tempProject} filter apply sharpen --amount ${params.amount || 50}`
    ],
    resize: [
      `cli-anything-gimp --project ${tempProject} image resize --width ${params.width} --height ${params.height}`
    ],
    crop: [
      `cli-anything-gimp --project ${tempProject} layer crop --x ${params.x} --y ${params.y} --width ${params.width} --height ${params.height}`
    ]
  };
  
  const exportCommands = [
    `cli-anything-gimp --project ${tempProject} export render ${outputFile} --overwrite`
  ];
  
  return [
    ...baseCommands,
    ...(operationCommands[operation] || []),
    ...exportCommands
  ];
}
```

### 3.4.3 SKILL.md 规范

每个 CLI 工具需要提供 SKILL.md 文件，供 Agent 按需加载：

```markdown
---
name: cli-anything-gimp
description: Image editing and processing CLI
version: 1.0.0
---

# cli-anything-gimp

Command-line interface for GIMP - A stateful CLI for image editing.

## Installation

```bash
pip install cli-anything-gimp
```

**Prerequisites:**
- Python 3.10+
- GIMP 2.10+ must be installed

## Command Groups

### Project
| Command | Description |
|---------|-------------|
| `new` | Create a new project |
| `open` | Open an existing project |
| `save` | Save the current project |
| `info` | Show project information |

### Layer
| Command | Description |
|---------|-------------|
| `import` | Import image as layer |
| `add` | Add a new layer |
| `remove` | Remove a layer |
| `crop` | Crop a layer |

### Filter
| Command | Description |
|---------|-------------|
| `apply blur` | Apply blur filter |
| `apply sharpen` | Apply sharpen filter |
| `apply noise` | Apply noise filter |

### Export
| Command | Description |
|---------|-------------|
| `render` | Render to image file |

## Examples

### Blur an image

```bash
cli-anything-gimp project new -o temp.json
cli-anything-gimp --project temp.json layer import 0 input.png
cli-anything-gimp --project temp.json filter apply blur --radius 5
cli-anything-gimp --project temp.json export render output.png --overwrite
```

## For AI Agents

1. **Always use `--json` flag** for parseable output
2. **Check return codes** - 0 for success
3. **Use absolute paths** for all file operations
```

### 3.4.4 Token 优化效果

| 操作类型 | Native Tool | CLI Wrapper | 节省比例 |
|---------|-------------|-------------|---------|
| 简单操作 | 100-200 tokens | 20-30 tokens | 70-85% |
| 中等操作 | 300-500 tokens | 30-50 tokens | 85-90% |
| 复杂操作 | 500-1000 tokens | 50-80 tokens | 90-95% |
| 批量操作 | 1000+ tokens | 100-200 tokens | 80-90% |

---

## 3.5 MCP Adapters 规范

MCP (Model Context Protocol) 用于接入外部服务。

### 3.5.1 MCP 服务定义

```typescript
// mcp/xianyu-adapter.ts
import { defineMCPService } from '@office/plugin-sdk';

export default defineMCPService({
  id: 'xianyu-adapter',
  name: '闲鱼平台接入',
  protocol: 'mcp',
  version: '1.0.0',
  
  config: {
    endpoints: ['message', 'order'],
    authType: 'oauth2'
  },
  
  // 环境变量
  envVars: ['XIANYU_APP_ID', 'XIANYU_APP_SECRET'],
  
  // MCP 工具定义
  tools: [
    {
      name: 'xianyu_send_message',
      description: '发送闲鱼消息',
      parameters: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          message: { type: 'string' }
        },
        required: ['orderId', 'message']
      },
      handler: async (params, context) => {
        const response = await context.mcpClient.call('xianyu', 'sendMessage', params);
        return response;
      }
    },
    {
      name: 'xianyu_get_orders',
      description: '获取闲鱼订单列表',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          page: { type: 'number' }
        }
      },
      handler: async (params, context) => {
        const response = await context.mcpClient.call('xianyu', 'getOrders', params);
        return response;
      }
    }
  ]
});
```

### 3.5.2 MCP 工具调用

```typescript
// tools/xianyu-query.ts
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'xianyu_query',
  type: 'mcp',
  
  description: `
    查询闲鱼订单和消息
    
    适用场景：
    - 查看闲鱼订单状态
    - 获取买家消息
    - 同步订单数据
  `,
  
  mcp: {
    service: 'xianyu-adapter',
    autoAuth: true  // 自动处理认证
  },
  
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['getOrders', 'getMessages', 'syncOrders']
      },
      filters: { type: 'object' }
    },
    required: ['action']
  },
  
  handler: async (params, context) => {
    const { action, filters } = params;
    
    // 检查 MCP 服务是否可用
    const mcpService = await context.getMCPService('xianyu-adapter');
    if (!mcpService.isAvailable()) {
      throw new Error('闲鱼服务未配置，请先在设置中配置闲鱼账号');
    }
    
    // 调用 MCP 服务
    const result = await context.callMCP('xianyu-adapter', action, filters);
    
    return result;
  }
});
```

---

## 3.6 Skills 规范

Skill 是多个工具的组合，用于实现复杂的业务场景。

### 3.6.1 Skill 定义

```typescript
// skills/generate-contract.ts
import { defineSkill } from '@office/plugin-sdk';

export default defineSkill({
  id: 'generate-contract',
  name: 'AI生成合同',
  description: '根据客户信息和报价单自动生成合同初稿',
  trigger: 'natural-language',
  
  // 依赖的工具
  tools: ['sales_query', 'sales_mutate'],
  
  // 使用示例
  examples: [
    '帮我给XX公司生成一份采购合同',
    '根据报价单Q2024001生成合同'
  ],
  
  // 执行流程
  execute: async (context: SkillContext) => {
    const { userMessage, callTool, llm } = context;
    
    // 1. 解析用户意图
    const intent = await llm.analyze(userMessage, {
      task: 'extract_contract_requirements'
    });
    
    // 2. 查询客户信息
    const customer = await callTool('sales_query', {
      entity: 'customer',
      filters: { keyword: intent.customerName }
    });
    
    // 3. 查询报价单（如有）
    let quote = null;
    if (intent.quoteId) {
      quote = await callTool('sales_query', {
        entity: 'quote',
        filters: { id: intent.quoteId }
      });
    }
    
    // 4. AI生成合同内容
    const contractContent = await llm.generate({
      template: 'contract_template',
      variables: {
        customer: customer.items[0],
        quote: quote?.items[0],
        requirements: intent.requirements
      }
    });
    
    // 5. 创建合同草稿
    const result = await callTool('sales_mutate', {
      action: 'create',
      entity: 'contract',
      data: contractContent
    });
    
    return {
      success: true,
      message: '合同已生成，请查看并确认',
      contractId: result.id
    };
  }
});
```

### 3.6.2 Skill 注册

```typescript
// skills/index.ts
import generateContract from './generate-contract';
import generateQuote from './generate-quote';

export const skills = [
  generateContract,
  generateQuote
];
```

---

## 3.7 工具注册与发现

### 3.7.1 工具注册

```typescript
// tools/index.ts
import query from './query';
import aggregate from './aggregate';
import mutate from './mutate';
import action from './action';
import export_ from './export';
import imageProcess from './image-process';
import xianyuQuery from './xianyu-query';

export const tools = {
  // Native Tools
  native: [query, aggregate, mutate, action, export_],
  
  // CLI Wrappers
  cli: [imageProcess],
  
  // MCP Adapters
  mcp: [xianyuQuery]
};

export function registerTools(pluginContext: PluginContext) {
  // 注册 Native Tools
  for (const tool of tools.native) {
    pluginContext.registerTool(tool);
  }
  
  // 注册 CLI Wrappers
  for (const tool of tools.cli) {
    pluginContext.registerCLITool(tool);
  }
  
  // 注册 MCP Adapters
  for (const tool of tools.mcp) {
    pluginContext.registerMCPTool(tool);
  }
}
```

### 3.7.2 工具发现机制

```typescript
// 核心工具发现服务
class ToolDiscoveryService {
  private skillCache = new Map<string, Skill>();
  private helpCache = new Map<string, string>();
  
  /**
   * 获取工具概览（极低 Token 消耗）
   * 只返回工具名称和简短描述
   */
  getToolOverview(): ToolOverview[] {
    return [
      { name: 'sales_query', type: 'native', description: '查询销售数据' },
      { name: 'sales_mutate', type: 'native', description: '变更销售数据' },
      { name: 'image_process', type: 'cli', description: '图像处理', skillFile: './skills/gimp-skill.md' },
      { name: 'xianyu_query', type: 'mcp', description: '闲鱼订单查询' }
    ];
  }
  
  /**
   * 按需加载工具详情
   */
  async loadToolDetail(toolName: string): Promise<ToolDetail> {
    const tool = this.getTool(toolName);
    
    switch (tool.type) {
      case 'native':
        // Native Tool: 返回完整 Schema
        return {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        };
        
      case 'cli':
        // CLI Tool: 只加载 SKILL.md frontmatter
        const skill = await this.loadSkillFrontmatter(tool.skillFile);
        return {
          name: tool.name,
          description: skill.description,
          skillFile: tool.skillFile,
          hint: '使用 --help 获取详细参数'
        };
        
      case 'mcp':
        // MCP Tool: 返回基本描述
        return {
          name: tool.name,
          description: tool.description,
          service: tool.mcp.service,
          hint: '需要配置外部服务'
        };
    }
  }
  
  /**
   * 加载 SKILL.md frontmatter（约 50 tokens）
   */
  private async loadSkillFrontmatter(skillFile: string): Promise<SkillFrontmatter> {
    if (this.skillCache.has(skillFile)) {
      return this.skillCache.get(skillFile)!;
    }
    
    const content = await fs.readFile(skillFile, 'utf-8');
    const frontmatter = this.parseYAMLFrontmatter(content);
    
    this.skillCache.set(skillFile, frontmatter);
    return frontmatter;
  }
}
```

---

## 3.8 工具描述规范

### 3.8.1 描述模板

为帮助AI正确选择工具，工具描述应包含：

```typescript
const TOOL_DESCRIPTION_TEMPLATE = `
  {工具功能概述}
  
  适用场景：
  - {场景1}
  - {场景2}
  
  实体类型：
  - {entity1}: {说明}
  - {entity2}: {说明}
  
  参数说明：
  - {param1}: {说明} ({是否必填})
  - {param2}: {说明}
  
  示例用法：
  - "{用户问题}" → {参数示例}
`;
```

### 3.8.2 完整示例

```typescript
const QUERY_TOOL_DESCRIPTION = `
  查询销售部数据（合同、订单、客户、报价单）
  
  适用场景：
  - 获取具体记录列表
  - 查看详情
  - 按条件筛选数据
  
  实体类型：
  - contract: 合同（包含金额、状态、签约方等）
  - order: 订单（包含商品、数量、金额等）
  - customer: 客户（包含联系方式、地址等）
  - quote: 报价单（包含报价明细、有效期等）
  
  参数说明：
  - entity: 实体类型（必填）
  - filters: 过滤条件
    - dateRange: 时间范围 { start, end }
    - status: 状态（支持数组）
    - ownerId: 归属人ID
    - keyword: 关键词搜索
  - fields: 返回字段（可选，默认返回核心字段）
  - page: 页码（默认1）
  - pageSize: 每页数量（默认20）
  
  示例用法：
  - "今天签了哪些合同？" → { entity: "contract", filters: { dateRange: "today", status: "signed" } }
  - "王明的客户有哪些？" → { entity: "customer", filters: { ownerId: "王明ID" } }
`;
```

---

## 3.9 Token 预算管理

### 3.9.1 预算分配策略

```typescript
class TokenBudgetManager {
  private maxTokens = 8000;
  private usedTokens = 0;
  
  /**
   * 估算工具加载成本
   */
  estimateToolCost(tool: Tool): number {
    switch (tool.type) {
      case 'native':
        // Native Tool: 完整 Schema，约 200-500 tokens
        return 300;
        
      case 'cli':
        // CLI Tool: 只加载 frontmatter，约 50 tokens
        return 50;
        
      case 'mcp':
        // MCP Tool: 基本描述，约 100 tokens
        return 100;
        
      default:
        return 200;
    }
  }
  
  /**
   * 智能加载工具
   */
  async loadTool(toolName: string): Promise<boolean> {
    const tool = this.getTool(toolName);
    const cost = this.estimateToolCost(tool);
    
    if (this.usedTokens + cost > this.maxTokens) {
      // 预算不足，尝试释放低优先级工具
      if (!this.tryFreeBudget(cost)) {
        throw new TokenBudgetExceeded();
      }
    }
    
    await this.doLoadTool(tool);
    this.usedTokens += cost;
    return true;
  }
}
```

### 3.9.2 按需加载策略

```
初始加载（约 500 tokens）：
┌─────────────────────────────────────────────────────────┐
│  只加载所有工具的概览信息：                              │
│  - sales_query: 查询销售数据 (native)                   │
│  - sales_mutate: 变更销售数据 (native)                  │
│  - image_process: 图像处理 (cli, skill: gimp-skill.md)  │
│  - xianyu_query: 闲鱼订单查询 (mcp)                     │
└─────────────────────────────────────────────────────────┘

按需加载（每次约 50-300 tokens）：
┌─────────────────────────────────────────────────────────┐
│  用户请求图像处理时：                                    │
│  - 加载 gimp-skill.md 的 frontmatter (50 tokens)        │
│  - 使用 --help 获取具体命令 (20 tokens)                 │
│  - 执行命令并返回 JSON 结果 (30 tokens)                 │
└─────────────────────────────────────────────────────────┘
```

---

## 3.10 错误处理规范

### 3.10.1 统一错误格式

```typescript
interface ToolError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestions?: string[];
}

// 错误码定义
const ErrorCodes = {
  // 通用错误
  'TOOL_NOT_FOUND': { code: 'E001', recoverable: false },
  'INVALID_PARAMS': { code: 'E002', recoverable: true },
  'PERMISSION_DENIED': { code: 'E003', recoverable: false },
  
  // Native Tool 错误
  'DATABASE_ERROR': { code: 'E101', recoverable: true },
  'VALIDATION_ERROR': { code: 'E102', recoverable: true },
  
  // CLI 错误
  'CLI_NOT_INSTALLED': { code: 'E201', recoverable: true },
  'CLI_TIMEOUT': { code: 'E202', recoverable: true },
  'CLI_EXECUTION_ERROR': { code: 'E203', recoverable: true },
  
  // MCP 错误
  'MCP_SERVICE_UNAVAILABLE': { code: 'E301', recoverable: true },
  'MCP_AUTH_FAILED': { code: 'E302', recoverable: true },
  'MCP_RATE_LIMITED': { code: 'E303', recoverable: true }
};
```

### 3.10.2 错误处理示例

```typescript
handler: async (params, context) => {
  try {
    // 执行操作
    const result = await doOperation(params);
    return result;
    
  } catch (error) {
    // CLI 错误处理
    if (error.code === 'ENOENT') {
      throw {
        code: 'CLI_NOT_INSTALLED',
        message: 'GIMP CLI 未安装',
        recoverable: true,
        suggestions: [
          '运行 pip install cli-anything-gimp 安装 CLI',
          '确保 GIMP 已安装在系统中'
        ]
      };
    }
    
    // 超时错误
    if (error.code === 'ETIMEDOUT') {
      throw {
        code: 'CLI_TIMEOUT',
        message: '图像处理超时',
        recoverable: true,
        suggestions: [
          '尝试减小图像尺寸',
          '简化处理操作',
          '增加超时时间'
        ]
      };
    }
    
    // 其他错误
    throw {
      code: 'CLI_EXECUTION_ERROR',
      message: error.message,
      recoverable: true,
      details: error
    };
  }
}
```

---

## 下一步

- [第4章：数据层规范](./04-data-spec.md)
- [第5章：业务层规范](./05-business-spec.md)
