# Specifications: After-sales 售后服务模块基础架构

## after-sales-ticket

### Description

售后工单管理基础能力，支持工单创建、查询、状态流转。

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR220 | 用户可以创建和管理售后工单 | MUST | 创建工单后可在列表中看到，编辑后数据正确更新 |
| FR221 | 用户可以分配工单给处理人 | MUST | 分配后工单assigned_to字段正确更新 |
| FR222 | 处理人可以更新工单状态和处理记录 | MUST | 状态更新遵循状态机规则 |
| FR226 | 售后服务部权限 = 人事权限 + 售后权限 + 审批发起权限 | MUST | 权限控制生效 |

### Schema

```typescript
// 工单主体
interface ServiceTicket {
  id: string;                    // UUID
  title: string;                 // 工单标题
  description: string;            // 工单描述
  
  // 类型和状态
  type: TicketType;              // 工单类型
  status: TicketStatus;          // 当前状态
  priority: Priority;             // 优先级
  
  // 客户信息
  customer_id?: string;           // 客户ID（可选）
  customer_name: string;         // 客户姓名
  customer_contact?: string;     // 联系方式
  customer_email?: string;       // 邮箱
  
  // 分配信息
  assigned_to?: string;          // 处理人ID
  assigned_name?: string;        // 处理人姓名
  
  // 关联
  knowledge_id?: string;         // 关联知识库ID
  
  // 时间戳
  created_at: number;            // 创建时间戳
  updated_at: number;            // 更新时间戳
  completed_at?: number;         // 完成时间戳
  
  // 租户
  tenant_id: string;
  
  // 扩展
  metadata: Record<string, any>; // 扩展字段
}

// 工单类型枚举
type TicketType = 'repair' | 'consultation' | 'complaint';

// 工单类型元数据
const TicketTypeMeta: Record<TicketType, { label: string; icon: string; color: string }> = {
  repair: { label: '维修', icon: 'Wrench', color: 'blue' },
  consultation: { label: '咨询', icon: 'HelpCircle', color: 'green' },
  complaint: { label: '投诉', icon: 'AlertTriangle', color: 'red' },
};

// 工单状态枚举
type TicketStatus = 'new' | 'processing' | 'pending_confirm' | 'completed' | 'cancelled';

// 工单状态元数据
const TicketStatusMeta: Record<TicketStatus, { label: string; color: string; bgColor: string }> = {
  new: { label: '新建', color: 'gray', bgColor: 'bg-gray-100' },
  processing: { label: '处理中', color: 'blue', bgColor: 'bg-blue-100' },
  pending_confirm: { label: '待确认', color: 'yellow', bgColor: 'bg-yellow-100' },
  completed: { label: '已完成', color: 'green', bgColor: 'bg-green-100' },
  cancelled: { label: '已取消', color: 'red', bgColor: 'bg-red-100' },
};

// 优先级枚举
type Priority = 'low' | 'medium' | 'high' | 'urgent';

// 优先级元数据
const PriorityMeta: Record<Priority, { label: string; color: string; sort: number }> = {
  low: { label: '低', color: 'gray', sort: 1 },
  medium: { label: '中', color: 'blue', sort: 2 },
  high: { label: '高', color: 'orange', sort: 3 },
  urgent: { label: '紧急', color: 'red', sort: 4 },
};
```

### API

#### 创建工单

```
POST /api/service/tickets
```

**Request Body:**

```json
{
  "title": "产品无法开机",
  "description": "客户反映购买的设备无法正常启动",
  "type": "repair",
  "priority": "high",
  "customer_name": "张三",
  "customer_contact": "13800138000",
  "customer_email": "zhangsan@example.com"
}
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "产品无法开机",
  "description": "客户反映购买的设备无法正常启动",
  "type": "repair",
  "status": "new",
  "priority": "high",
  "customer_name": "张三",
  "customer_contact": "13800138000",
  "customer_email": "zhangsan@example.com",
  "created_at": 1713000000,
  "updated_at": 1713000000,
  "tenant_id": "tenant-001"
}
```

#### 查询工单列表

```
GET /api/service/tickets
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string[] | 否 | 状态筛选，多个用逗号分隔 |
| type | string[] | 否 | 类型筛选 |
| priority | string[] | 否 | 优先级筛选 |
| assigned_to | string | 否 | 处理人ID |
| search | string | 否 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| page_size | number | 否 | 每页数量，默认20 |
| sort_by | string | 否 | 排序字段 |
| sort_order | string | 否 | 排序方向 asc/desc |

**Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "产品无法开机",
      "type": "repair",
      "status": "new",
      "priority": "high",
      "customer_name": "张三",
      "assigned_name": null,
      "created_at": 1713000000
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### 更新工单状态

```
PUT /api/service/tickets/:id/status
```

**Request Body:**

```json
{
  "status": "processing"
}
```

**Response (200):** 返回更新后的工单对象

**Error Response (400):**

```json
{
  "error": {
    "code": "SERVICE_002",
    "message": "状态转换无效：new -> completed"
  }
}
```

## after-sales-personnel

### Description

服务人员管理，支持服务人员列表和处理能力配置。

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR221 | 用户可以分配工单给处理人 | MUST | 分配时显示可用服务人员列表 |

### Schema

```typescript
interface ServicePersonnel {
  id: string;                          // UUID
  user_id: string;                     // 用户ID
  user_name: string;                   // 用户姓名
  department?: string;                 // 部门
  specializations: string[];           // 专长领域
  
