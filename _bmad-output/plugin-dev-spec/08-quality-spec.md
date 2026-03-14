# 第8章：质量规范 (Quality Specification)

> 定义插件的代码规范、测试规范、安全规范和性能规范。

---

## 8.1 代码规范

### 8.1.1 TypeScript规范

```typescript
// ✅ 正确示例
import { defineTool } from '@office/plugin-sdk';

interface ContractQueryParams {
  entity: 'contract' | 'order' | 'customer';
  filters?: {
    dateRange?: { start: Date; end: Date };
    status?: string[];
  };
  page?: number;
  pageSize?: number;
}

export default defineTool({
  name: 'sales_query',
  description: '查询销售部数据',
  
  async handler(params: ContractQueryParams, context: ToolContext) {
    const { entity, filters, page = 1, pageSize = 20 } = params;
    
    // 明确的类型检查
    if (!['contract', 'order', 'customer'].includes(entity)) {
      throw new ValidationError(`Invalid entity: ${entity}`);
    }
    
    // 执行查询
    const result = await this.repository.query({
      entity,
      filters,
      page,
      pageSize
    });
    
    return result;
  }
});
```

### 8.1.2 命名规范

| 项目 | 规范 | 示例 |
|------|------|------|
| 文件名 | kebab-case | `contract.service.ts` |
| 类名 | PascalCase | `ContractService` |
| 接口名 | PascalCase + I前缀(可选) | `Contract` / `IContract` |
| 函数名 | camelCase | `getContractById` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 枚举 | PascalCase | `ContractStatus` |
| 枚举值 | UPPER_SNAKE_CASE | `ContractStatus.DRAFT` |

### 8.1.3 注释规范

```typescript
/**
 * 合同服务
 * 
 * 提供合同的创建、更新、查询、删除等操作
 * 
 * @example
 * ```ts
 * const contract = await contractService.createContract({
 *   title: '采购合同',
 *   amount: 100000
 * }, context);
 * ```
 */
export class ContractService {
  /**
   * 创建合同
   * 
   * @param data - 合同创建数据
   * @param context - 服务上下文
   * @returns 创建的合同
   * @throws {BusinessError} 当数据验证失败时
   * @throws {PermissionError} 当用户无权限时
   */
  async createContract(data: CreateContractDto, context: ServiceContext): Promise<Contract> {
    // 实现...
  }
}
```

### 8.1.4 ESLint配置

```json
// .eslintrc.json
{
  "extends": [
    "@office/eslint-config"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 8.2 测试规范

### 8.2.1 测试目录结构

```
tests/
├── unit/                    # 单元测试
│   ├── tools/
│   │   ├── query.test.ts
│   │   └── aggregate.test.ts
│   └── services/
│       └── contract.service.test.ts
├── integration/             # 集成测试
│   └── contract-flow.test.ts
└── e2e/                     # 端到端测试
    └── contract-crud.test.ts
```

### 8.2.2 单元测试

```typescript
// tests/unit/tools/query.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import queryTool from '@/tools/query';
import { createMockContext } from '@office/testing';

describe('sales_query tool', () => {
  let mockContext: MockContext;
  
  beforeEach(() => {
    mockContext = createMockContext();
    mockContext.db.query = vi.fn();
  });
  
  describe('handler', () => {
    it('should return contracts with correct pagination', async () => {
      // Arrange
      mockContext.db.query.mockResolvedValueOnce([
        { total: 100 }
      ]);
      mockContext.db.query.mockResolvedValueOnce([
        { id: 'C001', title: '合同1' },
        { id: 'C002', title: '合同2' }
      ]);
      
      // Act
      const result = await queryTool.handler({
        entity: 'contract',
        page: 1,
        pageSize: 20
      }, mockContext);
      
      // Assert
      expect(result.total).toBe(100);
      expect(result.items).toHaveLength(2);
      expect(result.page).toBe(1);
    });
    
    it('should apply filters correctly', async () => {
      // Arrange
      mockContext.db.query.mockResolvedValue([]);
      
      // Act
      await queryTool.handler({
        entity: 'contract',
        filters: {
          status: ['signed'],
          dateRange: { start: '2024-01-01', end: '2024-12-31' }
        }
      }, mockContext);
      
      // Assert
      expect(mockContext.db.query).toHaveBeenCalledWith(
        expect.stringContaining('status IN'),
        expect.arrayContaining(['signed'])
      );
    });
    
    it('should throw error for invalid entity', async () => {
      // Act & Assert
      await expect(queryTool.handler({
        entity: 'invalid' as any
      }, mockContext)).rejects.toThrow('Invalid entity');
    });
  });
});
```

### 8.2.3 集成测试

```typescript
// tests/integration/contract-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TestServer } from '@office/testing';

