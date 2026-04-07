# Design: Warehouse仓储部门模块

## 数据模型

```typescript
interface Inventory {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

interface InboundOrder {
  id: string;
  number: string;
  type: 'purchase' | 'return';
  items: InboundItem[];
  status: 'draft' | 'submitted' | 'approved' | 'completed';
}

interface OutboundOrder {
  id: string;
  number: string;
  type: 'sale' | 'transfer';
  salesOrderId?: string;
  items: OutboundItem[];
  status: 'draft' | 'submitted' | 'approved' | 'shipped';
}
```

## API 设计

```typescript
POST   /api/warehouse/inbound              // 创建入库单
GET    /api/warehouse/inventory           // 库存查询
POST   /api/warehouse/outbound            // 创建出库单
GET    /api/warehouse/warnings           // 库存预警
```
