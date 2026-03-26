# Design: 销售模块 - Agent工具集成

## 技术方案

### 实现类型
- **类型**: refactor
- **优先级**: medium
- **阶段**: Phase 4 - 业务模块动态化
- **后端必需**: Yes

### 前端实现

#### 现有代码
- `src/features/agent/components/SalesPilotIntegration.tsx` - 组件已存在，需连接后端工具

#### 新增文件
```
src/features/sales/
├── tools/
│   ├── index.ts              # 工具导出
│   ├── salesTools.ts         # 销售工具定义
│   └── salesToolDefinitions.ts # 工具描述符
├── hooks/
│   └── useSalesTools.ts      # 销售工具Hook
```

#### 模块结构
```typescript
// src/features/sales/tools/salesToolDefinitions.ts
export const SALES_TOOL_DEFINITIONS = [
  {
    name: 'sales_customer_query',
    description: '查询客户信息',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string', description: '客户ID' },
        fields: { type: 'array', items: { type: 'string' }, description: '返回字段' }
      },
      required: ['customerId']
    }
  },
  {
    name: 'sales_quotation_create',
    description: '创建报价单',
    parameters: {
      type: 'object',
      properties: {
        customerId: { type: 'string' },
        items: { type: 'array' },
        validUntil: { type: 'string', format: 'date' }
      },
      required: ['customerId', 'items']
    }
  },
  {
    name: 'sales_contract_generate',
    description: '生成销售合同',
    parameters: {
      type: 'object',
      properties: {
        quotationId: { type: 'string' },
        terms: { type: 'object' }
      },
      required: ['quotationId']
    }
  },
  {
    name: 'sales_batch_operation',
    description: '批量操作销售数据',
    parameters: {
      type: 'object',
      properties: {
        operation: { type: 'string', enum: ['update', 'delete', 'export'] },
        entityType: { type: 'string', enum: ['customer', 'quotation', 'contract'] },
        ids: { type: 'array', items: { type: 'string' } }
      },
      required: ['operation', 'entityType', 'ids']
    }
  }
];
```

### 后端实现

#### 目录结构
```
src-tauri/src/plugins/sales/
├── mod.rs          # 模块入口
├── tools.rs        # 销售工具实现
├── commands.rs     # Tauri命令接口
└── errors.rs       # 错误定义
```

#### 核心实现

```rust
// src-tauri/src/plugins/sales/tools.rs

use serde::{Deserialize, Serialize};
use crate::plugins::sales::commands::*;
use crate::plugins::sales::errors::SalesError;

/// 销售客户查询工具
pub async fn sales_customer_query(
    customer_id: String,
    fields: Option<Vec<String>>,
) -> Result<CustomerQueryResult, SalesError> {
    // 调用Story 54.3创建的数据层API
    let customer = invoke::<Customer>("plugin:sales|get_customer", customer_id).await?;
    Ok(CustomerQueryResult {
        customer,
        queried_fields: fields,
    })
}

/// 销售报价创建工具
pub async fn sales_quotation_create(
    customer_id: String,
    items: Vec<QuotationItem>,
    valid_until: String,
) -> Result<Quotation, SalesError> {
    let request = CreateQuotationRequest {
        customer_id,
        items,
        valid_until,
    };
    let quotation = invoke::<Quotation>("plugin:sales|create_quotation", request).await?;
    Ok(quotation)
}

/// 销售合同生成工具
pub async fn sales_contract_generate(
    quotation_id: String,
    terms: ContractTerms,
) -> Result<Contract, SalesError> {
    let request = GenerateContractRequest { quotation_id, terms };
    invoke::<Contract>("plugin:sales|generate_contract", request).await
}

/// 销售批量操作工具
pub async fn sales_batch_operation(
    operation: BatchOperation,
    entity_type: EntityType,
    ids: Vec<String>,
) -> Result<BatchOperationResult, SalesError> {
    match operation {
        BatchOperation::Update => update_entities(entity_type, ids).await,
        BatchOperation::Delete => delete_entities(entity_type, ids).await,
        BatchOperation::Export => export_entities(entity_type, ids).await,
    }
}
```

### API 设计

#### 前端工具调用接口
```typescript
// 工具执行器接口
interface SalesToolExecutor {
  execute(toolName: string, params: Record<string, unknown>): Promise<ToolResult>;
  getAvailableTools(): ToolDefinition[];
}

// 使用示例
const executor = useSalesTools();
const result = await executor.execute('sales_customer_query', { customerId: 'C001' });
```

#### 后端Tauri命令
```rust
// 命令名称格式: plugin:sales|<action>
#[tauri::command]
async fn get_customer(customer_id: String) -> Result<Customer, String>;

#[tauri::command]
async fn create_quotation(request: CreateQuotationRequest) -> Result<Quotation, String>;

#[tauri::command]
async fn generate_contract(request: GenerateContractRequest) -> Result<Contract, String>;

#[tauri::command]
async fn batch_operation(
    operation: String,
    entity_type: String,
    ids: Vec<String>,
) -> Result<BatchOperationResult, String>;
```

### 数据模型

#### 前端类型
```typescript
// src/features/sales/types/index.ts
export interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number;
  createdAt: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  items: QuotationItem[];
  totalAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  createdAt: string;
}

export interface Contract {
  id: string;
  quotationId: string;
  customerId: string;
  terms: ContractTerms;
  totalAmount: number;
  status: 'draft' | 'signed' | 'active' | 'completed' | 'cancelled';
  signedAt?: string;
  createdAt: string;
}
```

### 智能推荐逻辑

```typescript
// 销售场景智能推荐
export async function getSalesRecommendations(
  context: AgentContext
): Promise<SalesRecommendation[]> {
  const { recentQueries, userProfile } = context;

  // 基于用户历史查询推荐
  if (recentQueries.includes('customer')) {
    return [
      { type: 'quotation', message: '您最近查询了客户，是否需要创建报价单？' },
      { type: 'contract', message: '基于历史数据，推荐生成合同草稿' }
    ];
  }

  // 基于时间节点推荐
  const today = new Date();
  if (today.getDate() === 1) {
    return [{ type: 'report', message: '月初了，建议查看本月销售报表' }];
  }

  return [];
}
```

### 组件集成

#### SalesPilotIntegration.tsx 增强
```typescript
// 连接前端工具与后端执行器
const SalesPilotIntegration: React.FC = () => {
  const { executeTool, tools } = useSalesTools();
  const { addToolResults } = useAgentRuntime();

  // 注册销售工具到Agent Runtime
  useEffect(() => {
    addToolResults(tools);
  }, [tools]);

  // 处理Agent调用
  const handleToolCall = async (toolName: string, params: any) => {
    return executeTool(toolName, params);
  };

  return <AgentToolPanel tools={tools} onExecute={handleToolCall} />;
};
```

## 状态管理

使用Zustand进行销售工具状态管理：
- `salesToolsStore` - 管理已注册工具列表
- `salesOperationStore` - 管理批量操作状态
- `salesRecommendationStore` - 管理智能推荐状态

## 安全考虑

- 遵循ADR-018安全设计
- 实现工具参数验证（JSON Schema验证）
- 添加销售数据权限校验（基于用户角色）
- 实现敏感操作二次确认（如合同生成）
- 添加操作审计日志

## 性能考虑

- 遵循NFR3响应性要求（工具执行 < 2s）
- 实现批量操作分页（每批最多100条）
- 添加操作结果缓存（TTL: 5分钟）
- 使用Web Worker处理大数据量导出
