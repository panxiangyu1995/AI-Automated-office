# Design: Story 14.5 物流信息追踪

## 数据模型

```typescript
interface LogisticsRecord {
  id: string
  tracking_no: string       // 物流单号
  carrier: string         // 物流公司
  outbound_id: string    // 出库单ID
  status: LogisticsStatus
  current_location: string
  estimated_arrival?: Date
  events: LogisticsEvent[]
  created_at: Date
  updated_at: Date
}

enum LogisticsStatus {
  pending = 'pending',     // 待揽件
  in_transit = 'in_transit', // 运输中
  delivered = 'delivered',   // 已签收
  exception = 'exception'   // 异常
}

interface LogisticsEvent {
  time: Date
  location: string
  status: string
  description: string
}
```

## API 设计

### 查询物流
```typescript
interface GetLogisticsRequest {
  tracking_no: string
}

interface GetLogisticsResponse {
  tracking_no: string
  carrier: string
  status: LogisticsStatus
  current_location: string
  estimated_arrival?: string
  events: LogisticsEvent[]
}
```

## 物流公司对接

```typescript
interface LogisticsProvider {
  name: string
  code: string
  tracking_url: string
  api_integration?: boolean
}

const LOGISTICS_PROVIDERS: LogisticsProvider[] = [
  { name: '顺丰速运', code: 'SF', tracking_url: 'https://www.sf-express.com/...' },
  { name: '中通快递', code: 'ZTO', tracking_url: 'https://www.zto.com/...' },
  // ...
]
```

## 实现步骤

1. 定义物流类型
2. 实现物流查询命令
3. 创建物流追踪页面
4. 对接物流公司API
5. 测试验证
