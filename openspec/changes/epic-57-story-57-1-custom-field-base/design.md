# Design: 自定义字段基础系统

## Context

业务对象需要灵活的自定义字段来适应不同企业需求。

## Goals / Non-Goals

### Goals
- [x] 定义字段数据模型
- [x] 实现基础字段类型
- [x] 实现场景显示规则
- [x] 实现动态表单渲染

### Non-Goals
- [ ] 字段联动逻辑

## Data Models

```rust
// 自定义字段
pub struct CustomField {
    pub id: String,
    pub field_key: String,
    pub name: String,
    pub field_type: FieldType,
    pub entity_type: String,
    pub default_value: Option<String>,
    pub required: bool,
    pub help_text: Option<String>,
    pub status: FieldStatus,
    pub display_order: u32,
}

pub enum FieldType {
    Text,
    LongText,
    Number,
    Amount,
    Date,
    DateTime,
    SingleSelect,
    MultiSelect,
    Boolean,
    User,
    Department,
}

// 场景显示规则
pub struct SceneDisplayRule {
    pub id: String,
    pub field_id: String,
    pub scene: DisplayScene,
    pub visible: bool,
    pub editable: bool,
    pub required: bool,
}

pub enum DisplayScene {
    List,
    Detail,
    Create,
    Edit,
    Approval,
}
```

## Database Schema

```sql
CREATE TABLE custom_fields (
    id TEXT PRIMARY KEY,
    field_key TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    field_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    default_value TEXT,
    required INTEGER DEFAULT 0,
    help_text TEXT,
    status TEXT DEFAULT 'active',
    display_order INTEGER DEFAULT 0,
    validation_rules TEXT,
    options TEXT,
    tenant_id TEXT NOT NULL,
    UNIQUE(entity_type, field_key)
);

CREATE TABLE field_scene_rules (
    id TEXT PRIMARY KEY,
    field_id TEXT NOT NULL,
    scene TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    editable INTEGER DEFAULT 1,
    required INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE field_values (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    field_id TEXT NOT NULL,
    value TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn field_define_list(
    ctx: State<'_, AppContext>,
    entity_type: String,
) -> Result<Vec<CustomField>, CommandError>;

#[tauri::command]
pub async fn field_define_create(
    ctx: State<'_, AppContext>,
    field: CustomField,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn field_scene_config(
    ctx: State<'_, AppContext>,
    entity_type: String,
    scene: DisplayScene,
) -> Result<Vec<SceneDisplayRule>, CommandError>;

#[tauri::command]
pub async fn field_values_get(
    ctx: State<'_, AppContext>,
    entity_id: String,
    entity_type: String,
) -> Result<HashMap<String, String>, CommandError>;

#[tauri::command]
pub async fn field_values_set(
    ctx: State<'_, AppContext>,
    entity_id: String,
    entity_type: String,
    values: HashMap<String, String>,
) -> Result<(), CommandError>;
```
