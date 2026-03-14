# 第9章：示例插件 (Examples)

> 提供最小插件、完整插件和扩展示例，帮助开发者快速理解插件开发。

---

## 9.1 最小插件示例

### 9.1.1 场景说明

创建一个最简单的"公告"插件，仅提供公告的查询功能。

### 9.1.2 文件结构

```
plugins/
└── announcement/
    ├── plugin.json          # 插件清单
    ├── tools/
    │   ├── index.ts         # 工具入口
    │   └── query.ts         # 查询工具
    └── data/
        └── models/
            └── announcement.ts
```

### 9.1.3 插件清单

```json
// plugin.json
{
  "$schema": "https://ai-automated-office.com/schemas/plugin.json",
  
  "id": "announcement",
  "name": "公告管理",
  "version": "1.0.0",
  "description": "企业公告发布与查询",
  "author": "AI-Automated-office Team",
  "type": "standard",
  "icon": "megaphone",
  
  "tools": {
    "register": ["query"],
    "public": ["query"]
  }
}
```

### 9.1.4 数据模型

```typescript
// data/models/announcement.ts
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  publisherId: string;
  publisherName: string;
  publishedAt: Date;
  companyId: string;
}
```

### 9.1.5 查询工具

```typescript
// tools/query.ts
import { defineTool } from '@office/plugin-sdk';

export default defineTool({
  name: 'announcement_query',
  description: `
    查询企业公告
    适用场景：查看公告列表、搜索公告
    
    参数：
    - filters.type: 公告类型 (info/warning/important)
    - filters.keyword: 关键词搜索
    - page: 页码
    - pageSize: 每页数量
  `,
  
  parameters: {
    type: 'object',
    properties: {
      filters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['info', 'warning', 'important'] },
          keyword: { type: 'string' }
        }
      },
      page: { type: 'number', default: 1 },
      pageSize: { type: 'number', default: 20 }
    }
  },
  
  handler: async (params, context) => {
    const { filters = {}, page = 1, pageSize = 20 } = params;
    
    // 模拟数据（实际应从数据库查询）
    const announcements = [
      {
        id: 'A001',
        title: '春节放假通知',
        content: '根据国家规定...',
        type: 'important',
        publisherName: '行政部',
        publishedAt: '2024-01-20'
      }
    ];
    
    return {
      total: announcements.length,
      page,
      pageSize,
      items: announcements
    };
  }
});
```

---

## 9.2 完整插件示例：销售部

### 9.2.1 文件结构

```
plugins/
└── sales/
    ├── plugin.json
    │
    ├── ui/
    │   ├── index.tsx
    │   ├── routes/
    │   │   ├── Dashboard.tsx
    │   │   ├── Contracts.tsx
    │   │   ├── Orders.tsx
    │   │   └── Customers.tsx
    │   ├── components/
    │   │   ├── ContractCard.tsx
    │   │   └── OrderTable.tsx
    │   └── sidebar/
    │       └── index.ts
    │
    ├── tools/
    │   ├── index.ts
    │   ├── query.ts
    │   ├── aggregate.ts
    │   ├── mutate.ts
    │   ├── action.ts
    │   └── export.ts
    │
    ├── skills/
    │   ├── index.ts
    │   └── generate-contract.ts
    │
    ├── data/
    │   ├── models/
    │   │   ├── contract.ts
    │   │   ├── order.ts
    │   │   └── customer.ts
    │   ├── migrations/
    │   │   └── 001_init.sql
    │   └── repositories/
    │       ├── contract.repo.ts
    │       └── order.repo.ts
    │
    ├── services/
    │   ├── contract.service.ts
    │   └── order.service.ts
    │
    ├── handlers/
    │   └── approval.handler.ts
    │
    ├── permissions/
    │   └── index.ts
    │
    └── tests/
        └── tools/
            └── query.test.ts
```

### 9.2.2 完整 plugin.json

