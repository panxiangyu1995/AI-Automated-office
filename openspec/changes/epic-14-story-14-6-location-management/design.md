# Design: Story 14.6 仓储位置管理

## 数据模型

```typescript
interface Location {
  id: string
  code: string            // 库位编码，如 A-01-01
  name: string            // 库位名称
  zone: string           // 区域，如 A区
  aisle: string          // 货架，如 01
  position: string       // 位置，如 01
  capacity: number      // 容量（商品数量上限）
  current_count: number // 当前存放商品数
  status: 'available' | 'full' | 'disabled'
  remark?: string
  created_at: Date
  updated_at: Date
}

interface LocationAssignment {
  id: string
  location_id: string   // 库位ID
  product_id: string    // 商品ID
  assigned_at: Date
  assigned_by: string   // 分配人
}
```

## API 设计

### 查询库位列表
```typescript
interface ListLocationsRequest {
  page?: number
  pageSize?: number
  zone?: string
  status?: string
}

interface ListLocationsResponse {
  items: Location[]
  total: number
  zones: string[]  // 所有区域
}
```

### 创建库位
```typescript
interface CreateLocationRequest {
  code: string
  name: string
  zone: string
  aisle: string
  position: string
  capacity: number
  remark?: string
}
```

### 分配商品到库位
```typescript
interface AssignProductRequest {
  location_id: string
  product_id: string
}

interface AssignProductResponse {
  assignment: LocationAssignment
  location: Location
}
```

## 实现步骤

1. 定义库位类型
2. 实现库位 CRUD 命令
3. 创建库位管理页面
4. 实现商品库位分配
5. 集成 AI 库位建议
6. 测试验证
