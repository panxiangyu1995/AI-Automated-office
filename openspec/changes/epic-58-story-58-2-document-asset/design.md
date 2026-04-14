# Design: 文档资产与修订链

## Context

文档是平台重要资产，需要一等公民地位和完整的修订历史。

## Goals / Non-Goals

### Goals
- [x] 实现文档资产一等对象模型
- [x] 实现修订链和版本历史
- [x] 实现Staged Review机制
- [x] 实现知识闭环

### Non-Goals
- [ ] 文档协同编辑

## Data Models

```rust
// 文档资产
pub struct DocumentAsset {
    pub id: String,
    pub title: String,
    pub content: String,
    pub content_type: ContentType,
    pub status: DocumentStatus,
    pub current_version: String,
    pub created_by: String,
    pub updated_by: String,
    pub source_type: SourceType,
    pub source_id: Option<String>,
}

pub enum DocumentStatus {
    Draft,
    StagedReview,
    Approved,
    Published,
    Archived,
}

pub enum SourceType {
    User,
    Agent,
    Import,
    Template,
    Workflow,
}

// 修订条目
pub struct RevisionEntry {
    pub revision_id: String,
    pub version: String,
    pub content: String,
    pub changed_by: String,
    pub changed_at: i64,
    pub change_type: ChangeType,
    pub change_note: Option<String>,
}
```

## Database Schema

```sql
CREATE TABLE document_assets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    current_version TEXT NOT NULL DEFAULT '1.0.0',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT,
    tenant_id TEXT NOT NULL
);

CREATE TABLE document_revisions (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    version TEXT NOT NULL,
    content TEXT NOT NULL,
    change_type TEXT NOT NULL,
    change_note TEXT,
    changed_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    UNIQUE(document_id, version)
);

CREATE TABLE document_staged_reviews (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewers TEXT DEFAULT '[]',
    decision TEXT,
    decision_by TEXT,
    submitted_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn doc_asset_create(
    ctx: State<'_, AppContext>,
    title: String,
    content: String,
    content_type: ContentType,
    source_type: SourceType,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn doc_asset_revision_list(
    ctx: State<'_, AppContext>,
    document_id: String,
) -> Result<Vec<RevisionEntry>, CommandError>;

#[tauri::command]
pub async fn doc_asset_diff(
    ctx: State<'_, AppContext>,
    document_id: String,
    from_version: String,
    to_version: String,
) -> Result<VersionDiff, CommandError>;

#[tauri::command]
pub async fn doc_staged_review_submit(
    ctx: State<'_, AppContext>,
    document_id: String,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn doc_staged_review_decide(
    ctx: State<'_, AppContext>,
    review_id: String,
    decision: ReviewDecision,
) -> Result<(), CommandError>;
```
