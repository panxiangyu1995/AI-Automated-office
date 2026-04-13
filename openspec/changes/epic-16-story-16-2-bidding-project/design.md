# Design: Bidding 投标项目管理

## Context

在Story 16.1基础上，实现投标项目全流程管理。

## Goals / Non-Goals

### Goals（本次实现）

- [x] 实现项目创建和编辑
- [x] 实现项目状态跟踪
- [x] 实现投标文件管理
- [x] 实现资质业绩关联
- [x] 实现项目统计

### Non-Goals

- [ ] 标书生成（Story 16.3）

## Decisions

### 1. 项目状态机

```
筹备中 → 投标中 → 待开标 → 已中标
                           → 已失标
                           → 已取消
```

| 状态 | 说明 |
|------|------|
| `preparing` | 筹备中，准备投标材料 |
| `bidding` | 投标中，已提交投标 |
| `waiting_result` | 待开标，等待结果 |
| `won` | 已中标 |
| `lost` | 已失标 |
| `cancelled` | 已取消 |

### 2. 数据库Schema

```sql
CREATE TABLE tender_projects (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_contact TEXT,
    bidding_amount REAL,
    status TEXT NOT NULL DEFAULT 'preparing',
    
    -- 关联
    qualification_ids TEXT DEFAULT '[]',
    case_ids TEXT DEFAULT '[]',
    
    -- 时间
    deadline TEXT,
    bidding_date TEXT,
    result_date TEXT,
    
    -- 进度
    progress INTEGER DEFAULT 0,
    
    -- 统计
    attachments TEXT DEFAULT '[]',
    
    -- 备注
    notes TEXT,
    
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 3. API设计

| Method | Endpoint | 说明 |
|--------|----------|------|
| POST | `/api/tender/projects` | 创建项目 |
| GET | `/api/tender/projects` | 查询项目列表 |
| GET | `/api/tender/projects/:id` | 获取项目详情 |
| PUT | `/api/tender/projects/:id` | 更新项目 |
| PUT | `/api/tender/projects/:id/status` | 更新状态 |
| POST | `/api/tender/projects/:id/attachments` | 上传附件 |
| GET | `/api/tender/projects/stats` | 获取统计数据 |

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 项目信息不完整 | 表单必填校验 |
| 状态转换错误 | 状态机验证 |
