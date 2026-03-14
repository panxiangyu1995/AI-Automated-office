# 第3章：工具层规范 (Tools Specification)

> 工具层是插件的核心能力层，提供 AI Agent 可调用的原子操作和复杂技能。

---

## 3.1 概述

工具层包含三种类型的工具：

| 类型 | 说明 | 复杂度 | 示例 |
|------|------|:------:|------|
| **Tools** | 原子操作，单一职责 | 低 | 查询、创建、更新 |
| **Skills** | 复杂技能，多步骤组合 | 中 | AI生成合同、智能报价 |
| **MCP** | 外部服务接入 | 高 | 闲鱼API、钉钉集成 |

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

| 工具类型 | 命名格式 | 用途 |
|---------|---------|------|
| **query** | `{plugin}_query` | 通用数据查询 |
| **aggregate** | `{plugin}_aggregate` | 统计聚合 |
| **mutate** | `{plugin}_mutate` | 数据变更（增删改） |
| **action** | `{plugin}_action` | 业务操作 |
| **export** | `{plugin}_export` | 数据导出 |

### 3.2.3 工具数量对比

| 部门 | 专用工具数（旧方案） | 通用工具数（新方案） | 减少 |
|------|---------------------|---------------------|------|
| 销售部 | 30+ | 4 | 87% |
| 财务部 | 25+ | 4 | 84% |
| 人事部 | 20+ | 4 | 80% |
| 审批中心 | 20+ | 4 | 80% |
| **总计** | **150+** | **~25** | **83%** |

---

## 3.3 通用查询工具

### 3.3.1 接口定义

```typescript
// 工具名: {plugin}_query
// 示例: sales_query, hr_query, finance_query

interface UniversalQueryParams {
  // 实体类型（必填）
  entity: string;
  
  // 过滤条件（可选）
  filters?: {
    dateRange?: { start: Date | string; end: Date | string };
    status?: string | string[];
    ownerId?: string;
    departmentId?: string;
    keyword?: string;
    custom?: Record<string, any>;
  };
  
  // 返回字段（可选）
  fields?: string[];
  
  // 分页
  page?: number;
  pageSize?: number;
  
  // 排序
  orderBy?: { field: string; direction: 'asc' | 'desc' };
}

interface UniversalQueryResult<T = Record<string, any>> {
  entity: string;
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
```

### 3.3.2 实体类型映射

每个插件的实体类型：

| 插件 | 实体类型 |
|------|---------|
| sales | `contract` `order` `customer` `quote` `lead` |
| hr | `employee` `department` `position` `attendance` `leave` |
| finance | `invoice` `expense` `payment` `ledger` `budget` |
| warehouse | `inventory` `inbound` `outbound` `location` |
| approval | `request` `workflow` `template` `history` |

### 3.3.3 实现示例

```typescript
// tools/query.ts
import { defineTool } from '@office/plugin-sdk';
import { ContractRepository, OrderRepository, CustomerRepository } from '../data/repositories';

export default defineTool({
  name: 'sales_query',
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
    let repository;
    switch (entity) {
      case 'contract':
        repository = new ContractRepository(context.db);
        break;
      case 'order':
        repository = new OrderRepository(context.db);
        break;
      case 'customer':
        repository = new CustomerRepository(context.db);
        break;
      default:
        throw new Error(`Unknown entity: ${entity}`);
    }
    
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

---

## 3.4 统计聚合工具

### 3.4.1 接口定义

```typescript
// 工具名: {plugin}_aggregate

interface UniversalAggregateParams {
  // 实体类型
  entity: string;
  
  // 过滤条件
  filters?: UniversalQueryParams['filters'];
  
  // 聚合配置
  aggregations: {
    metric: 'sum' | 'count' | 'avg' | 'max' | 'min';
    field: string;
    alias?: string;
  }[];
  
  // 分组
  groupBy?: string | string[];
  
  // 时间分组（快捷方式）
  timeGroup?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

interface UniversalAggregateResult {
  entity: string;
  total: Record<string, number>;
  groups?: {
    key: string | Record<string, any>;
    metrics: Record<string, number>;
  }[];
}
```

### 3.4.2 实现示例

```typescript
// tools/aggregate.ts
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'sales_aggregate',
  description: `
    统计聚合销售数据
    适用场景：计算总和、平均值、计数、按条件分组统计
    
    示例用法：
    - "今天合同总额多少？"
      entity: "contract", aggregations: [{ metric: "sum", field: "amount" }]
    - "按销售统计合同金额"
      entity: "contract", aggregations: [{ metric: "sum", field: "amount" }], groupBy: "salesName"
    - "每月销售额趋势"
      entity: "order", aggregations: [{ metric: "sum", field: "amount" }], timeGroup: "month"
  `,
  
