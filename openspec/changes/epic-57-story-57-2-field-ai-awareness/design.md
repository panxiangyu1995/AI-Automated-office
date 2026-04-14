# Design: 自定义字段AI感知能力

## Context

AI需要理解业务字段的语义和使用范围。

## Goals / Non-Goals

### Goals
- [x] 实现AI可用/不可用标记
- [x] 实现AI语义说明
- [x] 实现使用范围配置
- [x] 实现最小暴露原则
- [x] 实现空值处理
- [x] 实现脱敏处理

### Non-Goals
- [ ] 自动语义理解

## Data Models

```rust
// AI感知字段配置
pub struct AiFieldConfig {
    pub field_id: String,
    pub ai_enabled: bool,
    pub semantic_description: String,
    pub usage_scope: Vec<AiUsageScope>,
    pub priority: AiPriority,
    pub min_expose: bool,
    pub allow_empty_fabrication: bool,
    pub sensitive_config: SensitiveConfig,
}

pub enum AiUsageScope {
    Generate,
    Summary,
    Suggest,
    Qa,
    Search,
}

pub enum AiPriority {
    Critical,
    High,
    Normal,
    Low,
}

pub struct SensitiveConfig {
    pub is_sensitive: bool,
    pub mask_type: Option<MaskType>,
    pub mask_pattern: Option<String>,
}

pub enum MaskType {
    Full,
    Partial,
    Hash,
}

// AI上下文注入
pub struct AiFieldContext {
    pub field_id: String,
    pub field_key: String,
    pub field_name: String,
    pub semantic: String,
    pub value: Option<String>,
    pub is_sensitive: bool,
}
```

## Database Schema

```sql
CREATE TABLE ai_field_configs (
    id TEXT PRIMARY KEY,
    field_id TEXT NOT NULL UNIQUE,
    ai_enabled INTEGER DEFAULT 1,
    semantic_description TEXT,
    usage_scope TEXT DEFAULT '[]',
    priority TEXT DEFAULT 'normal',
    min_expose INTEGER DEFAULT 0,
    allow_empty_fabrication INTEGER DEFAULT 0,
    is_sensitive INTEGER DEFAULT 0,
    mask_type TEXT,
    mask_pattern TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE ai_field_usage_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    field_id TEXT NOT NULL,
    task_type TEXT NOT NULL,
    used_for TEXT NOT NULL,
    value_provided INTEGER DEFAULT 0,
    masked INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE field_lifecycle (
    id TEXT PRIMARY KEY,
    field_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    triggered_by TEXT,
    triggered_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn field_ai_config_get(
    ctx: State<'_, AppContext>,
    field_id: String,
) -> Result<AiFieldConfig, CommandError>;

#[tauri::command]
pub async fn field_ai_config_set(
    ctx: State<'_, AppContext>,
    config: AiFieldConfig,
) -> Result<(), CommandError>;

#[tauri::command]
pub async fn field_ai_context_build(
    ctx: State<'_, AppContext>,
    entity_id: String,
    entity_type: String,
    task_type: AiUsageScope,
) -> Result<Vec<AiFieldContext>, CommandError>;

#[tauri::command]
pub async fn field_ai_value_mask(
    ctx: State<'_, AppContext>,
    field_id: String,
    value: String,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn field_lifecycle_log(
    ctx: State<'_, AppContext>,
    field_id: String,
    event_type: String,
    old_status: Option<String>,
    new_status: String,
) -> Result<(), CommandError>;
```
