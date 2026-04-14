# Design: ClawHub生态 - 市场集成与资源管理

## Context

基于Story 10.2安装管理，实现市场浏览、搜索、上传审核功能。

## Goals / Non-Goals

### Goals
- [x] 实现官方市场浏览
- [x] 实现资源搜索
- [x] 实现资源详情
- [x] 实现私有市场配置
- [x] 实现上传审核
- [x] 实现自动更新检查

### Non-Goals
- [ ] 离线市场缓存
- [ ] 市场数据分析

## Data Models

```rust
// 市场资源
pub struct MarketResource {
    pub id: String,
    pub name: String,
    pub version: String,
    pub resource_type: ResourceType,
    pub category: String,
    pub author: String,
    pub description: String,
    pub tags: Vec<String>,
    pub rating: f32,
    pub install_count: u64,
    pub is_official: bool,
}

// 搜索请求
pub struct SearchRequest {
    pub query: String,
    pub resource_type: Option<ResourceType>,
    pub category: Option<String>,
    pub tags: Vec<String>,
    pub sort_by: SortBy,
    pub page: u32,
    pub page_size: u32,
}
```

## Database Schema

```sql
CREATE TABLE market_resources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    category TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    tags TEXT DEFAULT '[]',
    rating REAL DEFAULT 0,
    install_count INTEGER DEFAULT 0,
    is_official INTEGER DEFAULT 0,
    market_id TEXT NOT NULL,
    status TEXT DEFAULT 'published',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE market_reviews (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE market_uploads (
    id TEXT PRIMARY KEY,
    resource_id TEXT,
    uploader TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewer TEXT,
    review_note TEXT,
    submitted_at INTEGER NOT NULL,
    reviewed_at INTEGER,
    tenant_id TEXT NOT NULL
);
```

## Directory Structure

```
src-tauri/src/marketplace/
├── mod.rs
├── client.rs        # 市场API客户端
├── search.rs        # 搜索服务
└── upload.rs       # 上传审核

src/features/marketplace/
├── pages/
│   ├── MarketPage.tsx
│   ├── DetailPage.tsx
│   └── UploadPage.tsx
├── components/
│   ├── SearchBar.tsx
│   ├── ResourceCard.tsx
│   └── CategoryFilter.tsx
└── api/
    └── marketplace.api.ts
```

## API Commands

```rust
#[tauri::command]
pub async fn marketplace_browse(
    ctx: State<'_, AppContext>,
    category: Option<String>,
    page: u32,
    page_size: u32,
) -> Result<Vec<MarketResource>, CommandError>;

#[tauri::command]
pub async fn marketplace_search(
    ctx: State<'_, AppContext>,
    request: SearchRequest,
) -> Result<Vec<MarketResource>, CommandError>;

#[tauri::command]
pub async fn marketplace_detail(
    ctx: State<'_, AppContext>,
    resource_id: String,
) -> Result<MarketResourceDetail, CommandError>;

#[tauri::command]
pub async fn marketplace_upload(
    ctx: State<'_, AppContext>,
    resource: UploadResource,
) -> Result<ApprovalRequest, CommandError>;

#[tauri::command]
pub async fn marketplace_review_process(
    ctx: State<'_, AppContext>,
    upload_id: String,
    decision: ApprovalDecision,
) -> Result<(), CommandError>;
```
