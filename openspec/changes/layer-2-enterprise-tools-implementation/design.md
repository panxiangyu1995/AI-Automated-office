## Context

**背景**: Layer 1 核心工具提供基础自动化能力（文件系统、Shell、Web、浏览器），Layer 2 企业工具在核心工具之上提供资源管理、知识库访问、消息系统和数据库查询等企业级能力。

**依赖关系**:
- Layer 2 工具依赖 Layer 1 的 http_request 和 filesystem 工具
- resource_upload 需要调用云端存储服务
- knowledge_query 依赖现有 RAG 系统
- messaging 依赖现有消息系统
- db_query 需要数据库连接和权限控制

## Goals / Non-Goals

**Goals:**
- 实现 11 个 Layer 2 企业工具，分为 5 组
- 集成现有存储、消息和知识库服务
- `db_query` 作为受限工具，仅管理员可用
- 工具复用现有业务逻辑，不重复实现

**Non-Goals:**
- 不实现 Layer 3 部门工具
- 不实现新的存储/消息/知识库后端（复用现有）
- 不开放 db_query 给普通用户

## Decisions

### Decision 1: 工具实现模式

**选择**: 业务工具调用现有 Service 层，不重复实现业务逻辑

```
Agent Tool → ToolExecutor → Service Layer (已有)
                              ↓
                         HR Service
                         Sales Service
                         Finance Service
                         Knowledge Service
                         Message Service
```

**理由**: 遵循 DRY 原则，避免业务逻辑重复。

### Decision 2: Resource 工具架构

**选择**: 统一资源抽象，支持本地和云端

```rust
enum ResourceLocation {
    Local(PathBuf),
    Cloud { bucket: String, key: String },
    Workspace { page_id: String },
}

trait ResourceService {
    async fn query(&self, loc: ResourceLocation) -> Result<ResourceMeta>;
    async fn upload(&self, data: Bytes, dest: ResourceLocation) -> Result<()>;
}
```

### Decision 3: Knowledge 工具集成

**选择**: 复用现有 knowledge-base RAG 服务

```rust
// knowledge_query 映射到 RAG Service
rag_service.retrieve(query, top_k, filters)

// knowledge_submit_draft 映射到 Knowledge Entry API
knowledge_api.create_entry(draft, author_id)
```

### Decision 4: Messaging 工具设计

**选择**: 支持 Agent 间消息和任务委派

```rust
// message_send 支持多种目标
enum MessageTarget {
    User(user_id),
    Agent(agent_id),
    Department(dept_id),
    Channel(channel_id),
}

// agent_delegate 创建 SubAgent 任务
delegate_task(agent_config, task_spec, parent_session)
```

### Decision 5: Database 查询安全

**选择**: 严格受限，仅管理员可用 + 白名单表

```rust
struct DbQueryConfig {
    allowed_tables: Vec<&'static str>,  // 白名单表
    max_rows: u32,                       // 最大返回行数
    timeout_seconds: u64,                // 超时限制
    require_admin: bool,                 // 必须管理员权限
}

// 权限检查
fn check_db_permission(ctx: &ToolExecutionContext) -> Result<()> {
    if ctx.permissions.contains("admin") {
        Ok(())
    } else {
        Err(ToolError::PermissionDenied)
    }
}
```

### Decision 6: Workspace 暂存工具

**选择**: 集成现有 workbench 模块

```rust
// workspace_stage_change 映射到 Editor Host
editor_host.stage_changes(page_id, changes)
```

## Risks / Trade-offs

| 风险 | 描述 | 缓解措施 |
|------|------|---------|
| db_query 权限泄露 | 可能被滥用查询敏感数据 | 严格权限检查 + 审计日志 + 白名单表 |
| 循环委派 | agent_delegate 可能导致死循环 | 委派深度限制 + TTL |
| 知识库污染 | 错误草稿影响 RAG 质量 | 草稿需审核流程 |
| 云端依赖 | resource 工具依赖云端服务 | 本地降级 + 离线队列 |

## Open Questions

1. **db_query 表白名单**: 具体哪些表允许查询？需要与架构组确认
2. **知识草稿审核流程**: submit_draft 后是否需要人工审核？
3. **agent_delegate 深度限制**: 最大委派深度设为多少？