  // 状态
  status: 'available' | 'busy' | 'offline';
  
  // 负载
  current_ticket_count: number;        // 当前工单数
  max_ticket_count: number;            // 最大工单数
  
  // 时间戳
  created_at: number;
  updated_at: number;
  
  // 租户
  tenant_id: string;
}

// 状态元数据
const PersonnelStatusMeta: Record<string, { label: string; color: string }> = {
  available: { label: '空闲', color: 'green' },
  busy: { label: '忙碌', color: 'orange' },
  offline: { label: '离线', color: 'gray' },
};
```

### API

#### 获取服务人员列表

```
GET /api/service/personnel
```

**Query Parameters:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 状态筛选 |
| specialization | string | 否 | 专长筛选 |
| available_only | boolean | 否 | 只显示可用的 |

**Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "user-001",
      "user_name": "李四",
      "department": "售后部",
      "specializations": ["家电维修", "数码产品"],
      "status": "available",
      "current_ticket_count": 3,
      "max_ticket_count": 10
    }
  ],
  "total": 1
}
```

#### 分配工单

```
PUT /api/service/tickets/:id/assign
```

**Request Body:**

```json
{
  "assigned_to": "user-001"
}
```

**Response (200):** 返回更新后的工单对象

## after-sales-base-ui

### Description

售后模块前端UI组件和页面。

### Components

#### TicketList

工单列表组件，支持筛选和搜索。

```typescript
interface TicketListProps {
  filters?: TicketFilters;
  onTicketClick?: (ticket: ServiceTicket) => void;
  onTicketCreate?: () => void;
  viewMode?: 'table' | 'kanban' | 'card';
}
```

**Features:**
- 多列筛选（状态、类型、优先级）
- 关键词搜索
- 排序（时间、优先级）
- 分页
- 视图切换（表格/Kanban/卡片）
- 批量操作

#### TicketDetail

工单详情面板。

```typescript
interface TicketDetailProps {
  ticketId: string;
  onClose?: () => void;
  onStatusChange?: (status: TicketStatus) => void;
}
```

**Features:**
- 显示工单完整信息
- 状态变更操作
- 分配处理人
- 查看时间线

#### TicketForm

工单创建/编辑表单。

```typescript
interface TicketFormProps {
  initialValues?: Partial<ServiceTicket>;
  onSubmit: (values: CreateTicketRequest) => Promise<void>;
  onCancel?: () => void;
}
```

**Features:**
- 表单验证
- 类型选择
- 优先级选择
- 客户信息填写

#### PersonnelList

服务人员列表。

```typescript
interface PersonnelListProps {
  onPersonnelClick?: (personnel: ServicePersonnel) => void;
  showStatus?: boolean;
}
```

**Features:**
- 人员卡片展示
- 状态筛选
- 负载显示

#### ServiceDashboard

售后仪表板。

```typescript
interface ServiceDashboardProps {
  refreshInterval?: number;
}
```

**Features:**
- 工单统计卡片（总数/处理中/已完成/紧急）
- 今日新增工单
- 待处理工单列表
- 服务人员状态概览

### Pages

#### ServicePage

售后模块主页，入口页面。

**Layout:**
```
┌─────────────────────────────────────────┐
│ [返回] 售后服务                    [+新建]│
├─────────────────────────────────────────┤
│ ┌─────────┬─────────┬─────────┬────────┐│
│ │ 新建    │ 处理中  │ 待确认  │ 已完成 ││
│ │   12    │    8    │    3    │   45   ││
│ └─────────┴─────────┴─────────┴────────┘│
├─────────────────────────────────────────┤
│ [表格] [看板] [卡片]    搜索... [筛选]   │
├─────────────────────────────────────────┤
│ 工单列表...                              │
└─────────────────────────────────────────┘
```

## Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| `SERVICE_001` | 工单不存在 | 检查工单ID是否正确 |
| `SERVICE_002` | 状态转换无效 | 检查状态转换是否合法 |
| `SERVICE_003` | 权限不足 | 联系管理员开通权限 |
| `SERVICE_004` | 服务人员不存在 | 检查人员ID是否正确 |
| `SERVICE_005` | 服务人员忙碌 | 选择其他可用的服务人员 |
| `SERVICE_006` | 参数校验失败 | 检查必填字段和格式 |
| `SERVICE_007` | 数据库错误 | 联系技术支持 |
