# Specification: 审批中心 - Agent集成

## 需求来源

### PRD 需求
| 需求编号 | 需求描述 |
|----------|----------|
| FR503 | Agent 应能自动识别需要审批的业务场景 |
| FR504 | Agent 应能自动创建审批请求并填写相关内容 |
| FR505 | Agent 应能处理审批结果并执行业务操作 |

### 架构约束
| ADR 编号 | 约束描述 |
|----------|----------|
| ADR-025 | 业务模块应遵循分层微内核架构 |
| ADR-037 | 工具命名应遵循 `{plugin}_{entity}_{action}` 格式 |

### UX 规范
| UX 编号 | 约束描述 |
|---------|----------|
| UX-01 | 应使用 Ant Design 组件 |
| UX-04 | 应遵循 VSCode 风格四栏布局 |

---

## 功能规格

### 用户故事

**As an** Epic 54 user (业务操作员/审批人),
**I want to** 通过自然语言与 Agent 交互来完成审批相关操作,
**So that I can** 快速发起审批、查询状态、处理审批，无需手动操作界面。

---

## 工具规格

### 工具列表

| 工具名称 | 功能 | 权限要求 |
|----------|------|----------|
| approval_create | 创建审批请求 | 已认证用户 |
| approval_query | 查询审批详情 | 已认证用户 |
| approval_query_by_applicant | 查询我发起的审批 | 已认证用户 |
| approval_query_pending | 查询待我审批的列表 | 已认证用户（审批人角色） |
| approval_approve | 审批通过 | 已认证用户（审批人角色） |
| approval_reject | 审批拒绝 | 已认证用户（审批人角色） |
| approval_cancel | 取消审批 | 已认证用户（申请人或管理员） |

---

## 输入输出规格

### approval_create

**描述**: 创建新的审批请求

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| flow_def_id | string | 是 | 审批流程定义 ID | 非空，必须对应存在的流程定义 |
| title | string | 是 | 审批标题 | 长度 1-200，非空 |
| context_data | object | 否 | 业务上下文数据 | JSON 格式对象 |

**返回值**:
```json
{
  "success": true,
  "instance_id": "string",
  "status": "pending|in_progress",
  "message": "string"
}
```

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_FLOW_NOT_FOUND | 流程定义不存在 | 提示用户检查流程 ID |
| ERR_INVALID_TITLE | 标题无效 | 提示用户输入有效标题 |
| ERR_INVALID_CONTEXT | 上下文数据无效 | 提示用户检查 JSON 格式 |

---

### approval_query

**描述**: 查询审批请求的状态和详情

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| instance_id | string | 是 | 审批实例 ID | 非空 |

**返回值**:
```json
{
  "success": true,
  "instance": {
    "id": "string",
    "flow_def_id": "string",
    "title": "string",
    "applicant_id": "string",
    "status": "pending|in_progress|approved|rejected|cancelled",
    "current_node_id": "string|null",
    "current_node_name": "string|null",
    "context_data": "object|null",
    "created_at": "string",
    "updated_at": "string"
  }
}
```

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | 提示用户检查实例 ID |

---

### approval_query_by_applicant

**描述**: 查询申请人提交的所有审批请求

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| status | string | 否 | 筛选状态 | pending/in_progress/approved/rejected/cancelled |
| limit | number | 否 | 返回数量限制 | 默认 10，最大 100 |

**返回值**:
```json
{
  "success": true,
  "instances": [
    {
      "id": "string",
      "title": "string",
      "status": "string",
      "current_node_name": "string|null",
      "created_at": "string"
    }
  ],
  "total": "number"
}
```

---

### approval_query_pending

**描述**: 查询当前用户需要处理的待审批列表

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| limit | number | 否 | 返回数量限制 | 默认 10，最大 100 |

**返回值**:
```json
{
  "success": true,
  "instances": [
    {
      "id": "string",
      "title": "string",
      "applicant_name": "string",
      "node_name": "string",
      "created_at": "string"
    }
  ],
  "total": "number"
}
```

---

### approval_approve

**描述**: 审批通过

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| instance_id | string | 是 | 审批实例 ID | 非空 |
| node_instance_id | string | 是 | 节点实例 ID | 非空 |
| comment | string | 否 | 审批意见 | 长度 0-1000 |

**返回值**:
```json
{
  "success": true,
  "status": "in_progress|approved",
  "next_node": "string|null",
  "message": "string"
}
```

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | 提示用户检查实例 ID |
| ERR_INVALID_STATE | 当前状态不允许此操作 | 提示用户检查审批状态 |
| ERR_NOT_AUTHORIZED | 无审批权限 | 提示用户没有审批权限 |
| ERR_ALREADY_PROCESSED | 该节点已处理 | 提示用户节点已处理 |

