# Design: Story 14.3 出库操作记录

## 数据模型

### warehouse_outbound (出库单)
```typescript
interface OutboundOrder {
  id: string
  outbound_no: string       // 出库单号
  type: 'sale' | 'return' | 'transfer' | 'damage'  // 销售出库/退货出库/调拨出库/损耗
  customer_id?: string      // 客户ID
  customer_name?: string    // 客户名称
  sales_order_id?: string  // 销售订单ID（可选）
  warehouse_id: string     // 仓库ID
  status: 'draft' | 'pending' | 'confirmed' | 'cancelled'
  total_quantity: number   // 总数量
  total_amount: number    // 总金额
  remark?: string
  created_by: string     // 创建人
  created_at: Date
  updated_at: Date
}
```

### warehouse_outbound_item (出库明细)
```typescript
interface OutboundItem {
  id: string
  outbound_id: string      // 出库单ID
  product_id: string      // 商品ID
  location_id: string     // 库位ID
  quantity: number       // 出库数量
  unit_price: number     // 单价
  amount: number         // 金额
  batch_no?: string      // 批次号
  remark?: string
}
```

### warehouse_sales_outbound (销售出库关联)
```typescript
interface SalesOutboundLink {
  id: string
  sales_order_id: string  // 销售订单ID
  outbound_id: string     // 出库单ID
  linked_items: Array<{   // 关联的出库明细
    sales_item_id: string
    outbound_item_id: string
    linked_quantity: number
  }>
  created_at: Date
}
```

## API 设计

### 创建出库单
```typescript
interface CreateOutboundRequest {
  type: 'sale' | 'return' | 'transfer' | 'damage'
  customer_id?: string
  customer_name?: string
  sales_order_id?: string   // 关联销售订单
  warehouse_id: string
  items: Array<{
    product_id: string
    location_id: string
    quantity: number
    unit_price?: number
    batch_no?: string
    remark?: string
  }>
  remark?: string
}
```

### 出库前库存检查
```typescript
interface CheckInventoryRequest {
  items: Array<{
    product_id: string
    location_id: string
    quantity: number
  }>
}

interface CheckInventoryResponse {
  available: boolean
  checks: Array<{
    product_id: string
    location_id: string
    requested: number
    available: number
    sufficient: boolean
  }>
  suggestions?: Array<{
    product_id: string
    from_other_locations: Array<{
      location_id: string
      available: number
    }>
  }>
}
```

### 确认出库
```typescript
interface ConfirmOutboundRequest {
  outbound_id: string
}

interface ConfirmOutboundResponse {
  outbound: OutboundOrder
  inventory_updates: Array<{
    product_id: string
    location_id: string
    before_quantity: number
    after_quantity: number
    change: number
  }>
  movement_records: MovementRecord[]
  sales_update?: {
    order_id: string
    shipped_quantity: number
    remaining_quantity: number
    order_status: string
  }
}
```

## 销售-仓储联动

### 场景1: 销售下单触发出库
```
销售模块创建订单 → 事件: sales_order_created
仓库模块订阅事件 → 检查库存
  ├── 库存充足 → 创建出库单 → 确认出库 → 库存扣减
  └── 库存不足 → 返回预警 → 等待补货或部分出库
```

### 场景2: 出库完成通知销售
```
确认出库 → 事件: outbound_confirmed
销售模块订阅事件 → 更新订单状态
  └── 已全部发货 → 订单状态变更为"已发货"
```

### 场景3: 财务记账触发
```
确认出库（销售类型） → 事件: outbound_confirmed
财务模块订阅事件 → 生成应收款
  └── 生成收款单 → 等待客户付款
```

## AI 驱动出库

### 自然语言出库
```
用户: @AI "给客户甲出库10台电脑"
AI:
  1. 识别意图：创建出库单
  2. 提取实体：商品=电脑, 数量=10, 客户=甲
  3. 检查库存
  4. 返回出库表单
```

### 库存不足智能提示
```
用户: @AI "出库50台电脑"
AI:
  检查库存: 15台
  提示: "库存不足50台，仅有15台"
  选项:
    [部分出库15台]
    [生成采购申请]
    [等待到货后再出库]
```

## 实现步骤

1. 创建出库单类型定义
2. 实现创建出库单命令（含库存检查）
3. 实现出库单列表查询
4. 实现确认出库命令
5. 实现销售出库关联逻辑
6. 创建出库单页面
7. 创建出库表单对话框
8. 集成事件总线（销售/财务联动）
9. 集成 AI 出库能力
10. 测试验证
