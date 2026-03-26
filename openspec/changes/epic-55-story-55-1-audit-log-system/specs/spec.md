# Specification: 完整审计日志系统

## 需求来源

### PRD 需求
- **FR600**: 审计日志 - 系统应记录所有关键操作和事件
- **FR601**: 审计追踪 - 支持对操作历史的追踪和查询
- **FR602**: 合规报告 - 支持生成合规所需的审计报告

### 架构约束
- **ADR-023**: 监控与可观测性设计

### UX 规范
- **UX-01**: 核心交互设计原则

### NFR 约束
- **NFR1**: 响应性 - 操作响应时间 < 2s
- **NFR20**: 安全性 - 敏感数据保护
- **NFR23**: 可观测性 - 系统状态可追踪

---

## 功能规格

### 用户故事

**As an** Enterprise Admin,
**I want to** 记录和查询所有 Agent 操作、工具调用、决策过程、数据变更，
**So that** 我可以满足合规要求、快速排查问题、监控安全事件。

### 验收场景

#### Scenario 1: 记录工具调用审计日志
- **GIVEN** 用户通过 Agent 执行工具调用
- **WHEN** 工具调用完成（成功或失败）
- **THEN** 系统记录以下审计日志：
  - 事件类型：`tool_call`
  - 工具名称和参数
  - 执行结果或错误信息
  - 执行时长
  - 操作者信息

#### Scenario 2: 记录 Agent 决策审计日志
- **GIVEN** Agent 执行过程中进行决策
- **WHEN** 决策完成
- **THEN** 系统记录以下审计日志：
  - 事件类型：`decision`
  - 决策类型（意图解析、计划生成、步骤选择等）
  - 推理过程
  - 最终结果
  - 上下文摘要

#### Scenario 3: 查询审计日志
- **GIVEN** 管理员需要查询审计日志
- **WHEN** 管理员设置查询条件（时间范围、事件类型、操作者）
- **THEN** 系统返回符合条件的审计日志列表，支持分页

#### Scenario 4: 导出审计日志
- **GIVEN** 管理员需要导出审计日志
- **WHEN** 管理员选择导出格式（JSON/CSV）和时间范围
- **THEN** 系统生成审计日志文件并提供下载

#### Scenario 5: 定期归档审计日志
- **GIVEN** 审计日志已达到归档条件
- **WHEN** 系统触发归档任务或管理员手动归档
- **THEN** 系统将符合条件的日志归档到压缩文件，并从主表删除

#### Scenario 6: 查询已归档日志
- **GIVEN** 管理员需要查询已归档的审计日志
- **WHEN** 管理员设置查询条件并包含归档日志
- **THEN** 系统从归档文件中查询并返回结果

#### Scenario 7: 数据变更审计追踪
- **GIVEN** Agent 执行数据变更操作
- **WHEN** 数据变更完成
- **THEN** 系统记录以下审计日志：
  - 事件类型：`data_change`
  - 变更操作类型（CREATE/UPDATE/DELETE）
  - 变更前后的值
  - 操作者信息
  - 时间戳

---

## 实现规格

### 输入规格

#### record_audit_event 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| event_type | string | 是 | 枚举值 | agent_action, tool_call, tool_result, decision, data_change, system_event |
| event_level | string | 是 | 枚举值 | DEBUG, INFO, WARN, ERROR, CRITICAL |
| source | string | 是 | 枚举值 | main_agent, sub_agent, tool_executor |
| session_id | string | 否 | UUID 格式 | 会话 ID |
| trace_id | string | 否 | UUID 格式 | 追踪 ID |
| user_id | string | 否 | UUID 格式 | 用户 ID |
| tenant_id | string | 否 | UUID 格式 | 租户 ID |
| content | object | 是 | JSON 对象 | 事件详细内容 |

#### query_audit_logs 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| start_time | number | 否 | Unix timestamp | 开始时间 |
| end_time | number | 否 | Unix timestamp | 结束时间 |
| event_types | string[] | 否 | 枚举值数组 | 事件类型列表 |
| event_levels | string[] | 否 | 枚举值数组 | 事件级别列表 |
| sources | string[] | 否 | 枚举值数组 | 来源列表 |
| session_id | string | 否 | UUID 格式 | 会话 ID |
| user_id | string | 否 | UUID 格式 | 用户 ID |
| keyword | string | 否 | 最大 100 字符 | 关键词搜索 |
| page | number | 否 | 默认 1 | 页码 |
| page_size | number | 否 | 默认 20, 最大 100 | 每页数量 |

#### export_audit_logs 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| start_time | number | 否 | Unix timestamp | 开始时间 |
| end_time | number | 否 | Unix timestamp | 结束时间 |
| event_types | string[] | 否 | 枚举值数组 | 事件类型列表 |
| format | string | 是 | enum | json, csv |

#### trigger_audit_archive 命令

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| before_date | string | 是 | YYYY-MM-DD | 归档此日期之前的日志 |

### 输出规格

