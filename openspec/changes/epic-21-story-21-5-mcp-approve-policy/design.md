# Design: MCP工具Approve策略系统

## Context

基于已实现的Ruleset（Allow/Ask/Deny动作），扩展MCP特定Approve策略。

## Goals / Non-Goals

### Goals
- [x] 定义三种Approve策略类型
- [x] 实现工具级Approve策略配置
- [x] 实现批量设置
- [x] 实现AI智能推荐
- [x] 实现企业级默认策略
- [x] 实现临时批准
- [x] 实现决策日志

### Non-Goals
- [ ] 基于上下文的动态策略

## Data Models

```rust
// MCP Approve策略
pub struct McpApprovePolicy {
    pub id: String,
    pub name: String,
    pub strategy: ApproveStrategy,
    pub scope: PolicyScope,
    pub conditions: Vec<ApproveCondition>,
    pub ai_recommended: Option<AiRecommendation>,
}

pub enum ApproveStrategy {
    AutoApprove,
    RequireConfirm,
    Deny,
}

pub enum PolicyScope {
    Global,
    ToolType(String),
    Tool(String),
    Department(String),
    Tenant,
}

// 临时批准
pub struct TempApproval {
    pub id: String,
    pub tool_name: String,
    pub tool_args: serde_json::Value,
    pub approved_by: String,
    pub expires_at: i64,
    pub max_uses: u32,
    pub used_count: u32,
}
```

## Database Schema

```sql
CREATE TABLE mcp_approve_policies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    strategy TEXT NOT NULL,
    scope_type TEXT NOT NULL,
    scope_value TEXT,
    conditions TEXT DEFAULT '[]',
    priority INTEGER DEFAULT 100,
    is_enabled INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE approve_decision_logs (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    tool_args TEXT,
    decision TEXT NOT NULL,
    triggered_by TEXT NOT NULL,
    policy_id TEXT,
    user_id TEXT,
    response_time_ms INTEGER,
    created_at INTEGER NOT NULL
);

CREATE TABLE temp_approvals (
    id TEXT PRIMARY KEY,
    tool_name TEXT NOT NULL,
    tool_args TEXT,
    approved_by TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn mcp_approve_list(
    ctx: State<'_, AppContext>,
) -> Result<Vec<McpApprovePolicy>, CommandError>;

#[tauri::command]
pub async fn mcp_approve_create(
    ctx: State<'_, AppContext>,
    policy: McpApprovePolicy,
) -> Result<String, CommandError>;

#[tauri::command]
pub async fn mcp_approve_batch(
    ctx: State<'_, AppContext>,
    tool_patterns: Vec<String>,
    strategy: ApproveStrategy,
) -> Result<u32, CommandError>;

#[tauri::command]
pub async fn mcp_approve_recommend(
    ctx: State<'_, AppContext>,
    tool_name: String,
) -> Result<AiRecommendation, CommandError>;

#[tauri::command]
pub async fn mcp_temp_approve(
    ctx: State<'_, AppContext>,
    tool_name: String,
    expires_in_secs: u64,
) -> Result<TempApproval, CommandError>;

#[tauri::command]
pub async fn mcp_approve_logs(
    ctx: State<'_, AppContext>,
    tool_name: Option<String>,
    from: i64,
    to: i64,
) -> Result<Vec<ApproveDecisionLog>, CommandError>;
```
