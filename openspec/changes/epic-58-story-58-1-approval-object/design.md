# Design: 平台级审批对象模型

## Context

审批是平台治理的核心，需要统一的审批对象抽象和状态机。

## Goals / Non-Goals

### Goals
- [x] 定义平台级审批对象模型
- [x] 实现审批状态机
- [x] 实现Approval Resume Gate
- [x] 实现人类审阅边界

### Non-Goals
- [ ] 审批流程可视化设计器

## Data Models

```rust
// 平台级审批对象
pub struct ApprovalObject {
    pub id: String,
    pub object_type: ApprovalObjectType,
    pub object_id: String,
    pub title: String,
    pub status: ApprovalStatus,
    pub requested_by: String,
    pub requested_at: i64,
    pub decided_by: Option<String>,
    pub decided_at: Option<i64>,
    pub decision_note: Option<String>,
    pub context: ApprovalContext,
}

pub enum ApprovalObjectType {
    BusinessObject(String),
    DocumentAsset,
    KnowledgeDraft,
    MessageSession,
}

pub enum ApprovalStatus {
    Pending,
    RevisionRequested,
    Resubmitted,
    Approved,
    Rejected,
    Cancelled,
}

// Resume Gate
pub struct ResumeGateConfig {
    pub enabled: bool,
    pub resume_action: ResumeAction,
    pub conditions: Vec<ResumeCondition>,
}
```

## Database Schema

```sql
CREATE TABLE approval_objects (
    id TEXT PRIMARY KEY,
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_by TEXT NOT NULL,
    requested_at INTEGER NOT NULL,
    decided_by TEXT,
    decided_at INTEGER,
    decision_note TEXT,
    business_type TEXT NOT NULL,
    business_data TEXT,
    tenant_id TEXT NOT NULL,
    department_id TEXT
);

CREATE TABLE approval_approvers (
    id TEXT PRIMARY KEY,
    approval_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    decided_at INTEGER,
    decision_note TEXT
);

CREATE TABLE approval_resume_gates (
    id TEXT PRIMARY KEY,
    approval_id TEXT NOT NULL,
    task_id TEXT,
    resume_action TEXT NOT NULL,
    triggered_at INTEGER NOT NULL,
    executed_at INTEGER
);
```

## API Commands

```rust
#[tauri::command]
pub async fn approval_object_create(
    ctx: State<'_, AppContext>,
    object: ApprovalObject,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn approval_object_list(
    ctx: State<'_, AppContext>,
    object_type: Option<String>,
    status: Option<String>,
) -> Result<Vec<ApprovalObject>, CommandError>;

#[tauri::command]
pub async fn approval_decide(
    ctx: State<'_, AppContext>,
    approval_id: String,
    decision: ApprovalDecision,
) -> Result<(), CommandError>;

#[tauri::command]
pub async fn approval_resume_trigger(
    ctx: State<'_, AppContext>,
    approval_id: String,
) -> Result<(), CommandError>;
```