```json
{
  "$schema": "https://ai-automated-office.com/schemas/plugin.json",
  
  "id": "sales",
  "name": "销售部",
  "version": "1.0.0",
  "description": "销售管理模块，支持客户管理、合同管理、订单管理、销售自动化",
  "author": "AI-Automated-office Team",
  "license": "MIT",
  "type": "core",
  "icon": "briefcase",
  
  "compatibility": {
    "platformVersion": ">=1.0.0",
    "runtime": "tauri"
  },
  
  "dependencies": {
    "hr": ">=1.0.0",
    "warehouse": ">=1.0.0"
  },
  
  "permissions": {
    "required": [
      "hr:employee:read",
      "hr:department:read"
    ],
    "optional": [
      "finance:invoice:write"
    ]
  },
  
  "dataAccess": {
    "models": ["contract", "order", "customer", "quote"],
    "externalModels": [
      { "plugin": "hr", "models": ["employee", "department"], "access": "read" },
      { "plugin": "warehouse", "models": ["inventory"], "access": "read" }
    ],
    "storage": {
      "type": "sqlite",
      "migration": "auto"
    }
  },
  
  "ui": {
    "entry": "./ui/index.tsx",
    "routes": [
      { "path": "/sales", "component": "Dashboard", "title": "销售概览" },
      { "path": "/sales/contracts", "component": "Contracts", "title": "合同管理", "auth": ["sales:contract:read"] },
      { "path": "/sales/contracts/:id", "component": "ContractDetail", "title": "合同详情" },
      { "path": "/sales/orders", "component": "Orders", "title": "订单管理", "auth": ["sales:order:read"] },
      { "path": "/sales/customers", "component": "Customers", "title": "客户管理", "auth": ["sales:customer:read"] }
    ],
    "sidebar": {
      "title": "销售管理",
      "icon": "briefcase",
      "order": 2,
      "items": [
        { "title": "销售概览", "path": "/sales", "icon": "layout-dashboard" },
        { "title": "合同管理", "path": "/sales/contracts", "icon": "file-text" },
        { 
          "title": "订单管理", 
          "path": "/sales/orders", 
          "icon": "shopping-cart",
          "children": [
            { "title": "全部订单", "path": "/sales/orders" },
            { "title": "待发货", "path": "/sales/orders?status=pending" },
            { "title": "已完成", "path": "/sales/orders?status=completed" }
          ]
        },
        { "title": "客户管理", "path": "/sales/customers", "icon": "users" }
      ]
    }
  },
  
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
  },
  
  "skills": [
    {
      "id": "generate-contract",
      "name": "AI生成合同",
      "description": "根据客户信息和报价单自动生成合同初稿",
      "trigger": "natural-language",
      "examples": [
        "帮我给XX公司生成一份采购合同",
        "根据报价单Q2024001生成合同"
      ]
    }
  ],
  
  "events": {
    "subscribes": [
      "approval:approved",
      "approval:rejected"
    ],
    "publishes": [
      "sales:contract:signed",
      "sales:order:created",
      "sales:customer:added"
    ]
  },
  
  "exports": {
    "models": ["contract", "order", "customer"],
    "services": ["contractService", "orderService"],
    "tools": ["query", "aggregate"]
  },
  
  "roles": {
    "sales-person": {
      "name": "销售员",
      "description": "普通销售人员",
      "permissions": [
        "sales:contract:read",
        "sales:contract:write",
        "sales:order:read",
        "sales:order:write",
        "sales:customer:read",
        "sales:customer:write"
      ],
      "dataScope": "self"
    },
    "sales-manager": {
      "name": "销售经理",
      "description": "销售部门经理",
      "extends": "sales-person",
      "permissions": [
        "sales:*",
        "approval:request:approve"
      ],
      "dataScope": "department"
    }
  }
}
```

### 9.2.3 核心工具实现

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
    
    示例用法：
    - "今天签了哪些合同？" → { entity: "contract", filters: { dateRange: "今天", status: "signed" } }
    - "王明的客户有哪些？" → { entity: "customer", filters: { ownerId: "王明ID" } }
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
          status: { type: ['string', 'array'] },
          ownerId: { type: 'string' },
          keyword: { type: 'string' }
        }
      },
      fields: { type: 'array', items: { type: 'string' } },
      page: { type: 'number', default: 1 },
      pageSize: { type: 'number', default: 20 }
    },
    required: ['entity']
  },
  
  handler: async (params, context) => {
    const { entity, filters, fields, page = 1, pageSize = 20 } = params;
    
    // 权限检查
    await context.checkPermission(`sales:${entity}:read`);
    
    // 获取Repository
    const repo = getRepository(entity, context);
    
    // 执行查询
    const result = await repo.query({
      filters,
      fields,
      page,
      pageSize
    });
    
    // 审计日志
    context.auditLog({
      action: 'query',
      entity,
      filters,
      resultCount: result.total
    });
    
    return result;
  }
});
```

### 9.2.4 Skill实现

```typescript
// skills/generate-contract.ts
import { defineSkill } from '@office/plugin-sdk';

