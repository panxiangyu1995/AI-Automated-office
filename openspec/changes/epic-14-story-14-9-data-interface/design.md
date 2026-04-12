# Design: Story 14.9 仓储数据接口

## 接口设计

### 库存查询接口
```typescript
interface WarehouseApi {
  // 查询库存
  getInventory(productId: string): Promise<Inventory>
  
  // 查询库存列表
  listInventory(params: ListInventoryParams): Promise<ListInventoryResponse>
  
  // 获取库存统计
  getInventoryStats(): Promise<InventoryStats>
  
  // 检查库存可用性
  checkAvailability(items: CheckItem[]): Promise<CheckResult>
}
```

### 权限控制
```typescript
interface WarehousePermissions {
  // 基础权限（所有部门）
  canViewInventory: boolean
  
  // 仓储部权限
  canViewInboud: boolean
  canViewOutbound: boolean
  
  // 管理层权限
  canViewStats: boolean
  canExport: boolean
}
```

## API 路由

```
GET  /api/warehouse/inventory           - 库存列表（权限：所有人）
GET  /api/warehouse/inventory/:id       - 库存详情（权限：所有人）
GET  /api/warehouse/stats             - 库存统计（权限：管理层）
POST /api/warehouse/check             - 库存检查（权限：所有人）
GET  /api/warehouse/inbound           - 入库记录（权限：仓储部）
GET  /api/warehouse/outbound          - 出库记录（权限：仓储部）
```

## 实现步骤

1. 定义 API 接口
2. 实现权限控制
3. 实现库存查询接口
4. 实现库存统计接口
5. 测试验证