describe('Contract Flow Integration', () => {
  let server: TestServer;
  
  beforeAll(async () => {
    server = await TestServer.start({
      plugins: ['sales', 'approval']
    });
  });
  
  afterAll(async () => {
    await server.stop();
  });
  
  it('should complete full contract workflow', async () => {
    const client = server.createClient();
    
    // 1. 创建合同
    const contract = await client.callTool('sales_mutate', {
      action: 'create',
      entity: 'contract',
      data: {
        title: '测试合同',
        amount: 100000,
        customerId: 'CUS001'
      }
    });
    
    expect(contract.success).toBe(true);
    expect(contract.id).toBeDefined();
    
    // 2. 提交审批
    const approval = await client.callTool('sales_action', {
      action: 'submit',
      entity: 'contract',
      targetId: contract.id
    });
    
    expect(approval.success).toBe(true);
    
    // 3. 审批通过
    await server.emitEvent('approval:approved', {
      type: 'contract',
      entityId: contract.id
    });
    
    // 4. 验证状态
    const result = await client.callTool('sales_query', {
      entity: 'contract',
      filters: { id: contract.id }
    });
    
    expect(result.items[0].status).toBe('signed');
  });
});
```

### 8.2.4 测试覆盖率要求

| 类型 | 最低覆盖率 |
|------|-----------|
| 工具层 | 80% |
| 服务层 | 85% |
| Repository | 75% |
| **总体** | **80%** |

```bash
# 运行测试并生成覆盖率报告
npm run test:coverage

# 检查覆盖率是否达标
npm run test:coverage:check
```

---

## 8.3 安全规范

### 8.3.1 必须检查项

```
┌─────────────────────────────────────────────────────────────┐
│                    安全检查清单                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ 输入验证                                                │
│  ├── 所有外部输入必须验证                                   │
│  ├── 使用参数化查询，防止SQL注入                            │
│  └── 对用户输入进行XSS过滤                                  │
│                                                             │
│  ✅ 权限检查                                                │
│  ├── 所有操作必须检查权限                                   │
│  ├── 数据访问必须检查数据权限                               │
│  └── 敏感操作需要二次确认                                   │
│                                                             │
│  ✅ 数据安全                                                │
│  ├── 敏感数据加密存储                                       │
│  ├── 不记录敏感信息到日志                                   │
│  └── 导出数据需要审批                                       │
│                                                             │
│  ✅ 依赖安全                                                │
│  ├── 定期扫描依赖漏洞                                      │
│  ├── 不使用已知有漏洞的依赖                                 │
│  └── 锁定依赖版本                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3.2 安全编码示例

```typescript
// ❌ 错误：SQL注入风险
async unsafeQuery(id: string) {
  const sql = `SELECT * FROM contracts WHERE id = '${id}'`;
  return this.db.query(sql);
}

// ✅ 正确：参数化查询
async safeQuery(id: string) {
  const sql = 'SELECT * FROM contracts WHERE id = ?';
  return this.db.query(sql, [id]);
}

// ❌ 错误：直接使用用户输入
async unsafeFilter(status: string) {
  return this.db.query(`SELECT * FROM contracts WHERE status = '${status}'`);
}

// ✅ 正确：验证输入
async safeFilter(status: string) {
  const validStatuses = ['draft', 'signed', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status');
  }
  return this.db.query('SELECT * FROM contracts WHERE status = ?', [status]);
}
```

### 8.3.3 敏感数据处理

