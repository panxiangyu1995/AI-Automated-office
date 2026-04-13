# Design: Bidding 招投标模块基础架构

## Context

招投标是企业重要业务模块，需要集中管理：
- 公司资质（营业执照、安全许可证等）
- 业绩案例（已完成项目）
- 投标项目（Story 16.2）

### 技术背景

- **前端架构：** React + TypeScript + Shadcn/ui + Tailwind CSS
- **后端架构：** Rust + Tauri + SQLite
- **文件存储：** 本地文件系统 + 文件ID引用

## Goals / Non-Goals

### Goals（本次实现）

- [x] 实现资质库CRUD
- [x] 实现业绩库CRUD
- [x] 创建资质管理页面
- [x] 创建业绩库页面
- [x] 实现到期提醒逻辑

### Non-Goals（后续Story实现）

- [ ] 投标项目管理（Story 16.2）
- [ ] 标书生成（Story 16.3）

## Decisions

### 1. 资质类型设计

```typescript
// 资质类型枚举
type QualificationType = 
  | 'business_license'        // 营业执照
  | 'industry_license'        // 行业许可证
  | 'safety_cert'             // 安全许可证
  | 'quality_cert'            // 质量认证
  | 'tax_cert'                // 税务登记证
  | 'organization_code'       // 组织机构代码
  | 'other';                  // 其他

// 资质元数据
const QualificationTypeMeta: Record<QualificationType, { label: string; icon: string; validity_years: number }> = {
  business_license: { label: '营业执照', icon: 'Building', validity_years: 5 },
  industry_license: { label: '行业许可证', icon: 'FileBadge', validity_years: 4 },
  safety_cert: { label: '安全许可证', icon: 'Shield', validity_years: 3 },
  quality_cert: { label: '质量认证', icon: 'Award', validity_years: 3 },
  tax_cert: { label: '税务登记证', icon: 'Receipt', validity_years: 5 },
  organization_code: { label: '组织机构代码', icon: 'Hash', validity_years: 5 },
  other: { label: '其他', icon: 'File', validity_years: 1 },
};
```

### 2. 数据库Schema设计

```sql
-- 资质表
CREATE TABLE tender_qualifications (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'business_license', 'industry_license', 'safety_cert',
        'quality_cert', 'tax_cert', 'organization_code', 'other'
    )),
    
    -- 有效期
    issue_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expiring', 'expired')),
    
    -- 提醒设置
    reminder_enabled INTEGER DEFAULT 1,
    reminder_days INTEGER DEFAULT 30,
    
    -- 文件
    attachments TEXT DEFAULT '[]', -- JSON array of file IDs
    
    -- 备注
    notes TEXT,
    
    -- 租户
    tenant_id TEXT NOT NULL,
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- 索引
    INDEX idx_qual_type ON tender_qualifications(type),
    INDEX idx_qual_status ON tender_qualifications(status),
    INDEX idx_qual_expiry ON tender_qualifications(expiry_date)
);

-- 业绩案例表
CREATE TABLE tender_cases (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    industry TEXT NOT NULL,
    project_type TEXT NOT NULL,
    
    -- 时间
    start_date TEXT NOT NULL,
    end_date TEXT,
    
    -- 金额
    amount REAL,
    currency TEXT DEFAULT 'CNY',
    
    -- 描述
    description TEXT,
    
    -- 标签
    tags TEXT DEFAULT '[]', -- JSON array
    
    -- 文件
    attachments TEXT DEFAULT '[]',
    
    -- 统计
    view_count INTEGER DEFAULT 0,
    use_count INTEGER DEFAULT 0,
    
    -- 租户
    tenant_id TEXT NOT NULL,
    
    -- 时间戳
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    
    -- 索引
    INDEX idx_case_industry ON tender_cases(industry),
    INDEX idx_case_customer ON tender_cases(customer_name)
);

-- 行业分类表
CREATE TABLE tender_industries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    parent_id TEXT,
    sort_order INTEGER DEFAULT 0,
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
```

### 3. 目录结构