export default defineSkill({
  id: 'generate-contract',
  name: 'AI生成合同',
  description: '根据客户信息和报价单自动生成合同初稿',
  trigger: 'natural-language',
  tools: ['sales_query', 'sales_mutate'],
  
  examples: [
    '帮我给XX公司生成一份采购合同',
    '根据报价单Q2024001生成合同'
  ],
  
  execute: async (context) => {
    const { userMessage, callTool, llm } = context;
    
    // 1. 解析用户意图
    const intent = await llm.analyze(userMessage, {
      task: 'extract_contract_requirements',
      schema: {
        customerName: 'string',
        quoteId: 'string?',
        requirements: 'string?'
      }
    });
    
    // 2. 查询客户信息
    const customers = await callTool('sales_query', {
      entity: 'customer',
      filters: { keyword: intent.customerName }
    });
    
    if (customers.total === 0) {
      return {
        success: false,
        message: `未找到客户"${intent.customerName}"，请确认客户名称或先创建客户`
      };
    }
    
    const customer = customers.items[0];
    
    // 3. 查询报价单（如有）
    let quote = null;
    if (intent.quoteId) {
      const quotes = await callTool('sales_query', {
        entity: 'quote',
        filters: { id: intent.quoteId }
      });
      quote = quotes.items[0];
    }
    
    // 4. AI生成合同内容
    const contractContent = await llm.generate({
      template: 'contract_template',
      variables: {
        customer,
        quote,
        requirements: intent.requirements,
        currentDate: new Date().toISOString().split('T')[0]
      }
    });
    
    // 5. 创建合同草稿
    const result = await callTool('sales_mutate', {
      action: 'create',
      entity: 'contract',
      data: {
        title: contractContent.title,
        customerId: customer.id,
        customerName: customer.name,
        amount: contractContent.amount,
        terms: contractContent.terms,
        status: 'draft'
      }
    });
    
    return {
      success: true,
      message: `合同"${contractContent.title}"已生成草稿，请查看并确认`,
      contractId: result.id
    };
  }
});
```

### 9.2.5 UI组件

```tsx
// ui/routes/Contracts.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Button, Input, Select, Badge } from '@/components/ui';
import { Search, Plus, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export default function Contracts() {
  const [filters, setFilters] = useState({
    status: '',
    keyword: ''
  });
  
  const { data, isLoading } = useQuery({
    queryKey: ['contracts', filters],
    queryFn: () => api.callTool('sales_query', {
      entity: 'contract',
      filters
    })
  });
  
  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <header className="flex-shrink-0 border-b bg-card p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">合同管理</h1>
            <p className="text-muted-foreground">管理所有销售合同</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              筛选
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              新建合同
            </Button>
          </div>
        </div>
      </header>
      
      {/* 工具栏 */}
      <div className="flex-shrink-0 border-b bg-card p-4">
        <div className="flex gap-4">
          <Input
            placeholder="搜索合同..."
            className="w-64"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="状态筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
              <SelectItem value="signed">已签订</SelectItem>
              <SelectItem value="executing">执行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* 数据表格 */}
      <main className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>合同编号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>签订日期</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.contractNo}</TableCell>
                  <TableCell>{contract.title}</TableCell>
                  <TableCell>{contract.customerName}</TableCell>
                  <TableCell>¥{contract.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <StatusBadge status={contract.status} />
                  </TableCell>
                  <TableCell>{contract.signedAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">查看</Button>
                    <Button variant="ghost" size="sm">编辑</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { label: '草稿', variant: 'secondary' },
    signed: { label: '已签订', variant: 'default' },
    executing: { label: '执行中', variant: 'info' },
    completed: { label: '已完成', variant: 'success' }
  };
  
  const { label, variant } = config[status] || { label: status, variant: 'secondary' };
  
  return <Badge variant={variant}>{label}</Badge>;
}
```

---

## 9.3 扩展插件示例：售后服务

### 9.3.1 场景说明

售后服务插件，依赖销售插件，处理客户售后工单。

### 9.3.2 依赖声明

```json
{
  "id": "after-sales",
  "name": "售后服务",
  "version": "1.0.0",
  "dependencies": {
    "sales": ">=1.0.0"
  },
  "dataAccess": {
    "models": ["ticket", "ticket-message"],
    "externalModels": [
      { 
        "plugin": "sales", 
        "models": ["contract", "order", "customer"], 
        "access": "read" 
      }
    ]
  }
}
```

### 9.3.3 跨插件数据访问

```typescript
// tools/query.ts
handler: async (params, context) => {
  const { entity, filters } = params;
  
  if (entity === 'ticket') {
    // 查询工单时，关联销售插件的客户数据
    const tickets = await ticketRepo.query(filters);
    
    // 通过工具调用获取客户信息
    const customerIds = [...new Set(tickets.items.map(t => t.customerId))];
    const customers = await context.callTool('sales_query', {
      entity: 'customer',
      filters: { ids: customerIds }
    });
    
    // 合并数据
    const customerMap = new Map(customers.items.map(c => [c.id, c]));
    const enrichedTickets = tickets.items.map(t => ({
      ...t,
      customer: customerMap.get(t.customerId)
    }));
    
    return { ...tickets, items: enrichedTickets };
  }
}
```

---

## 下一步

- [第10章：附录](./10-appendix.md)
