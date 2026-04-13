# Specifications: Bidding 招投标模块基础架构

## bidding-qualification

### Description

资质库管理，支持资质上传、到期提醒。

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR230 | 用户可以管理公司资质库 | MUST | 资质CRUD功能正常 |
| FR234 | 系统可以提醒资质到期时间 | MUST | 提前30天发送提醒 |

### Schema

```typescript
// 资质主体
interface Qualification {
  id: string;
  name: string;
  type: QualificationType;
  
  // 有效期
  issue_date: string;        // YYYY-MM-DD
  expiry_date: string;       // YYYY-MM-DD
  status: QualificationStatus;
  
  // 提醒
  reminder_enabled: boolean;
  reminder_days: number;      // 提前多少天提醒
  
  // 文件
  attachments: string[];      // 文件ID列表
  
  // 备注
  notes?: string;
  
  // 租户
  tenant_id: string;
  
  // 时间戳
  created_at: number;
  updated_at: number;
}

// 资质类型
type QualificationType = 
  | 'business_license'   // 营业执照
  | 'industry_license'   // 行业许可证
  | 'safety_cert'       // 安全许可证
  | 'quality_cert'      // 质量认证
  | 'tax_cert'          // 税务登记证
  | 'organization_code' // 组织机构代码
  | 'other';            // 其他

// 资质状态
type QualificationStatus = 'valid' | 'expiring' | 'expired';

// 资质类型元数据
const QualificationTypeMeta: Record<QualificationType, { 
  label: string; 
  icon: string; 
  color: string;
  validity_years: number;
}> = {
  business_license: { label: '营业执照', icon: 'Building', color: 'blue', validity_years: 5 },
  industry_license: { label: '行业许可证', icon: 'FileBadge', color: 'purple', validity_years: 4 },
  safety_cert: { label: '安全许可证', icon: 'Shield', color: 'red', validity_years: 3 },
  quality_cert: { label: '质量认证', icon: 'Award', color: 'green', validity_years: 3 },
  tax_cert: { label: '税务登记证', icon: 'Receipt', color: 'orange', validity_years: 5 },
  organization_code: { label: '组织机构代码', icon: 'Hash', color: 'gray', validity_years: 5 },
  other: { label: '其他', icon: 'File', color: 'gray', validity_years: 1 },
};

// 状态元数据
const QualificationStatusMeta: Record<QualificationStatus, { label: string; color: string }> = {
  valid: { label: '有效', color: 'green' },
  expiring: { label: '即将到期', color: 'yellow' },
  expired: { label: '已过期', color: 'red' },
};
```

### API

#### 创建资质

```
POST /api/tender/qualifications
```

**Request Body:**

```json
{
  "name": "建筑业企业资质证书",
  "type": "industry_license",
  "issue_date": "2021-06-15",
  "expiry_date": "2026-06-14",
  "reminder_enabled": true,
  "reminder_days": 30,
  "notes": "一级建筑资质"
}
```

**Response (201):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "建筑业企业资质证书",
  "type": "industry_license",
  "issue_date": "2021-06-15",
  "expiry_date": "2026-06-14",
  "status": "valid",
  "reminder_enabled": true,
  "reminder_days": 30,
  "attachments": [],
  "created_at": 1713000000,
  "updated_at": 1713000000,
  "tenant_id": "tenant-001"
}
```

#### 查询资质列表

```
GET /api/tender/qualifications
```

**Query Parameters:**

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string[] | 类型筛选 |
| status | string | 状态筛选 |
| search | string | 搜索关键词 |

**Response (200):**

```json
{
  "items": [...],
  "total": 25,
  "page": 1,
  "page_size": 20
}
```

#### 获取即将到期资质

```
GET /api/tender/qualifications/expiring?days=30
```

**Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "安全生产许可证",
      "type": "safety_cert",
      "expiry_date": "2026-05-01",
      "days_remaining": 18,
      "status": "expiring"
    }
  ],
  "total": 3
}
```

## bidding-case

