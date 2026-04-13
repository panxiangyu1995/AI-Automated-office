# Specifications: Bidding 投标项目管理

## bidding-project

### Description

投标项目管理，支持项目创建、状态跟踪、文件管理。

### Schema

```typescript
interface BidProject {
  id: string;
  project_name: string;
  customer_name: string;
  customer_contact?: string;
  bidding_amount?: number;
  status: ProjectStatus;
  
  qualification_ids: string[];
  case_ids: string[];
  
  deadline?: string;
  bidding_date?: string;
  result_date?: string;
  
  progress: number; // 0-100
  
  attachments: string[];
  
  notes?: string;
  
  tenant_id: string;
  created_at: number;
  updated_at: number;
}

type ProjectStatus = 
  | 'preparing'   // 筹备中
  | 'bidding'     // 投标中
  | 'waiting_result' // 待开标
  | 'won'         // 已中标
  | 'lost'        // 已失标
  | 'cancelled';  // 已取消

// 状态元数据
const ProjectStatusMeta: Record<ProjectStatus, { label: string; color: string }> = {
  preparing: { label: '筹备中', color: 'gray' },
  bidding: { label: '投标中', color: 'blue' },
  waiting_result: { label: '待开标', color: 'yellow' },
  won: { label: '已中标', color: 'green' },
  lost: { label: '已失标', color: 'red' },
  cancelled: { label: '已取消', color: 'gray' },
};
```

### API

#### 创建项目

```
POST /api/tender/projects
```

**Request Body:**

```json
{
  "project_name": "XX智慧城市项目",
  "customer_name": "XX市人民政府",
  "bidding_amount": 5000000,
  "deadline": "2026-05-01",
  "qualification_ids": ["q-001", "q-002"],
  "case_ids": ["c-001"]
}
```

#### 更新状态

```
PUT /api/tender/projects/:id/status
```

**Request Body:**

```json
{
  "status": "bidding"
}
```

#### 获取统计数据

```
GET /api/tender/projects/stats
```

**Response:**

```json
{
  "total": 50,
  "preparing": 10,
  "bidding": 15,
  "waiting_result": 5,
  "won": 12,
  "lost": 6,
  "cancelled": 2,
  "total_bidding_amount": 250000000,
  "win_rate": 0.24
}
```

### Components

#### ProjectList

项目列表组件。

#### ProjectKanban

项目看板视图（按状态分组）。

#### ProjectDetail

项目详情面板。

#### ProjectTimeline

项目时间线（关键事件）。
