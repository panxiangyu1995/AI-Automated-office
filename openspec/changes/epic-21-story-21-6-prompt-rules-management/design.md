# Design: 系统提示词与Rules规则管理

## Context

基于已实现的PromptBuilder和Ruleset后端，添加版本管理、前端UI和调试功能。

## Goals / Non-Goals

### Goals
- [x] 实现提示词编辑器
- [x] 实现模板管理
- [x] 实现版本管理
- [x] 实现Rules规则UI
- [x] 实现调试模式

### Non-Goals
- [ ] 提示词自动优化

## Data Models

```rust
// 提示词版本
pub struct PromptVersion {
    pub id: String,
    pub prompt_id: String,
    pub version: String,
    pub content: String,
    pub variables: Vec<PromptVariable>,
    pub change_log: String,
    pub created_by: String,
    pub created_at: i64,
    pub is_active: bool,
}

// 提示词变量
pub struct PromptVariable {
    pub key: String,
    pub name: String,
    pub var_type: VariableType,
    pub required: bool,
    pub default_value: Option<String>,
}

// Rules规则
pub struct BehaviorRule {
    pub id: String,
    pub name: String,
    pub rule_type: RuleType,
    pub priority: u32,
    pub conditions: Vec<RuleCondition>,
    pub actions: Vec<RuleAction>,
    pub is_enabled: bool,
    pub is_system: bool,
}

// 调试会话
pub struct DebugSession {
    pub id: String,
    pub prompt_version_id: String,
    pub test_input: String,
    pub rendered_prompt: String,
    pub token_count: TokenCount,
    pub model_response: String,
    pub latency_ms: u64,
}
```

## Database Schema

```sql
CREATE TABLE prompt_versions (
    id TEXT PRIMARY KEY,
    prompt_id TEXT NOT NULL,
    version TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    change_log TEXT,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_active INTEGER DEFAULT 0,
    UNIQUE(prompt_id, version)
);

CREATE TABLE prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    variables TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    usage_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);

CREATE TABLE behavior_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL,
    priority INTEGER DEFAULT 100,
    conditions TEXT DEFAULT '[]',
    actions TEXT DEFAULT '[]',
    is_enabled INTEGER DEFAULT 1,
    is_system INTEGER DEFAULT 0,
    scope_type TEXT NOT NULL,
    scope_value TEXT,
    created_at INTEGER NOT NULL
);

CREATE TABLE prompt_debug_sessions (
    id TEXT PRIMARY KEY,
    prompt_version_id TEXT NOT NULL,
    test_input TEXT,
    rendered_prompt TEXT,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    model_response TEXT,
    latency_ms INTEGER,
    created_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn prompt_version_list(
    ctx: State<'_, AppContext>,
    prompt_id: String,
) -> Result<Vec<PromptVersion>, CommandError>;

#[tauri::command]
pub async fn prompt_version_create(
    ctx: State<'_, AppContext>,
    prompt_id: String,
    content: String,
    change_log: String,
) -> Result<PromptVersion, CommandError>;

#[tauri::command]
pub async fn prompt_version_rollback(
    ctx: State<'_, AppContext>,
    prompt_id: String,
    version: String,
) -> Result<PromptVersion, CommandError>;

#[tauri::command]
pub async fn rules_list(
    ctx: State<'_, AppContext>,
) -> Result<Vec<BehaviorRule>, CommandError>;

#[tauri::command]
pub async fn rules_create(
    ctx: State<'_, AppContext>,
    rule: BehaviorRule,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn rules_toggle(
    ctx: State<'_, AppContext>,
    rule_id: String,
    enabled: bool,
) -> Result<(), CommandError>;

#[tauri::command]
pub async fn prompt_debug_session(
    ctx: State<'_, AppContext>,
    prompt_id: String,
    test_input: String,
) -> Result<DebugSession, CommandError>;
```
