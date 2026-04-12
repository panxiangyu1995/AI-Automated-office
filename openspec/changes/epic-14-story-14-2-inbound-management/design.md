# Design: Story 14.2 入库操作记录

## 数据模型

### warehouse_inbound (入库单)
```typescript
interface InboundOrder {
  id: string
  inbound_no: string        // 入库单号
  type: 'purchase' | 'return' | 'transfer'  // 采购入库/退货入库/调拨入库
  supplier_id?: string     // 供应商ID
  supplier_name?: string    // 供应商名称
  warehouse_id: string     // 仓库ID
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled'
  total_quantity: number   // 总数量
  total_amount: number      // 总金额
  remark?: string
  created_by: string       // 创建人
  created_at: Date
  updated_at: Date
}
```

### warehouse_inbound_item (入库明细)
```typescript
interface InboundItem {
  id: string
  inbound_id: string       // 入库单ID
  product_id: string       // 商品ID
  location_id: string      // 库位ID
  quantity: number        // 入库数量
  unit_cost: number      // 单价
  amount: number          // 金额 = quantity * unit_cost
  batch_no?: string       // 批次号
  production_date?: Date   // 生产日期
  expiry_date?: Date      // 有效期
  remark?: string
}
```

## API 设计

### 创建入库单
```typescript
interface CreateInboundRequest {
  type: 'purchase' | 'return' | 'transfer'
  supplier_id?: string
  supplier_name?: string
  warehouse_id: string
  items: Array<{
    product_id: string
    location_id: string
    quantity: number
    unit_cost: number
    batch_no?: string
    production_date?: string
    expiry_date?: string
    remark?: string
  }>
  remark?: string
}

interface CreateInboundResponse {
  inbound: InboundOrder
  inventory_updates: InventoryUpdate[]
}
```

### 查询入库记录
```typescript
interface ListInboundRequest {
  page?: number
  pageSize?: number
  status?: string
  type?: string
  start_date?: string
  end_date?: string
}

interface ListInboundResponse {
  items: InboundOrder[]
  total: number
}
```

### 确认入库
```typescript
interface ConfirmInboundRequest {
  inbound_id: string
}

interface ConfirmInboundResponse {
  inbound: InboundOrder
  inventory_updates: Array<{
    product_id: string
    location_id: string
    before_quantity: number
    after_quantity: number
    change: number
  }>
  movement_records: MovementRecord[]
}
```

## AI 驱动入库

### 场景：AI 自然语言入库
```
用户: @AI "入库50台电脑，供应商联想"
AI: 
  1. 识别意图：创建入库单
  2. 提取实体：商品=电脑, 数量=50, 供应商=联想
  3. 检查商品是否存在
  4. 返回入库表单预填
  5. 用户确认后执行入库
```

### AI 触发流程
```
1. AI 解析用户输入
2. 匹配 warehouse_inbound 工具
3. 预填入库表单
4. 用户确认
5. 执行入库
6. 更新库存
7. 记录流水
8. 推送结果
```

## 实现步骤

1. 创建入库单类型定义
2. 实现创建入库单命令
3. 实现入库单列表查询
4. 实现确认入库命令（含库存更新）
5. 创建入库单页面
6. 创建入库表单对话框
7. 集成 AI 入库能力
8. 测试验证
