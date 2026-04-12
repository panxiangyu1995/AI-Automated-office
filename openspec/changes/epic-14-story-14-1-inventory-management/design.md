# Design: Story 14.1 库存信息管理

## 上下文

仓储部模块是核心部门模块之一，库存信息管理是整个仓储系统的基础。本设计遵循：
- **UX 规范**: L1-L4 层级系统，ActivityBar 左侧导航
- **AI 入口**: 支持 AI 对话查询库存 "查看库存"
- **部门架构**: 插件化设计，独立模块

## 用户交互流程

```
用户进入仓库模块
    ↓
ActivityBar 点击"仓储" → Sidebar 显示仓储菜单
    ↓
点击"库存查询" → Workbench 显示库存列表
    ↓
可搜索/筛选 → 点击商品 → BottomPanel 显示详情
```

## 数据模型

### warehouse_product (商品表)
```typescript
interface Product {
  id: string
  name: string              // 商品名称
  sku: string              // SKU编码
  category: string         // 商品分类
  unit: string             // 单位（台/件/箱）
  unit_cost: number        // 单位成本
  min_stock: number        // 最小库存
  max_stock: number        // 最大库存
  created_at: Date
  updated_at: Date
}
```

### warehouse_inventory (库存表)
```typescript
interface Inventory {
  id: string
  product_id: string       // 商品ID
  location_id: string      // 库位ID
  quantity: number         // 当前库存
  available_quantity: number // 可用库存
  reserved_quantity: number // 预留库存
  updated_at: Date
}
```

### warehouse_location (库位表)
```typescript
interface Location {
  id: string
  code: string             // 库位编码
  name: string             // 库位名称
  zone: string             // 区域
  capacity: number        // 容量
  created_at: Date
}
```

## API 设计

### 查询库存列表
```typescript
interface ListInventoryRequest {
  page?: number
  pageSize?: number
  keyword?: string         // 搜索：商品名称/SKU
  category?: string        // 筛选：商品分类
  location_id?: string     // 筛选：库位
  stock_status?: 'all' | 'low' | 'normal' | 'excess'
}

interface ListInventoryResponse {
  items: InventoryItem[]
  total: number
  page: number
  pageSize: number
}

interface InventoryItem {
  id: string
  product: Product
  location: Location
  quantity: number
  available_quantity: number
  reserved_quantity: number
  stock_status: 'low' | 'normal' | 'excess'
}
```

### 库存盘点
```typescript
interface StocktakingRequest {
  product_id: string
  location_id: string
  actual_quantity: number
  remark?: string
}

interface StocktakingResponse {
  id: string
  product_id: string
  location_id: string
  before_quantity: number
  after_quantity: number
  adjustment: number
  created_at: Date
}
```

## 前端组件

### 页面结构
```
InventoryPage
├── InventoryToolbar (搜索、筛选、新增按钮)
├── InventoryTable (列表)
│   ├── columns: 商品名称, SKU, 分类, 库位, 库存, 可用, 预留, 状态
│   └── 支持排序、分页
├── InventoryDetail (BottomPanel - L4层级)
│   ├── 基本信息
│   ├── 库存记录
│   └── 操作历史
└── StocktakingDialog (盘点弹窗)
```

### AI 集成
```typescript
// 插件能力注册
{
  pluginId: 'warehouse',
  keywords: ['库存', '商品', '盘点', '仓库'],
  actions: [
    { name: '库存查询', commandId: 'warehouse.inventory' },
    { name: '库存盘点', commandId: 'warehouse.stocktaking' }
  ]
}
```

## 实现步骤

1. 创建 `src/features/warehouse/` 目录结构
2. 定义 TypeScript 类型 (`types/inventory.ts`)
3. 实现 Tauri 命令 (`src-tauri/src/commands/warehouse.rs`)
4. 创建库存列表页面 (`pages/InventoryListPage.tsx`)
5. 创建库存详情面板 (`components/InventoryDetail.tsx`)
6. 实现搜索和筛选功能
7. 实现库存盘点功能
8. 注册 Command Palette 命令
9. 注册 AI 插件能力
10. 集成 Sidebar 动态入口