### Description

业绩库管理，支持业绩案例上传和展示。

### Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|-------------------|
| FR231 | 用户可以管理业绩案例库 | MUST | 业绩CRUD和搜索功能正常 |

### Schema

```typescript
// 业绩案例主体
interface Case {
  id: string;
  project_name: string;
  customer_name: string;
  industry: string;
  project_type: string;
  
  // 时间
  start_date: string;         // YYYY-MM-DD
  end_date?: string;          // YYYY-MM-DD
  
  // 金额
  amount?: number;
  currency: string;           // 默认 CNY
  
  // 描述
  description?: string;
  
  // 标签
  tags: string[];
  
  // 文件
  attachments: string[];
  
  // 统计
  view_count: number;
  use_count: number;
  
  // 租户
  tenant_id: string;
  
  // 时间戳
  created_at: number;
  updated_at: number;
}

// 行业分类
interface Industry {
  id: string;
  name: string;
  parent_id?: string;
  sort_order: number;
}
```

### API

#### 创建业绩

```
POST /api/tender/cases
```

**Request Body:**

```json
{
  "project_name": "XX大厦智能化工程",
  "customer_name": "XX房地产有限公司",
  "industry": "房地产",
  "project_type": "智能化工程",
  "start_date": "2022-01-15",
  "end_date": "2023-06-30",
  "amount": 5000000,
  "description": "包含楼宇自动化、安防系统等",
  "tags": ["智能化", "楼宇", "安防"]
}
```

#### 搜索业绩

```
GET /api/tender/cases/search
```

**Query Parameters:**

| 参数 | 类型 | 说明 |
|------|------|------|
| q | string | 搜索关键词 |
| industry | string | 行业筛选 |
| min_amount | number | 最小金额 |
| max_amount | number | 最大金额 |
| date_from | string | 开始日期 |
| date_to | string | 结束日期 |

**Response (200):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "project_name": "XX大厦智能化工程",
      "customer_name": "XX房地产有限公司",
      "industry": "房地产",
      "amount": 5000000,
      "tags": ["智能化", "楼宇"]
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 20
}
```

## bidding-base-ui

### Description

招投标模块前端UI组件。

### Components

#### QualificationList

资质列表组件。

```typescript
interface QualificationListProps {
  filters?: QualificationFilters;
  onQualificationClick?: (q: Qualification) => void;
  viewMode?: 'list' | 'card';
}
```

**Features:**
- 按类型分组展示
- 状态筛选（有效/即将到期/已过期）
- 到期倒计时显示
- 快速操作（编辑/删除/提醒）

#### CaseList

业绩列表组件。

```typescript
interface CaseListProps {
  filters?: CaseFilters;
  onCaseClick?: (c: Case) => void;
}
```

**Features:**
- 行业分类筛选
- 金额范围筛选
- 关键词搜索
- 列表/卡片视图切换

#### ExpiryAlert

到期提醒组件。

```typescript
interface ExpiryAlertProps {
  days?: number; // 默认30天
  onRemind?: (ids: string[]) => void;
}
```

### Pages

#### TenderPage

招投标主页。

```
┌─────────────────────────────────────────┐
│ [返回] 招投标管理              [+资质] [+业绩] │
├─────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ 有效    │ │ 即将到期 │ │ 已过期  │    │
│ │   15    │ │    3    │ │    2    │    │
│ └─────────┘ └─────────┘ └─────────┘    │
├─────────────────────────────────────────┤
│ [资质库] [业绩库] [投标管理] [标书生成]  │
├─────────────────────────────────────────┤
│ 内容区域...                              │
└─────────────────────────────────────────┘
```

## Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| `TENDER_001` | 资质不存在 | 检查资质ID |
| `TENDER_002` | 资质已过期 | 无法进行操作 |
| `TENDER_003` | 资质类型无效 | 检查类型值 |
| `TENDER_004` | 业绩不存在 | 检查业绩ID |
| `TENDER_005` | 文件上传失败 | 重新上传 |