---

### approval_reject

**描述**: 审批拒绝

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| instance_id | string | 是 | 审批实例 ID | 非空 |
| node_instance_id | string | 是 | 节点实例 ID | 非空 |
| reason | string | 是 | 拒绝原因 | 长度 1-1000 |

**返回值**:
```json
{
  "success": true,
  "status": "rejected",
  "message": "string"
}
```

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | 提示用户检查实例 ID |
| ERR_INVALID_STATE | 当前状态不允许此操作 | 提示用户检查审批状态 |
| ERR_NOT_AUTHORIZED | 无审批权限 | 提示用户没有审批权限 |
| ERR_REASON_REQUIRED | 拒绝原因必填 | 提示用户输入拒绝原因 |

---

### approval_cancel

**描述**: 取消审批

| 参数 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| instance_id | string | 是 | 审批实例 ID | 非空 |
| reason | string | 否 | 取消原因 | 长度 0-500 |

**返回值**:
```json
{
  "success": true,
  "status": "cancelled",
  "message": "string"
}
```

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | 提示用户检查实例 ID |
| ERR_INVALID_STATE | 当前状态不允许取消 | 提示用户当前状态无法取消 |
| ERR_NOT_AUTHORIZED | 无取消权限 | 提示用户只有申请人或管理员可以取消 |

---

## 验收场景 (Given-When-Then 格式)

### Scenario 1: Agent 自动识别审批意图

**Given** 用户在 Agent 对话中输入"我想申请一笔差旅费用报销"
**When** Agent 解析用户输入，识别到 `create_approval` 意图
**Then** Agent 提取实体：flow_def_id（差旅报销流程）、title（差旅费用报销）
**And** 如果缺少 context_data，Agent 询问用户补充信息
**And** 用户确认后，Agent 调用 `approval_create` 工具

### Scenario 2: Agent 自动创建审批

**Given** Agent 已识别到用户的审批需求，且所有必填参数已收集完毕
**When** Agent 调用 `approval_create` 工具
**Then** 系统创建审批实例并返回 instance_id
**And** Agent 向用户确认："您的报销申请已提交，等待部门经理审批"
**And** 审批状态自动添加到 Agent 上下文

### Scenario 3: Agent 查询审批状态

**Given** 用户在 Agent 对话中输入"我的报销申请审批到哪一步了"
**When** Agent 解析用户输入，识别到 `query_approval` 意图
**Then** Agent 尝试从上下文中获取 instance_id
**And** 如果找不到，询问用户提供审批实例 ID
**And** 如果找到，Agent 调用 `approval_query` 工具
**And** Agent 使用 `generateStatusMessage` 生成自然语言反馈

### Scenario 4: Agent 处理审批通过

**Given** 用户是被指定的审批人，且有待审批的请求
**When** 用户输入"同意小明的报销申请"
**And** Agent 识别到 `approve` 意图
**Then** Agent 调用 `approval_approve` 工具
**And** 返回审批结果和下一节点信息
**And** Agent 向用户确认："已批准小明的报销申请，等待财务审批"

### Scenario 5: Agent 处理审批拒绝

**Given** 用户是被指定的审批人，且有待审批的请求
**When** 用户输入"这个报销金额超出预算，拒绝"
**And** Agent 识别到 `reject` 意图
**Then** Agent 调用 `approval_reject` 工具
**And** 返回审批结果
**And** Agent 向用户确认："已拒绝该报销申请，申请人将收到通知"
**And** 系统通知申请人审批结果

### Scenario 6: 查询待审批列表

**Given** 用户具有审批人角色
**When** 用户输入"看看有哪些待我审批的"
**And** Agent 识别到 `query_pending` 意图
**Then** Agent 调用 `approval_query_pending` 工具
**And** Agent 使用 `generatePendingMessage` 生成自然语言列表
**And** Agent 展示审批请求摘要供用户选择

### Scenario 7: 审批状态上下文同步

**Given** 用户有进行中的审批请求
**When** 审批状态发生变化（如被审批通过或拒绝）
**Then** Agent 上下文中的 `approvalContext` 自动更新
**And** Agent 在下次对话时主动通知用户状态变化
**And** 用户可以通过自然语言查询最新状态

### Scenario 8: 无权限调用工具

**Given** 用户尝试执行 `approval_approve` 操作
**And** 当前用户不是该节点的指定审批人
**When** Agent 调用 `approval_approve` 工具
**Then** 系统返回 `ERR_NOT_AUTHORIZED` 错误
**And** Agent 向用户说明："您没有此审批权限"

