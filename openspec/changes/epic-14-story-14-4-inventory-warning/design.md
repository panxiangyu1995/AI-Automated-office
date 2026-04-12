# Design: Story 14.4 库存预警

## 预警规则

### 预警类型
1. **库存不足预警**: `available_quantity < min_stock`
2. **库存过剩预警**: `available_quantity > max_stock`
3. **临期预警**: `expiry_date` 在30天内

### 预警等级
```typescript
enum WarningLevel {
  info = 'info',      // 过剩预警
  warning = 'warning', // 轻微不足
  critical = 'critical' // 严重不足
}

interface InventoryWarning {
  id: string
  product_id: string
  product_name: string
  location_id: string
  location_name: string
  current_quantity: number
  min_stock: number
  max_stock: number
  shortage: number  // 缺口 = min_stock - available_quantity
  level: WarningLevel
  type: 'low' | 'high' | 'expiring'
  created_at: Date
}
```

## API 设计

### 查询预警列表
```typescript
interface ListWarningsRequest {
  page?: number
  pageSize?: number
  level?: WarningLevel
  type?: 'low' | 'high' | 'expiring'
}

interface ListWarningsResponse {
  items: InventoryWarning[]
  total: number
  summary: {
    low_count: number
    high_count: number
    expiring_count: number
  }
}
```

### 获取预警统计
```typescript
interface GetWarningSummaryResponse {
  total_warnings: number
  critical_count: number
  warning_count: number
  info_count: number
  most_urgent: InventoryWarning[]
}
```

### 补货建议
```typescript
interface ReplenishmentSuggestion {
  product_id: string
  product_name: string
  current_quantity: number
  min_stock: number
  recommended_quantity: number  // 建议补充到 max_stock
  estimated_cost: number
}
```

## AI 预警集成

### 主动预警推送
```
系统检测到库存不足
    ↓
推送预警卡片给用户
    ↓
AI 分析:
  "检测到3种商品库存不足：
   - 电脑：库存5台，安全库存10台，建议补充10台
   - 鼠标：库存0个，安全库存50个，建议补充50个
   - 键盘：库存2个，安全库存20个，建议补充20个"
```

### AI 补货建议
```
用户: @AI "哪些商品需要补货？"
AI: 返回补货建议列表
    ↓
用户点击"生成采购申请"
    ↓
自动创建采购申请草稿
```

## 实现步骤

1. 定义预警类型
2. 实现预警检测命令
3. 实现预警列表查询
4. 创建预警通知组件
5. 实现预警推送
6. 集成 AI 预警能力
7. 测试验证
