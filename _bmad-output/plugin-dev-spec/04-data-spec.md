# 第4章：数据层规范 (Data Specification)

> 数据层负责插件的数据模型定义、数据库迁移、数据访问和同步。

---

## 4.1 目录结构

```
data/
├── models/                 # 数据模型定义
│   ├── contract.ts
│   ├── order.ts
│   └── customer.ts
├── migrations/             # 数据库迁移脚本
│   ├── 001_init.sql
│   ├── 002_add_contract_status.sql
│   └── 003_add_order_tracking.sql
├── repositories/           # 数据访问层
│   ├── contract.repo.ts
│   ├── order.repo.ts
│   └── base.repo.ts
└── sync/                   # 数据同步配置
    └── index.ts
```

---

## 4.2 数据模型定义

### 4.2.1 模型接口规范

```typescript
// models/contract.ts
import { Entity, Column, Index, Relation } from '@office/data-orm';

@Entity({
  name: 'contracts',
  plugin: 'sales',
  description: '销售合同'
})
export class Contract {
  @Column({ type: 'string', primary: true, autoGenerate: true })
  id: string;

  @Column({ type: 'string', required: true })
  contractNo: string;

  @Column({ type: 'string', required: true })
  title: string;

  @Column({ type: 'string' })
  customerId: string;

  @Index()
  @Column({ type: 'string' })
  salesId: string;          // 销售人员ID

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ 
    type: 'enum', 
    enum: ['draft', 'pending', 'signed', 'executing', 'completed', 'cancelled'],
    default: 'draft'
  })
  status: string;

  @Column({ type: 'datetime' })
  signedAt: Date;

  @Column({ type: 'datetime' })
  startDate: Date;

  @Column({ type: 'datetime' })
  endDate: Date;

  @Column({ type: 'json' })
  terms: Record<string, any>;

  @Column({ type: 'string' })
  attachments: string;      // JSON array of attachment IDs

  @Column({ type: 'string' })
  companyId: string;

  @Column({ type: 'datetime', autoCreate: true })
  createdAt: Date;

  @Column({ type: 'datetime', autoUpdate: true })
  updatedAt: Date;

  @Column({ type: 'string' })
  createdBy: string;

  @Column({ type: 'string' })
  updatedBy: string;
}
```

### 4.2.2 字段类型

| 类型 | 说明 | SQL类型 | TypeScript类型 |
|------|------|---------|----------------|
| `string` | 字符串 | VARCHAR(255) | string |
| `text` | 长文本 | TEXT | string |
| `int` | 整数 | INTEGER | number |
| `decimal` | 精确小数 | DECIMAL(p,s) | number |
| `float` | 浮点数 | FLOAT | number |
| `boolean` | 布尔值 | BOOLEAN | boolean |
| `datetime` | 日期时间 | DATETIME | Date |
| `date` | 日期 | DATE | Date |
| `json` | JSON对象 | TEXT | object |
| `enum` | 枚举 | VARCHAR(50) | string |
| `uuid` | UUID | VARCHAR(36) | string |

### 4.2.3 字段装饰器

```typescript
// 主键
@Column({ type: 'string', primary: true })

// 自动生成
@Column({ type: 'string', primary: true, autoGenerate: true })

// 索引
@Index()
@Column({ type: 'string' })

// 唯一约束
@Index({ unique: true })
@Column({ type: 'string' })

// 必填
@Column({ type: 'string', required: true })

// 默认值
@Column({ type: 'string', default: 'draft' })

// 外键
@Relation({ target: 'customers', foreignKey: 'customerId' })
@Column({ type: 'string' })
```

### 4.2.4 命名规范

| 项目 | 规范 | 示例 |
|------|------|------|
| 表名 | snake_case，复数 | `contracts`, `order_items` |
| 字段名 | snake_case | `contract_no`, `signed_at` |
| 模型类 | PascalCase，单数 | `Contract`, `OrderItem` |
| 主键 | `id` | `id` |
| 外键 | `{entity}_id` | `customer_id`, `sales_id` |
| 时间戳 | `xxx_at` | `created_at`, `signed_at` |

---

## 4.3 数据库迁移

### 4.3.1 迁移文件命名

```
{序号}_{描述}.sql

示例：
001_init.sql
002_add_contract_status.sql
003_add_order_tracking.sql
```

### 4.3.2 迁移文件格式

```sql
-- migrations/001_init.sql
-- @description: 初始化销售模块数据表
-- @version: 1.0.0
-- @author: AI-Automated-office Team

-- 创建合同表
CREATE TABLE IF NOT EXISTS contracts (
  id VARCHAR(36) PRIMARY KEY,
  contract_no VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  customer_id VARCHAR(36),
  sales_id VARCHAR(36),
  amount DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'draft',
  signed_at DATETIME,
  start_date DATE,
  end_date DATE,
  terms TEXT,
  attachments TEXT,
  company_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(36),
  updated_by VARCHAR(36)
);

-- 创建索引
CREATE INDEX idx_contracts_sales_id ON contracts(sales_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_company_id ON contracts(company_id);

-- 创建订单表
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(50) NOT NULL,
  contract_id VARCHAR(36),
  customer_id VARCHAR(36),
  sales_id VARCHAR(36),
  total_amount DECIMAL(12, 2),
  status VARCHAR(20) DEFAULT 'pending',
  company_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contract_id) REFERENCES contracts(id)
);

-- 回滚脚本
-- @rollback
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS contracts;
```

