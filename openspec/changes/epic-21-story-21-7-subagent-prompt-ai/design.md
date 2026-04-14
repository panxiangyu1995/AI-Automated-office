# Design: Sub-Agent AI辅助提示词生成

## Context

完善Sub-Agent的AI辅助提示词生成和调用机制。

## Goals / Non-Goals

### Goals
- [x] 实现AI辅助提示词生成
- [x] 实现触发关键词配置
- [x] 实现自动/手动路由
- [x] 实现嵌套调用
- [x] 实现回退机制

### Non-Goals
- [ ] Sub-Agent自动发现

## Data Models

```rust
// Sub-Agent配置
pub struct SubAgentConfig {
    pub id: String,
    pub name: String,
    pub role: String,
    pub description: String,
    pub system_prompt: String,
    pub model_config: ModelConfig,
    pub trigger: TriggerConfig,
    pub max_depth: u8,
    pub timeout_secs: u64,
}

// 触发配置
pub struct TriggerConfig {
    pub trigger_type: TriggerType,
    pub keywords: Vec<String>,
    pub conditions: Vec<TriggerCondition>,
    pub priority: u32,
}

pub enum TriggerType {
    Keyword,
    Condition,
    Manual,
    Auto,
}

// 委派任务
pub struct DelegatedTask {
    pub task_id: String,
    pub parent_trace_id: String,
    pub sub_agent_id: String,
    pub objective: String,
    pub context: TaskContext,
    pub budget: TaskBudget,
    pub depth: u8,
}
```

## Database Schema

```sql
CREATE TABLE sub_agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    model_provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    max_depth INTEGER DEFAULT 1,
    timeout_secs INTEGER DEFAULT 300,
    is_enabled INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
);

CREATE TABLE sub_agent_triggers (
    id TEXT PRIMARY KEY,
    sub_agent_id TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    keywords TEXT DEFAULT '[]',
    conditions TEXT DEFAULT '[]',
    priority INTEGER DEFAULT 100
);

CREATE TABLE delegation_records (
    id TEXT PRIMARY KEY,
    parent_trace_id TEXT NOT NULL,
    sub_agent_id TEXT NOT NULL,
    task_objective TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    output TEXT,
    error TEXT,
    depth INTEGER NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER
);
```

## API Commands

```rust
#[tauri::command]
pub async fn subagent_generate_prompt(
    ctx: State<'_, AppContext>,
    role_description: String,
    capabilities: Vec<String>,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn subagent_config_create(
    ctx: State<'_, AppContext>,
    config: SubAgentConfig,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn subagent_route(
    ctx: State<'_, AppContext>,
    task_description: String,
) -> Result<Option<SubAgentConfig>, CommandError>;

#[tauri::command]
pub async fn subagent_execute(
    ctx: State<'_, AppContext>,
    agent_id: String,
    task: String,
    parent_trace_id: String,
) -> Result<DelegationResult, CommandError>;
```