```
src/features/tender/
├── components/
│   ├── QualificationList.tsx       # 资质列表
│   ├── QualificationCard.tsx      # 资质卡片
│   ├── QualificationForm.tsx      # 资质表单
│   ├── QualificationStatusBadge.tsx
│   ├── CaseList.tsx               # 业绩列表
│   ├── CaseCard.tsx               # 业绩卡片
│   ├── CaseForm.tsx               # 业绩表单
│   ├── ExpiryAlert.tsx            # 到期提醒
│   └── IndustrySelector.tsx        # 行业选择器
├── pages/
│   ├── TenderPage.tsx             # 招投标主页
│   ├── QualificationPage.tsx       # 资质管理页
│   └── CasePage.tsx               # 业绩库页
├── api/
│   └── tender.ts
├── types/
│   └── tender.ts
├── stores/
│   └── tenderStore.ts
└── index.ts

src-tauri/src/tender/
├── mod.rs
├── types.rs
├── commands.rs
│   ├── qualification_commands.rs
│   └── case_commands.rs
├── db.rs
│   ├── qualification_db.rs
│   └── case_db.rs
└── reminder.rs                    # 到期提醒
```

### 4. 到期提醒逻辑

```rust
// 资质状态计算
fn calculate_qualification_status(expiry_date: &str, reminder_days: i32) -> QualificationStatus {
    let expiry = chrono::NaiveDate::parse_from_str(expiry_date, "%Y-%m-%d")
        .unwrap();
    let today = chrono::Local::now().date_naive();
    let days_until_expiry = (expiry - today).num_days();
    
    match days_until_expiry {
        d if d < 0 => QualificationStatus::Expired,
        d if d <= reminder_days => QualificationStatus::Expiring,
        _ => QualificationStatus::Valid,
    }
}

// 定时任务：每日检查资质到期
async fn check_expiring_qualifications(state: &AppState) -> Result<Vec<Qualification>> {
    let today = chrono::Local::now().date_naive();
    let reminder_threshold = today + chrono::Duration::days(30);
    
    let db = state.db.lock().await;
    db.get_qualifications_expiring_before(reminder_threshold)
}
```

### 5. API设计

#### 资质API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/tender/qualifications` | 创建资质 |
| GET | `/api/tender/qualifications` | 查询资质列表 |
| GET | `/api/tender/qualifications/:id` | 获取资质详情 |
| PUT | `/api/tender/qualifications/:id` | 更新资质 |
| DELETE | `/api/tender/qualifications/:id` | 删除资质 |
| GET | `/api/tender/qualifications/expiring` | 获取即将到期资质 |
| POST | `/api/tender/qualifications/:id/remind` | 发送提醒 |

#### 业绩API

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/tender/cases` | 创建业绩 |
| GET | `/api/tender/cases` | 查询业绩列表 |
| GET | `/api/tender/cases/:id` | 获取业绩详情 |
| PUT | `/api/tender/cases/:id` | 更新业绩 |
| DELETE | `/api/tender/cases/:id` | 删除业绩 |
| GET | `/api/tender/cases/search` | 搜索业绩 |

### 6. 错误码设计

| 错误码 | 说明 |
|--------|------|
| `TENDER_001` | 资质不存在 |
| `TENDER_002` | 资质已过期 |
| `TENDER_003` | 资质类型无效 |
| `TENDER_004` | 业绩不存在 |
| `TENDER_005` | 文件上传失败 |

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| 资质过期导致投标失败 | 高 | 实现到期前自动提醒 |
| 文件存储空间不足 | 中 | 实现文件清理机制 |
| 业绩搜索性能 | 中 | 实现全文索引 |

## Migration Plan

### Phase 1: 数据库迁移

```sql
-- 执行迁移
CREATE TABLE tender_qualifications (...);
CREATE TABLE tender_cases (...);
CREATE TABLE tender_industries (...);
```

### Phase 2: 后端实现

1. 创建 `src-tauri/src/tender/` 目录
2. 实现类型定义和数据库操作
3. 实现到期提醒逻辑
4. 注册模块

### Phase 3: 前端实现

1. 创建 `src/features/tender/` 目录
2. 实现UI组件和页面
3. 集成到Sidebar

## Rollback

```sql
DROP TABLE IF EXISTS tender_qualifications;
DROP TABLE IF EXISTS tender_cases;
DROP TABLE IF EXISTS tender_industries;
```
