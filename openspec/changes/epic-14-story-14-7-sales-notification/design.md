# Design: Story 14.7 销售发货通知接收

## 事件总线设计

### 销售→仓库事件

```typescript
interface SalesOrderCreatedEvent {
  event: 'sales:order_created'
  order_id: string
  customer_id: string
  customer_name: string
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    unit_price: number
  }>
  delivery_address?: string
  delivery_date?: Date
  created_at: Date
}

interface SalesOrderCancelledEvent {
  event: 'sales:order_cancelled'
  order_id: string
  reason: string
  created_at: Date
}
```

### 仓库订阅事件

```typescript
eventBus.subscribe('sales:order_created', async (event: SalesOrderCreatedEvent) => {
  // 1. 检查库存
  const stockCheck = await checkInventory(event.items)
  
  if (stockCheck.allAvailable) {
    // 2. 库存充足 → 自动创建出库单草稿
    const outbound = await createOutboundDraft({
      type: 'sale',
      customer_id: event.customer_id,
      customer_name: event.customer_name,
      sales_order_id: event.order_id,
      items: event.items.map(item => ({
        product_id: item.product_id,
        location_id: stockCheck.locations[item.product_id],
        quantity: item.quantity
      }))
    })
    
    // 3. 通知仓储人员
    notifyWarehouseStaff(`新订单待发货: ${event.order_id}`)
  } else {
    // 4. 库存不足 → 返回预警
    notifyWarehouseStaff(`库存不足: ${event.order_id}`, stockCheck.shortages)
  }
})
```

## API 设计

### 待发货订单列表
```typescript
interface ListPendingDeliveriesRequest {
  page?: number
  pageSize?: number
  warehouse_id?: string
}

interface ListPendingDeliveriesResponse {
  items: PendingDelivery[]
  total: number
}

interface PendingDelivery {
  order_id: string
  sales_order_no: string
  customer_name: string
  items: Array<{
    product_name: string
    quantity: number
    outbound_status: 'pending' | 'partial' | 'completed'
  }>
  delivery_date?: string
  created_at: string
}
```

### 创建出库单（从销售订单）
```typescript
interface CreateOutboundFromSalesRequest {
  sales_order_id: string
  warehouse_id: string
  items: Array<{
    product_id: string
    location_id: string
    quantity: number
  }>
}

interface CreateOutboundFromSalesResponse {
  outbound: OutboundOrder
  created_at: Date
}
```

## AI 集成

### AI 主动通知
```
销售订单创建 → 事件触发
    ↓
通知仓储人员:
"📦 新订单待发货
客户: 甲公司
商品: 电脑 x10
[查看订单] [确认出库]"
```

## 实现步骤

1. 实现销售→仓库事件总线
2. 实现仓库事件订阅处理
3. 实现待发货订单列表
4. 实现自动出库单生成
5. 实现仓储人员通知
6. 集成 AI 通知能力
7. 测试验证
