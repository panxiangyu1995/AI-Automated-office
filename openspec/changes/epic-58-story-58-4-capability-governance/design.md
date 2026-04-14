# Design: 能力治理与Principal Membership

## Context

平台需要统一的能力治理和主体身份管理。

## Goals / Non-Goals

### Goals
- [x] 建立统一能力契约
- [x] 实现Capability Fitness Board
- [x] 实现改进建议引擎
- [x] 实现Principal Membership模型
- [x] 实现DAK Graph

### Non-Goals
- [ ] 自动优化建议执行

## Data Models

```rust
// 能力契约
pub struct CapabilityContract {
    pub id: String,
    pub capability_type: CapabilityType,
    pub name: String,
    pub version: String,
    pub description: String,
    pub metrics: CapabilityMetrics,
    pub health_status: HealthStatus,
}

pub struct CapabilityMetrics {
    pub success_rate: f32,
    pub avg_latency_ms: u64,
    pub failure_rate: f32,
    pub approval_friction: f32,
    pub usage_count: u64,
}

// 主体身份
pub enum Principal {
    User(UserPrincipal),
    Agent(AgentPrincipal),
    SubAgent(SubAgentPrincipal),
    Group(GroupPrincipal),
    System(SystemPrincipal),
}

pub struct UserPrincipal {
    pub id: String,
    pub name: String,
    pub email: String,
    pub roles: Vec<String>,
    pub tenant_id: String,
}

// DAK Graph
pub enum DakNode {
    Document(String),
    Approval(String),
    Knowledge(String),
}
```

## Database Schema

```sql
CREATE TABLE capability_contracts (
    id TEXT PRIMARY KEY,
    capability_type TEXT NOT NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL,
    description TEXT,
    success_rate REAL DEFAULT 0,
    avg_latency_ms INTEGER DEFAULT 0,
    failure_rate REAL DEFAULT 0,
    health_status TEXT DEFAULT 'unknown',
    owner TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE improvement_suggestions (
    id TEXT PRIMARY KEY,
    capability_id TEXT,
    suggestion_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence TEXT DEFAULT '[]',
    status TEXT DEFAULT 'pending',
    created_at INTEGER NOT NULL
);

CREATE TABLE principals (
    id TEXT PRIMARY KEY,
    principal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    tenant_id TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE principal_relations (
    id TEXT PRIMARY KEY,
    from_principal TEXT NOT NULL,
    to_principal TEXT NOT NULL,
    relation_type TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
```

## API Commands

```rust
#[tauri::command]
pub async fn governance_fitness_board(
    ctx: State<'_, AppContext>,
) -> Result<FitnessBoard, CommandError>;

#[tauri::command]
pub async fn governance_suggestions_list(
    ctx: State<'_, AppContext>,
    status: Option<String>,
) -> Result<Vec<ImprovementSuggestion>, CommandError>;

#[tauri::command]
pub async fn principal_list(
    ctx: State<'_, AppContext>,
    principal_type: Option<String>,
) -> Result<Vec<Principal>, CommandError>;

#[tauri::command]
pub async fn dak_graph_build(
    ctx: State<'_, AppContext>,
    root_id: String,
    root_type: String,
) -> Result<DakGraph, CommandError>;
```