### 4.3.3 迁移执行

```typescript
// 手动执行迁移
office plugin migrate sales

// 自动迁移（在plugin.json中配置）
{
  "dataAccess": {
    "storage": {
      "migration": "auto"  // 或 "manual"
    }
  }
}
```

---

## 4.4 数据访问层 (Repository)

### 4.4.1 基础Repository

```typescript
// data/repositories/base.repo.ts
import { Database } from '@office/database';

export abstract class BaseRepository<T> {
  protected db: Database;
  protected tableName: string;
  
  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }
  
  async findById(id: string): Promise<T | null> {
    const result = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE id = ?`,
      [id]
    );
    return result[0] || null;
  }
  
  async findMany(params: {
    filters?: Record<string, any>;
    page?: number;
    pageSize?: number;
    orderBy?: { field: string; direction: 'asc' | 'desc' };
  }): Promise<{ items: T[]; total: number }> {
    const { filters = {}, page = 1, pageSize = 20, orderBy } = params;
    
    // 构建WHERE子句
    const whereClause = this.buildWhereClause(filters);
    
    // 查询总数
    const countResult = await this.db.query(
      `SELECT COUNT(*) as total FROM ${this.tableName} ${whereClause.sql}`,
      whereClause.params
    );
    const total = countResult[0].total;
    
    // 查询数据
    const offset = (page - 1) * pageSize;
    const orderClause = orderBy 
      ? `ORDER BY ${orderBy.field} ${orderBy.direction}` 
      : '';
    
    const items = await this.db.query(
      `SELECT * FROM ${this.tableName} ${whereClause.sql} ${orderClause} LIMIT ? OFFSET ?`,
      [...whereClause.params, pageSize, offset]
    );
    
    return { items, total };
  }
  
  async create(data: Partial<T>): Promise<T> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await this.db.execute(
      `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    return this.findById(result.insertId);
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    
    await this.db.execute(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    return this.findById(id);
  }
  
  async delete(id: string | string[]): Promise<{ affected: number }> {
    const ids = Array.isArray(id) ? id : [id];
    const placeholders = ids.map(() => '?').join(', ');
    
    const result = await this.db.execute(
      `DELETE FROM ${this.tableName} WHERE id IN (${placeholders})`,
      ids
    );
    
    return { affected: result.affectedRows };
  }
  
  protected buildWhereClause(filters: Record<string, any>): { sql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue;
      
      if (key === 'dateRange') {
        conditions.push('created_at BETWEEN ? AND ?');
        params.push(value.start, value.end);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`${key} IN (${placeholders})`);
        params.push(...value);
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    return {
      sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }
}
```

### 4.4.2 具体Repository

```typescript
// data/repositories/contract.repo.ts
import { BaseRepository } from './base.repo';
import { Contract } from '../models/contract';

export class ContractRepository extends BaseRepository<Contract> {
  constructor(db: Database) {
    super(db, 'contracts');
  }
  
  async query(params: UniversalQueryParams): Promise<{ items: Contract[]; total: number }> {
    return this.findMany({
      filters: params.filters,
      page: params.page,
      pageSize: params.pageSize,
      orderBy: params.orderBy
    });
  }
  
  async aggregate(params: AggregateParams): Promise<AggregateResult> {
    const { filters, aggregations, groupBy } = params;
    const whereClause = this.buildWhereClause(filters || {});
    
    // 构建聚合字段
    const selectFields = aggregations.map(a => {
      const alias = a.alias || `${a.metric}_${a.field}`;
      return `${a.metric.toUpperCase()}(${a.field}) as ${alias}`;
    });
    
    // 构建分组
    const groupClause = groupBy 
      ? `GROUP BY ${Array.isArray(groupBy) ? groupBy.join(', ') : groupBy}` 
      : '';
    
    // 查询聚合结果
    const totalResult = await this.db.query(
      `SELECT ${selectFields.join(', ')} FROM ${this.tableName} ${whereClause.sql}`,
      whereClause.params
    );
    
    // 查询分组结果
    let groups = null;
    if (groupBy) {
      groups = await this.db.query(
        `SELECT ${Array.isArray(groupBy) ? groupBy.join(', ') : groupBy} as key, ${selectFields.join(', ')} FROM ${this.tableName} ${whereClause.sql} ${groupClause}`,
        whereClause.params
      );
    }
    
    return {
      total: totalResult[0],
      groups
    };
  }
  
  async findByCustomer(customerId: string): Promise<Contract[]> {
    const result = await this.db.query(
      `SELECT * FROM contracts WHERE customer_id = ? ORDER BY created_at DESC`,
      [customerId]
    );
    return result;
  }
  
  async findBySales(salesId: string): Promise<Contract[]> {
    const result = await this.db.query(
      `SELECT * FROM contracts WHERE sales_id = ? ORDER BY created_at DESC`,
      [salesId]
    );
    return result;
  }
  
  async getStatistics(salesId?: string): Promise<{
    totalCount: number;
    totalAmount: number;
    byStatus: Record<string, number>;
  }> {
    const whereClause = salesId ? 'WHERE sales_id = ?' : '';
    const params = salesId ? [salesId] : [];
    
    const total = await this.db.query(
      `SELECT COUNT(*) as count, SUM(amount) as amount FROM contracts ${whereClause}`,
      params
    );
    
    const byStatus = await this.db.query(
      `SELECT status, COUNT(*) as count FROM contracts ${whereClause} GROUP BY status`,
      params
    );
    
    return {
      totalCount: total[0].count,
      totalAmount: total[0].amount || 0,
      byStatus: Object.fromEntries(byStatus.map(r => [r.status, r.count]))
    };
  }
}
```

---

## 4.5 数据同步

### 4.5.1 同步配置

```typescript
// data/sync/index.ts
import { SyncConfig } from '@office/sync';

export const syncConfig: SyncConfig = {
  // 需要同步的表
  tables: [
    {
      name: 'contracts',
      syncMode: 'incremental',  // full | incremental
      syncFields: ['updated_at'],
      conflictResolution: 'server-wins'  // server-wins | client-wins | merge
    },
    {
      name: 'orders',
      syncMode: 'incremental',
      syncFields: ['updated_at'],
      conflictResolution: 'server-wins'
    },
    {
      name: 'customers',
      syncMode: 'incremental',
      syncFields: ['updated_at'],
      conflictResolution: 'merge'
    }
  ],
  
  // 同步频率
  interval: 5 * 60 * 1000,  // 5分钟
  
  // 离线队列
  offlineQueue: {
    enabled: true,
    maxSize: 1000,
    retryAttempts: 3
  }
};
```

### 4.5.2 本地优先策略

```typescript
// 写入时
async create(data: Partial<T>): Promise<T> {
  // 1. 先写入本地数据库
  const localResult = await this.db.insert(this.tableName, data);
  
  // 2. 如果在线，立即同步
  if (this.syncService.isOnline()) {
    try {
      await this.syncService.push(localResult);
    } catch (e) {
      // 同步失败，加入离线队列
      await this.syncService.queue('create', this.tableName, localResult);
    }
  } else {
    // 离线时，加入队列等待同步
    await this.syncService.queue('create', this.tableName, localResult);
  }
  
  return localResult;
}

// 读取时
async findById(id: string): Promise<T | null> {
  // 1. 先从本地读取
  const localResult = await this.db.query(
    `SELECT * FROM ${this.tableName} WHERE id = ?`,
    [id]
  );
  
  // 2. 如果在线，检查是否有更新
  if (this.syncService.isOnline()) {
    const serverVersion = await this.syncService.checkVersion(this.tableName, id);
    if (serverVersion > localResult.version) {
      // 拉取最新数据
      const freshData = await this.syncService.pull(this.tableName, id);
      await this.db.update(this.tableName, freshData);
      return freshData;
    }
  }
  
  return localResult;
}
```

---

## 4.6 多租户数据隔离

### 4.6.1 隔离策略

采用**数据库级隔离**：

```typescript
// 每个租户的数据自动添加 company_id 条件
async findMany(params: QueryParams): Promise<QueryResult> {
  const companyId = this.context.companyId;
  
  // 自动添加租户过滤
  params.filters = {
    ...params.filters,
    company_id: companyId
  };
  
  return super.findMany(params);
}
```

### 4.6.2 数据访问控制

```typescript
// 在Repository层面强制检查
async findById(id: string): Promise<T | null> {
  const result = await this.db.query(
    `SELECT * FROM ${this.tableName} WHERE id = ? AND company_id = ?`,
    [id, this.context.companyId]
  );
  
  if (!result[0]) {
    throw new Error('数据不存在或无权访问');
  }
  
  return result[0];
}
```

---

## 4.7 审计日志

### 4.7.1 自动审计

```typescript
// 在Repository中自动记录审计日志
async create(data: Partial<T>): Promise<T> {
  const result = await super.create(data);
  
  await this.auditLog({
    action: 'create',
    entity: this.tableName,
    entityId: result.id,
    newData: result,
    userId: this.context.userId
  });
  
  return result;
}

async update(id: string, data: Partial<T>): Promise<T> {
  const oldData = await this.findById(id);
  const result = await super.update(id, data);
  
  await this.auditLog({
    action: 'update',
    entity: this.tableName,
    entityId: id,
    oldData,
    newData: result,
    userId: this.context.userId
  });
  
  return result;
}

async delete(id: string): Promise<void> {
  const oldData = await this.findById(id);
  
  await this.auditLog({
    action: 'delete',
    entity: this.tableName,
    entityId: id,
    oldData,
    userId: this.context.userId
  });
  
  await super.delete(id);
}
```

---

## 下一步

- [第5章：业务层规范](./05-business-spec.md)
- [第6章：权限层规范](./06-permission-spec.md)