### Scenario 9: 重复审批处理

**Given** 用户已经对某个节点进行了审批
**When** 用户再次尝试审批同一节点
**Then** 系统返回 `ERR_ALREADY_PROCESSED` 错误
**And** Agent 向用户说明："该节点已处理，请刷新查看最新状态"

---

## 错误码定义

| 错误码 | 错误信息 | 错误类型 | 处理方式 |
|--------|----------|----------|----------|
| ERR_FLOW_NOT_FOUND | 流程定义不存在 | NotFoundError | 提示用户检查流程 ID，提供可用的流程列表 |
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | NotFoundError | 提示用户检查实例 ID |
| ERR_INVALID_TITLE | 标题无效 | ValidationError | 提示用户输入有效标题 |
| ERR_INVALID_CONTEXT | 上下文数据无效 | ValidationError | 提示用户检查 JSON 格式 |
| ERR_INVALID_STATE | 当前状态不允许此操作 | StateError | 提示用户检查审批状态 |
| ERR_NOT_AUTHORIZED | 无审批权限 | AuthError | 提示用户没有审批权限 |
| ERR_ALREADY_PROCESSED | 该节点已处理 | ConflictError | 提示用户节点已处理，刷新查看 |
| ERR_REASON_REQUIRED | 拒绝原因必填 | ValidationError | 提示用户输入拒绝原因 |
| ERR_DATABASE_ERROR | 数据库错误 | SystemError | 记录日志，返回通用错误信息 |

---

## 边界条件

### 意图识别边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 意图模糊 | 用户表达不明确，无法确定意图 | 询问用户确认意图 |
| 多意图 | 用户一句话包含多个意图 | 分解为多个工具调用 |
| 缺失实体 | 意图已识别但缺少必填实体 | 询问用户补充信息 |
| 实体歧义 | 实体值有歧义（如多个同名流程） | 列出选项供用户选择 |

### 工具调用边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 工具超时 | 工具调用超过预设时间 | 返回超时错误，提供重试选项 |
| 工具并发 | 同一用户同时调用多个工具 | 使用队列顺序处理 |
| 工具降级 | 工具不可用时 | 返回友好错误，说明原因 |

### 状态同步边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 状态延迟 | 审批状态变更有延迟 | 显示"状态可能有延迟，请稍后刷新" |
| 并发更新 | 状态在查询和展示之间发生变化 | 重新查询最新状态 |
| 状态丢失 | Agent 上下文中的状态丢失 | 自动从数据库同步 |

---

## 性能规格

| 指标 | 要求 | 说明 |
|------|------|------|
| 工具调用响应时间 | < 500ms | 包括工具执行和结果返回 |
| 意图识别响应时间 | < 200ms | 纯意图解析，不含工具执行 |
| 状态同步延迟 | < 1s | 审批状态变更到 Agent 感知 |
| 并发工具调用 | 支持 10+ 并发 | 工具注册表支持并发访问 |

---

## 意图识别配置

### 模式定义

```typescript
const approvalIntentPatterns = {
  create_approval: [
    /申请(.*)审批/,
    /需要(.*)的审批/,
    /提交(.*)审批/,
    /我想申请(.*)/,
    /帮我审批(.*)/,
    /(.*)申请需要(.*)审批/,
  ],
  query_approval: [
    /查询(.*)审批状态/,
    /(.*)审批进行到(.*)了/,
    /我的(.*)审批(.*)/,
    /(.*)审批结果/,
    /(.*)审批到哪一步/,
    /看看(.*)审批/,
  ],
  approve: [
    /同意(.*)/,
    /通过(.*)审批/,
    /审批通过/,
    /批准(.*)/,
    /可以(.*)/,
    /没问题(.*)/,
  ],
  reject: [
    /拒绝(.*)审批/,
    /不同意(.*)/,
    /驳回(.*)/,
    /不行(.*)/,
    /不符合(.*)/,
  ],
  cancel: [
    /取消(.*)审批/,
    /撤回(.*)申请/,
    /不申请了/,
    /撤销(.*)/,
  ],
  query_pending: [
    /待我审批/,
    /需要我审批/,
    /有哪些(.*)待审批/,
    /看看待审批/,
    /我的审批任务/,
  ],
};
```

---

## 兼容性考虑

### 向后兼容
- 工具参数新增可选字段，不影响已有调用
- 工具返回值新增字段，不影响已有解析

### API 版本
- 当前版本为 v1
- 未来如需 breaking change，应创建 v2 版本 API
