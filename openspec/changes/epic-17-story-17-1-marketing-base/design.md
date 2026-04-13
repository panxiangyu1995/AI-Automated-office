# Design: Marketing 市场宣传模块基础架构

## Context

市场宣传模块需要管理营销活动和内容创作。

## Goals / Non-Goals

### Goals

- [x] 实现活动CRUD
- [x] 实现内容CRUD
- [x] 创建活动统计基础

### Non-Goals

- [ ] AI文案生成（Story 17.2）
- [ ] 数据分析（Story 17.3）

## Decisions

### 1. 数据库Schema

```sql
CREATE TABLE marketing_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('online', 'offline', 'hybrid')),
    status TEXT NOT NULL DEFAULT 'draft',
    start_date TEXT NOT NULL,
    end_date TEXT,
    budget REAL DEFAULT 0,
    channels TEXT DEFAULT '[]',
    content_ids TEXT DEFAULT '[]',
    stats TEXT DEFAULT '{}',
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE marketing_contents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    body TEXT,
    type TEXT NOT NULL CHECK (type IN ('article', 'social_post', 'email', 'video_script')),
    status TEXT NOT NULL DEFAULT 'draft',
    campaign_id TEXT,
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    tags TEXT DEFAULT '[]',
    attachments TEXT DEFAULT '[]',
    published_at INTEGER,
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 2. 目录结构

```
src/features/marketing/
├── components/
│   ├── CampaignList.tsx
│   ├── CampaignDetail.tsx
│   ├── CampaignForm.tsx
│   ├── ContentList.tsx
│   ├── ContentEditor.tsx
│   └── ContentForm.tsx
├── pages/
│   └── MarketingPage.tsx
└── ...

src-tauri/src/marketing/
├── mod.rs
├── types.rs
├── commands.rs
├── campaign.rs
└── content.rs
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 活动与内容关联复杂 | 使用中间表管理多对多关系 |
| 内容审批流程长 | 集成审批模块 |
