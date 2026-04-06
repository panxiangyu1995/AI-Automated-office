# Specification: Agent Tools Integration

## Requirements Source

### Architecture Constraints

引用 `src-tauri/src/agent/tools/` 目录结构设计：
- 工具系统采用模块化架构
- 每个工具模块有独立的 `mod.rs` 进行注册
- 通过 `pipeline.rs` 统一执行

### Tool Registry

引用 `registry.rs` 中的注册机制：
- `ToolRegistry` 提供工具注册和查询
- `ToolExecutor` trait 定义执行接口
- 每个工具需要对应的 `ToolDescriptor`

### Profile System

引用 `profile.rs` 中的 Profile 工具筛选：
- `MINIMAL_TOOLS`: 最小工具集
- `CODING_TOOLS`: 编码场景工具集
- `MESSAGING_TOOLS`: 消息场景工具集
- `FULL_TOOLS`: 全功能工具集

## Functional Specifications

### 1. Module Registration

#### Memory Module

| 工具 ID | 名称 | 描述 | 执行模式 |
|---------|------|------|----------|
| `memory_search` | Memory Search | 语义搜索记忆内容 | Async |
| `memory_get` | Memory Get | 按 ID 获取记忆详情 | Sync |

#### Sessions Module

| 工具 ID | 名称 | 描述 | 执行模式 |
|---------|------|------|----------|
| `sessions_list` | Sessions List | 列出可用会话 | Sync |
| `sessions_history` | Sessions History | 获取会话历史 | Sync |
| `sessions_send` | Sessions Send | 发送消息到会话 | Async |
| `sessions_spawn` | Sessions Spawn | 派生子 Agent | Async |
| `sessions_yield` | Sessions Yield | 控制权让渡 | Async |
| `session_status` | Session Status | 会话状态查询 | Sync |

#### Media Module

| 工具 ID | 名称 | 描述 | 执行模式 |
|---------|------|------|----------|
| `image_understand` | Image Understand | 图片内容理解 | Async |
| `tts_speak` | TTS Speak | 文本转语音 | Async |

#### Automation Module

| 工具 ID | 名称 | 描述 | 执行模式 |
|---------|------|------|----------|
| `cron_schedule` | Cron Schedule | 调度定时任务 | Async |
| `cron_list` | Cron List | 列出定时任务 | Sync |
| `cron_cancel` | Cron Cancel | 取消定时任务 | Sync |

### 2. Input Specifications

#### memory_search

```json
{
  "query": "string (required)",
  "max_results": "number (default: 5, max: 100)",
  "min_score": "number (optional, 0.0-1.0)",
  "sources": "array (optional, enum: memory/sessions/knowledge)",
  "date_range": "object (optional, { from, to })",
  "include_metadata": "boolean (default: true)"
}
```

#### sessions_list

```json
{
  "visibility": "string (default: tree, enum: self/tree/agent/all)",
  "limit": "number (default: 20, max: 100)",
  "include_subagents": "boolean (default: true)",
  "status_filter": "string (optional)"
}
```

#### image_understand

```json
{
  "image_url": "string (optional)",
  "image_data": "string (optional, base64)",
  "prompt": "string (required)",
  "model": "string (optional)"
}
```

#### tts_speak

```json
{
  "text": "string (required)",
  "voice": "string (optional)",
  "speed": "number (optional, default: 1.0)",
  "format": "string (optional, default: mp3)"
}
```

#### cron_schedule

```json
{
  "name": "string (required)",
  "cron_expression": "string (required, cron format)",
  "task": "object (required, { type, params })",
  "enabled": "boolean (default: true)"
}
```

### 3. Output Specifications

#### memory_search

```json
{
  "query": "string",
  "results": [
    {
      "id": "string",
      "content": "string",
      "source": "string",
      "score": "number",
      "metadata": "object",
      "created_at": "number"
    }
  ],
  "total": "number",
  "duration_ms": "number"
}
```

#### sessions_list

```json
{
  "sessions": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "created_at": "number",
      "updated_at": "number",
      "parent_id": "string",
      "is_subagent": "boolean"
    }
  ],
  "total": "number",
  "duration_ms": "number"
}
```

### 4. Error Handling

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| `ValidationError` | 参数校验失败 | 返回错误详情，允许客户端修正 |
| `PermissionDenied` | 权限不足 | 提示用户申请权限 |
| `NotFound` | 资源不存在 | 返回友好提示 |
| `Timeout` | 执行超时 | 可重试 |
| `ExecutionError` | 执行失败 | 返回错误详情 |

### 5. Security

#### Permissions

| 权限 | 描述 |
|------|------|
| `memory:read` | 读取记忆 |
| `memory:write` | 写入记忆 |
| `sessions:read` | 读取会话 |
| `sessions:write` | 写入会话 |
| `sessions:admin` | 管理会话（创建/销毁） |
| `media:read` | 读取媒体 |
| `media:write` | 写入媒体 |
| `automation:read` | 读取定时任务 |
| `automation:write` | 管理定时任务 |

#### Confirmation Requirements

需要用户确认的操作：
- `sessions_send` - 发送消息
- `sessions_spawn` - 创建子代理
- `sessions_yield` - 让渡控制权
- `cron_cancel` - 取消任务

## Acceptance Scenarios

### Scenario 1: 模块注册验证

- **GIVEN** 所有新模块已实现
- **WHEN** 应用启动时加载工具系统
- **THEN** `ToolRegistry.list()` 返回所有新工具的描述符

### Scenario 2: Profile 工具筛选

- **GIVEN** 工具已注册到各 Profile
- **WHEN** 使用 `coding` Profile 执行工具
- **THEN** 只返回 `coding` Profile 允许的工具列表

### Scenario 3: 权限检查

- **GIVEN** 用户没有 `sessions:admin` 权限
- **WHEN** 调用 `sessions_spawn` 工具
- **THEN** 返回 `PermissionDenied` 错误

### Scenario 4: 工具执行

- **GIVEN** 工具已注册且用户有权限
- **WHEN** 调用 `memory_search` 工具
- **THEN** 返回语义搜索结果

### Scenario 5: 错误处理

- **GIVEN** 传入无效参数
- **WHEN** 调用任何工具
- **THEN** 返回 `ValidationError` 错误码和详细信息