#### record_audit_event 响应

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": 1711545600000
  }
}
```

#### query_audit_logs 响应

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "eventType": "tool_call",
        "eventLevel": "INFO",
        "source": "tool_executor",
        "sessionId": "session-123",
        "traceId": "trace-456",
        "userId": "user-789",
        "tenantId": "tenant-001",
        "content": {
          "toolName": "hr_employee_query",
          "input": { "employeeId": "E001" },
          "output": { "name": "张三", "department": "销售部" }
        },
        "createdAt": 1711545600000,
        "archived": false
      }
    ],
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

#### export_audit_logs 响应

```json
{
  "success": true,
  "data": {
    "filePath": "/exports/audit_logs_2024-03-27.json",
    "fileSize": 102400,
    "recordCount": 500,
    "format": "json"
  }
}
```

#### trigger_audit_archive 响应

```json
{
  "success": true,
  "data": {
    "archiveId": "archive-001",
    "archiveDate": "2024-03-01",
    "filePath": "/archives/audit_2024-03-01.json.gz",
    "fileSize": 512000,
    "logCount": 5000,
    "compressed": true,
    "createdAt": 1711545600000
  }
}
```

---

## 边界条件

### 输入边界

| 场景 | 输入 | 预期行为 |
|------|------|----------|
| 空 content | `{}` | 记录成功，content 为空对象 |
| 超大 content | content > 1MB | 返回错误：CONTENT_TOO_LARGE |
| 无效 event_type | `"invalid"` | 返回错误：INVALID_EVENT_TYPE |
| 无效时间范围 | start_time > end_time | 返回错误：INVALID_TIME_RANGE |
| pageSize 超限 | pageSize > 100 | 自动修正为 100 |
| page 为 0 或负数 | page <= 0 | 自动修正为 1 |
| 归档日期在未来 | before_date > today | 返回错误：INVALID_ARCHIVE_DATE |

### 场景边界

| 场景 | 条件 | 预期行为 |
|------|------|----------|
| 查询无结果 | 没有任何匹配的日志 | 返回空列表，total = 0 |
| 导出无结果 | 没有任何日志可导出 | 返回错误：NO_LOGS_TO_EXPORT |
| 归档无结果 | 没有符合条件的日志 | 返回成功，logCount = 0 |
| 并发归档 | 同一时间触发多次归档 | 串行执行，第二次返回错误：ARCHIVE_IN_PROGRESS |
| 写入性能 | 1000 QPS 写入 | 99% 延迟 < 10ms |

---

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | HTTP 状态码 | 处理方式 |
|--------|----------|-------------|----------|
| INVALID_EVENT_TYPE | 无效的事件类型 | 400 | 返回支持的类型列表 |
| INVALID_EVENT_LEVEL | 无效的事件级别 | 400 | 返回支持的级别列表 |
| INVALID_SOURCE | 无效的事件来源 | 400 | 返回支持的来源列表 |
| INVALID_TIME_RANGE | 无效的时间范围 | 400 | 提示 start_time 必须小于 end_time |
| CONTENT_TOO_LARGE | 内容过大 | 400 | 提示 content 最大 1MB |
| INVALID_ARCHIVE_DATE | 无效的归档日期 | 400 | 提示日期格式和限制 |
| NO_LOGS_TO_EXPORT | 没有可导出的日志 | 404 | 提示选择其他时间范围 |
| ARCHIVE_IN_PROGRESS | 归档任务执行中 | 409 | 提示等待或稍后重试 |
| AUDIT_LOG_NOT_FOUND | 审计日志不存在 | 404 | 提示检查 ID 是否正确 |
| DATABASE_ERROR | 数据库错误 | 500 | 记录错误日志，返回通用错误 |
| STORAGE_ERROR | 存储错误 | 500 | 记录错误日志，返回通用错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "INVALID_EVENT_TYPE",
    "message": "无效的事件类型：invalid",
    "details": {
      "supportedTypes": ["agent_action", "tool_call", "tool_result", "decision", "data_change", "system_event"]
    }
  }
}
```

---

## 数据模型

### AuditLog

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| event_type | string | 事件类型 |
| event_level | string | 事件级别 |
| source | string | 来源 |
| session_id | string | 会话 ID |
| trace_id | string | 追踪 ID |
| user_id | string | 用户 ID |
| tenant_id | string | 租户 ID |
| content | JSON | 事件内容 |
| created_at | number | 创建时间戳 |
| archived | boolean | 是否已归档 |

### AuditContent 结构

```typescript
interface AuditContent {
  action: string;           // 操作名称
  description?: string;      // 描述
  inputData?: object;       // 输入数据
  outputData?: object;      // 输出数据
  metadata?: object;         // 元数据
  error?: object;           // 错误信息
  durationMs?: number;      // 执行时长
}
```

---

## 性能要求

| 指标 | 要求 |
|------|------|
| 写入延迟（P99） | < 10ms |
| 查询延迟（P99） | < 500ms |
| 导出延迟 | < 30s（10000 条记录） |
| 并发写入 QPS | >= 1000 |
| 存储增长 | < 100MB/天（正常负载） |