  parameters: {
    type: 'object',
    properties: {
      entity: { type: 'string', enum: ['contract', 'order', 'customer'] },
      filters: { type: 'object' },
      aggregations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            metric: { type: 'string', enum: ['sum', 'count', 'avg', 'max', 'min'] },
            field: { type: 'string' },
            alias: { type: 'string' }
          },
          required: ['metric', 'field']
        }
      },
      groupBy: { type: ['string', 'array'] },
      timeGroup: { type: 'string', enum: ['day', 'week', 'month', 'quarter', 'year'] }
    },
    required: ['entity', 'aggregations']
  },
  
  handler: async (params: UniversalAggregateParams, context: ToolContext) => {
    const { entity, filters, aggregations, groupBy, timeGroup } = params;
    
    await context.checkPermission(`sales:${entity}:read`);
    
    const repository = getRepository(entity, context);
    const result = await repository.aggregate({
      filters,
      aggregations,
      groupBy,
      timeGroup
    });
    
    context.auditLog({
      action: 'aggregate',
      entity,
      aggregations
    });
    
    return result;
  }
});
```

---

## 3.5 数据变更工具

### 3.5.1 接口定义

```typescript
// 工具名: {plugin}_mutate

interface UniversalMutateParams {
  // 操作类型
  action: 'create' | 'update' | 'delete';
  
  // 实体类型
  entity: string;
  
  // 数据（create/update时必填）
  data?: Record<string, any>;
  
  // 条件（update/delete时必填）
  where?: { id: string } | { ids: string[] };
  
  // 是否批量操作
  batch?: boolean;
}

interface UniversalMutateResult {
  success: boolean;
  action: string;
  entity: string;
  affected?: number;
  id?: string;
  ids?: string[];
}
```

### 3.5.2 实现示例

```typescript
// tools/mutate.ts
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'sales_mutate',
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
    
    context.auditLog({
      action,
      entity,
      data,
      where
    });
    
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

## 3.6 业务操作工具

### 3.6.1 接口定义

```typescript
// 工具名: {plugin}_action

interface ActionParams {
  // 操作名称
  action: string;
  
  // 目标实体
  entity: string;
  
  // 目标ID
  targetId: string;
  
  // 操作参数
  params?: Record<string, any>;
}

interface ActionResult {
  success: boolean;
  action: string;
  entity: string;
  targetId: string;
  result?: Record<string, any>;
  message?: string;
}
```

### 3.6.2 实现示例

```typescript
// tools/action.ts
import { defineTool } from '@office/plugin-sdk';

// 定义支持的操作
const SUPPORTED_ACTIONS = {
  contract: ['submit', 'approve', 'reject', 'cancel', 'renew'],
  order: ['confirm', 'ship', 'complete', 'cancel', 'refund'],
  quote: ['send', 'accept', 'reject', 'expire']
};

export default defineTool({
  name: 'sales_action',
  description: `
    执行销售业务操作
    
    合同操作：
    - submit: 提交审批
    - approve: 审批通过
    - reject: 审批驳回
    - cancel: 取消合同
    - renew: 续签
    
    订单操作：
    - confirm: 确认订单
    - ship: 发货
    - complete: 完成
    - cancel: 取消
    - refund: 退款
  `,
  
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string' },
      entity: { type: 'string' },
      targetId: { type: 'string' },
      params: { type: 'object' }
    },
    required: ['action', 'entity', 'targetId']
  },
  
  handler: async (params: ActionParams, context: ToolContext) => {
    const { action, entity, targetId, params: actionParams } = params;
    
    // 验证操作是否支持
    if (!SUPPORTED_ACTIONS[entity]?.includes(action)) {
      throw new Error(`Unsupported action: ${action} for ${entity}`);
    }
    
    await context.checkPermission(`sales:${entity}:${action}`);
    
    const service = getService(entity, context);
    const result = await service.executeAction(action, targetId, actionParams);
    
    // 发布事件
    context.emitEvent(`sales:${entity}:${action}ed`, { id: targetId, result });
    
    return {
      success: true,
      action,
      entity,
      targetId,
      result
    };
  }
});
```

---

## 3.7 数据导出工具

### 3.7.1 接口定义

```typescript
// 工具名: {plugin}_export

interface ExportParams {
  // 实体类型
  entity: string;
  
  // 过滤条件
  filters?: UniversalQueryParams['filters'];
  
  // 导出格式
  format: 'excel' | 'csv' | 'pdf';
  
  // 导出字段
  fields?: string[];
  
  // 文件名
  filename?: string;
}

interface ExportResult {
  success: boolean;
  filename: string;
  filepath: string;
  recordCount: number;
  expiresAt: Date;
}
```

### 3.7.2 实现示例

