# Design: Story 14.8 库存流水记录

## 数据模型

```typescript
interface MovementRecord {
  id: string
  type: MovementType
  ref_type: string       // inbound/outbound/stocktaking/adjustment
  ref_id: string        // 对应单据ID
  product_id: string
  product_name: string
  location_id: string
  location_name: string
  quantity: number       // 正数=入库，负数=出库
  before_quantity: number
  after_quantity: number
  remark?: string
  created_by: string
  created_at: Date
}

enum MovementType {
  inbound = 'inbound'       // 入库
  outbound = 'outbound'     // 出库
  stocktaking = 'stocktaking' // 盘点
  adjustment = 'adjustment'  // 调整
}
```

## API 设计

### 查询流水记录
```typescript
interface ListMovementsRequest {
  page?: number
  pageSize?: number
  product_id?: string
  location_id?: string
  type?: MovementType
  start_date?: string
  end_date?: string
}

interface ListMovementsResponse {
  items: MovementRecord[]
  total: number
  summary: {
    total_inbound: number
    total_outbound: number
    net_change: number
  }
}
```

### 导出流水记录
```typescript
interface ExportMovementsRequest {
  format: 'csv' | 'excel'
  start_date: string
  end_date: string
  product_ids?: string[]
  location_ids?: string[]
}
```

## 实现步骤

1. 定义流水类型
2. 实现流水记录命令
3. 实现流水列表查询
4. 创建流水页面
5. 实现导出功能
6. 测试验证