```typescript
// 敏感字段定义
const SENSITIVE_FIELDS = ['idCard', 'bankAccount', 'phone'];

// 加密存储
async saveCustomer(data: CustomerData): Promise<Customer> {
  const encryptedData = { ...data };
  
  for (const field of SENSITIVE_FIELDS) {
    if (encryptedData[field]) {
      encryptedData[field] = await encrypt(encryptedData[field]);
    }
  }
  
  return this.repo.create(encryptedData);
}

// 脱敏显示
async getCustomer(id: string): Promise<Customer> {
  const customer = await this.repo.findById(id);
  
  return {
    ...customer,
    phone: maskPhone(customer.phone),      // 138****1234
    idCard: maskIdCard(customer.idCard),   // 310***********1234
    bankAccount: maskBankAccount(customer.bankAccount)  // ****1234
  };
}
```

---

## 8.4 性能规范

### 8.4.1 性能指标

| 操作类型 | 响应时间要求 |
|---------|------------|
| 工具调用（查询） | < 3秒 |
| 工具调用（写入） | < 5秒 |
| 页面加载 | < 2秒 |
| 列表渲染 | < 500ms |

### 8.4.2 性能优化建议

```typescript
// ✅ 分页查询
async query(params: QueryParams): Promise<QueryResult> {
  const pageSize = Math.min(params.pageSize || 20, 100); // 限制最大100条
  // ...
}

// ✅ 批量操作
async batchCreate(items: CreateDto[]): Promise<Result[]> {
  // 批量插入，而不是循环单条插入
  return this.db.batchInsert('contracts', items);
}

// ✅ 懒加载
const ContractDetail = lazy(() => import('./ContractDetail'));

// ✅ 缓存热点数据
@Cacheable({ ttl: 300 })  // 缓存5分钟
async getContractStatistics(): Promise<Statistics> {
  // ...
}
```

### 8.4.3 性能监控

```typescript
// 工具调用性能监控
export default defineTool({
  name: 'sales_query',
  
  async handler(params, context) {
    const startTime = Date.now();
    
    try {
      const result = await this.doQuery(params);
      
      // 记录性能指标
      context.metrics.record({
        tool: 'sales_query',
        duration: Date.now() - startTime,
        success: true
      });
      
      return result;
    } catch (error) {
      context.metrics.record({
        tool: 'sales_query',
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      });
      
      throw error;
    }
  }
});
```

---

## 8.5 质量检查清单

### 8.5.1 发布前检查

```
┌─────────────────────────────────────────────────────────────┐
│                    发布前质量检查                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📋 代码质量                                                │
│  ├── [ ] ESLint 无错误                                      │
│  ├── [ ] TypeScript 无类型错误                              │
│  ├── [ ] 无 console.log 残留                                │
│  └── [ ] 代码已格式化                                       │
│                                                             │
│  🧪 测试                                                    │
│  ├── [ ] 单元测试通过                                       │
│  ├── [ ] 集成测试通过                                       │
│  ├── [ ] 覆盖率 ≥ 80%                                       │
│  └── [ ] 边界条件已测试                                     │
│                                                             │
│  🔒 安全                                                    │
│  ├── [ ] 无SQL注入风险                                      │
│  ├── [ ] 无XSS风险                                         │
│  ├── [ ] 敏感数据已加密                                     │
│  └── [ ] 权限检查完整                                       │
│                                                             │
│  📄 文档                                                    │
│  ├── [ ] README 完整                                        │
│  ├── [ ] 工具描述清晰                                       │
│  ├── [ ] API文档更新                                        │
│  └── [ ] 变更日志更新                                       │
│                                                             │
│  ⚡ 性能                                                    │
│  ├── [ ] 工具响应时间 < 3秒                                 │
│  ├── [ ] 无内存泄漏                                        │
│  └── [ ] 大数据量测试通过                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.5.2 自动化检查

```bash
# 运行所有质量检查
npm run quality:check

# 包含：
# - ESLint
# - TypeScript类型检查
# - 单元测试
# - 覆盖率检查
# - 依赖安全扫描
# - 代码复杂度检查
```

---

## 下一步

- [第9章：示例插件](./09-examples.md)
- [第10章：附录](./10-appendix.md)