```typescript
// tools/export.ts
import { defineTool } from '@office/plugin-sdk';
import { exportToExcel, exportToCSV, exportToPDF } from '@office/export-utils';

export default defineTool({
  name: 'sales_export',
  description: `
    导出销售报表
    
    支持格式：
    - excel: Excel文件(.xlsx)
    - csv: CSV文件(.csv)
    - pdf: PDF文件(.pdf)
  `,
  
  parameters: {
    type: 'object',
    properties: {
      entity: { type: 'string' },
      filters: { type: 'object' },
      format: { type: 'string', enum: ['excel', 'csv', 'pdf'] },
      fields: { type: 'array', items: { type: 'string' } },
      filename: { type: 'string' }
    },
    required: ['entity', 'format']
  },
  
  handler: async (params: ExportParams, context: ToolContext) => {
    const { entity, filters, format, fields, filename } = params;
    
    await context.checkPermission(`sales:${entity}:export`);
    
    // 查询数据
    const repository = getRepository(entity, context);
    const { items } = await repository.query({ filters, fields, pageSize: 10000 });
    
    // 导出文件
    const defaultFilename = `${entity}_${formatDate(new Date())}.${format}`;
    const exportFilename = filename || defaultFilename;
    
    let filepath: string;
    switch (format) {
      case 'excel':
        filepath = await exportToExcel(items, fields, exportFilename);
        break;
      case 'csv':
        filepath = await exportToCSV(items, fields, exportFilename);
        break;
      case 'pdf':
        filepath = await exportToPDF(items, fields, exportFilename);
        break;
    }
    
    context.auditLog({
      action: 'export',
      entity,
      format,
      recordCount: items.length
    });
    
    return {
      success: true,
      filename: exportFilename,
      filepath,
      recordCount: items.length,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后过期
    };
  }
});
```

---

## 3.8 Skills 规范

### 3.8.1 Skill 定义

Skill 是多个工具的组合，用于实现复杂的业务场景：

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
    const { userMessage, callTool } = context;
    
    // 1. 解析用户意图
    const intent = await context.llm.analyze(userMessage, {
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
    const contractContent = await context.llm.generate({
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

### 3.8.2 Skill 注册

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

## 3.9 MCP 规范

### 3.9.1 MCP 服务定义

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
        // 调用闲鱼API
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

---

## 3.10 工具描述规范

### 3.10.1 描述模板

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

### 3.10.2 完整示例

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
  - "今天签了哪些合同？" 
    → { entity: "contract", filters: { dateRange: "今天", status: "signed" } }
  - "王明的客户有哪些？"
    → { entity: "customer", filters: { ownerId: "王明ID" } }
  - "查看订单O001的详情"
    → { entity: "order", filters: { id: "O001" }, fields: ["*"] }
`;
```

---

## 3.11 工具注册

### 3.11.1 注册入口

```typescript
// tools/index.ts
import query from './query';
import aggregate from './aggregate';
import mutate from './mutate';
import action from './action';
import exportTool from './export';

export const tools = {
  query,
  aggregate,
  mutate,
  action,
  export: exportTool
};

export type ToolName = keyof typeof tools;
```

### 3.11.2 插件配置

在 `plugin.json` 中声明：

```json
{
  "tools": {
    "register": ["query", "aggregate", "mutate", "action", "export"],
    "public": ["query", "aggregate"],
    "descriptions": {
      "query": "查询销售部数据（合同、订单、客户、报价单）",
      "aggregate": "统计聚合销售数据，支持按销售/客户/时间分组",
      "mutate": "创建、更新、删除销售数据",
      "action": "执行销售业务操作（审批、发货、退款等）",
      "export": "导出销售报表（Excel/PDF/CSV）"
    }
  }
}
```

---

## 3.12 工具调用流程

```
┌─────────────────────────────────────────────────────────────┐
│                    AI工具调用流程                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  用户问题："今天签了哪些合同？总额多少？"                   │
│                                                             │
│  Step 1: 意图识别                                           │
│  ├── 部门：销售部 (sales)                                   │
│  ├── 实体：合同 (contract)                                  │
│  ├── 操作：查询 + 聚合                                      │
│  └── 条件：时间=今天、状态=已签订                           │
│                                                             │
│  Step 2: 工具选择                                           │
│  ├── 查询列表 → sales_query                                │
│  └── 统计总额 → sales_aggregate                            │
│                                                             │
│  Step 3: 参数构建                                           │
│  ├── sales_query:                                          │
│  │   { entity: "contract",                                 │
│  │     filters: { dateRange: "今天", status: "signed" } }  │
│  │                                                          │
│  └── sales_aggregate:                                       │
│      { entity: "contract",                                  │
│        filters: { dateRange: "今天", status: "signed" },    │
│        aggregations: [{ metric: "sum", field: "amount" }], │
│        groupBy: "salesName" }                              │
│                                                             │
│  Step 4: 执行并返回                                         │
│  └── AI整合结果，生成自然语言回复                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 下一步

- [第4章：数据层规范](./04-data-spec.md)
- [第5章：业务层规范](./05-business-spec.md)
