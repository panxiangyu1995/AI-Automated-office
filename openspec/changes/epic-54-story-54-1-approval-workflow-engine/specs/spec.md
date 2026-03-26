# Specification: 审批中心完整实现 - 流程引擎

## 需求来源

### PRD 需求
| 需求编号 | 需求描述 |
|----------|----------|
| FR500 | 审批中心应支持自定义审批流程模板配置 |
| FR501 | 审批中心应支持审批状态自动流转 |
| FR502 | 审批中心应支持审批历史记录追溯 |

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

**As an** Epic 54 user (企业管理员/审批人/申请人),
**I want to** 使用审批中心的完整流程引擎来管理审批流程,
**So that I can** 实现审批流程的可配置化、状态的自动流转、以及完整的审计追溯。

### 核心能力

1. **流程定义管理**: 创建、编辑、删除审批流程模板
2. **审批实例管理**: 发起审批、查询审批状态、处理审批
3. **状态流转控制**: 自动在各个审批节点之间流转
4. **历史记录追溯**: 完整记录所有审批操作

---

## 输入输出规格

### 数据模型定义

#### ApprovalFlowDef (审批流程定义)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式，长度 36 |
| name | string | 是 | 流程名称 | 长度 1-100，非空 |
| description | string | 否 | 流程描述 | 长度 0-500 |
| flow_config | FlowConfig | 是 | 流程配置 | 见下方定义 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |

#### FlowConfig (流程配置)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| nodes | NodeDef[] | 是 | 节点列表 | 至少包含 start 和 end 节点 |
| edges | EdgeDef[] | 是 | 边列表 | 连接形成有效有向图 |

#### NodeDef (节点定义)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 节点唯一标识 | 非空字符串 |
| name | string | 是 | 节点名称 | 长度 1-50 |
| node_type | NodeType | 是 | 节点类型 | enum: Start/End/Task/Condition |
| approvers | string[] | 是 | 审批人 ID 列表 | 至少包含一个元素 |
| approval_type | ApprovalType | 是 | 审批类型 | enum: Serial/Parallel |

#### EdgeDef (边定义)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| from | string | 是 | 起始节点 ID | 必须对应存在的节点 |
| to | string | 是 | 目标节点 ID | 必须对应存在的节点 |
| condition | string | 否 | 流转条件 | 条件表达式字符串 |

#### ApprovalInstance (审批实例)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式，长度 36 |
| flow_def_id | string | 是 | 关联的流程定义 ID | 必须对应存在的流程定义 |
| title | string | 是 | 审批标题 | 长度 1-200 |
| applicant_id | string | 是 | 申请人 ID | 非空 |
| status | ApprovalStatus | 是 | 当前状态 | enum |
| current_node_id | string | 否 | 当前节点 ID | 审批中时有值 |
| context_data | string | 否 | 业务上下文数据 | JSON 格式字符串 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |

#### ApprovalStatus (审批状态枚举)

| 值 | 描述 | 有效转换 |
|----|------|----------|
| Pending | 待审批 | → InProgress, Cancelled |
| InProgress | 审批中 | → Approved, Rejected, Cancelled |
| Approved | 已通过 | (终态) |
| Rejected | 已拒绝 | (终态) |
| Cancelled | 已取消 | (终态) |

#### ApprovalNodeInstance (审批节点实例)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| instance_id | string | 是 | 关联的审批实例 ID | 必须对应存在的实例 |
| node_def_id | string | 是 | 对应的节点定义 ID | 非空 |
| approver_id | string | 是 | 当前审批人 ID | 非空 |
| status | ApprovalStatus | 是 | 节点状态 | enum |
| result | string | 否 | 审批结果 | Approve/Reject |
| comment | string | 否 | 审批意见 | 长度 0-1000 |
| created_at | string | 是 | 创建时间 | ISO 8601 格式 |
| updated_at | string | 是 | 更新时间 | ISO 8601 格式 |

#### ApprovalHistory (审批历史)

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| id | string | 是 | 唯一标识符 | UUID 格式 |
| instance_id | string | 是 | 关联的审批实例 ID | 必须对应存在的实例 |
| action | string | 是 | 操作类型 | create/submit/approve/reject/cancel |
| operator_id | string | 是 | 操作人 ID | 非空 |
| from_status | string | 否 | 转换前状态 | ApprovalStatus 字符串 |
| to_status | string | 否 | 转换后状态 | ApprovalStatus 字符串 |
| comment | string | 否 | 操作备注 | 长度 0-1000 |
| created_at | string | 是 | 操作时间 | ISO 8601 格式 |

---

## API 规格

### 创建审批流程定义

**命令**: `create_approval_flow`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | string | 是 | 流程名称 |
| description | string | 否 | 流程描述 |
| flow_config | FlowConfig | 是 | 流程配置 |

**返回值**: `ApprovalFlowDef`

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_FLOW_NAME_EMPTY | 流程名称不能为空 | 提示用户输入流程名称 |
| ERR_FLOW_CONFIG_INVALID | 流程配置无效 | 提示用户检查流程配置 |
| ERR_DATABASE_ERROR | 数据库错误 | 记录日志，返回通用错误 |

### 获取审批流程定义

**命令**: `get_approval_flow`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| flow_def_id | string | 是 | 流程定义 ID |

**返回值**: `ApprovalFlowDef`

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_FLOW_NOT_FOUND | 流程定义不存在 | 提示用户流程不存在 |

### 列出所有审批流程定义

**命令**: `list_approval_flows`

**返回值**: `ApprovalFlowDef[]`

### 创建审批实例

**命令**: `create_approval_instance`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| flow_def_id | string | 是 | 流程定义 ID |
| title | string | 是 | 审批标题 |
| applicant_id | string | 是 | 申请人 ID |
| context_data | string | 否 | 业务上下文数据 |

**返回值**: `ApprovalInstance`

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_FLOW_NOT_FOUND | 流程定义不存在 | 提示用户检查流程 ID |
| ERR_INVALID_CONTEXT | 业务上下文数据无效 | 提示用户检查 JSON 格式 |

### 提交审批

**命令**: `submit_approval`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| instance_id | string | 是 | 审批实例 ID |
| node_instance_id | string | 是 | 节点实例 ID |
| approver_id | string | 是 | 审批人 ID |
| result | ApprovalResult | 是 | 审批结果 |
| comment | string | 否 | 审批意见 |

**返回值**: `ApprovalInstance`

**错误码**:
| 错误码 | 描述 | 处理方式 |
|--------|------|----------|
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | 提示用户检查实例 ID |
| ERR_INVALID_STATE | 当前状态不允许此操作 | 提示用户检查审批状态 |
| ERR_NOT_AUTHORIZED | 无审批权限 | 提示用户没有审批权限 |
| ERR_ALREADY_PROCESSED | 该节点已处理 | 提示用户节点已处理 |

### 获取审批历史

**命令**: `get_approval_history`

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| instance_id | string | 是 | 审批实例 ID |

**返回值**: `ApprovalHistory[]`

---

## 验收场景 (Given-When-Then 格式)

### Scenario 1: 创建审批流程定义

**Given** 用户已登录系统并具有流程管理权限
**And** 系统中存在有效的流程配置（包含 start、task、end 节点）
**When** 用户调用 `create_approval_flow` 命令，传入流程名称、描述和流程配置
**Then** 系统创建审批流程定义并返回包含完整信息的 `ApprovalFlowDef` 对象
**And** 数据库中新增一条 `approval_flow_def` 记录

### Scenario 2: 启动审批流程实例

**Given** 存在已创建的审批流程定义
**And** 用户具有发起审批的权限
**When** 用户调用 `create_approval_instance` 命令，传入流程定义 ID、标题和申请人 ID
**Then** 系统创建审批实例，状态为 `Pending`
**And** 系统自动提交到第一个审批节点，状态变为 `InProgress`
**And** 数据库中新增审批实例记录和节点实例记录

### Scenario 3: 审批通过（单节点）

**Given** 存在状态为 `InProgress` 的审批实例
**And** 当前用户是被指定的审批人
**When** 用户调用 `submit_approval` 命令，传入 `result: Approve`
**Then** 系统更新实例状态为 `Approved`
**And** 系统记录审批历史
**And** 返回更新后的 `ApprovalInstance`

### Scenario 4: 审批通过（多节点流转）

**Given** 存在状态为 `InProgress` 的审批实例，当前节点不是最后一个
**And** 当前用户是被指定的审批人
**When** 用户调用 `submit_approval` 命令，传入 `result: Approve`
**Then** 系统创建下一节点的实例
**And** 系统更新实例状态仍为 `InProgress`，`current_node_id` 更新为下一节点
**And** 系统记录审批历史
**And** 返回更新后的 `ApprovalInstance`

### Scenario 5: 审批拒绝

**Given** 存在状态为 `InProgress` 的审批实例
**And** 当前用户是被指定的审批人
**When** 用户调用 `submit_approval` 命令，传入 `result: Reject`
**Then** 系统更新实例状态为 `Rejected`
**And** `current_node_id` 置为 null
**And** 系统记录审批历史
**And** 返回更新后的 `ApprovalInstance`

### Scenario 6: 审批取消

**Given** 存在状态为 `Pending` 或 `InProgress` 的审批实例
**And** 当前用户是申请人或系统管理员
**When** 用户调用 `submit_approval` 命令，传入 `result: Cancel`
**Then** 系统更新实例状态为 `Cancelled`
**And** `current_node_id` 置为 null
**And** 系统记录审批历史
**And** 返回更新后的 `ApprovalInstance`

### Scenario 7: 查询审批历史

**Given** 存在已创建的审批实例
**When** 用户调用 `get_approval_history` 命令，传入实例 ID
**Then** 系统返回按时间升序排列的审批历史列表
**And** 列表中包含所有状态变更和审批操作记录

### Scenario 8: 非法状态转换

**Given** 存在状态为 `Approved` 的审批实例（终态）
**When** 用户调用 `submit_approval` 命令
**Then** 系统返回错误码 `ERR_INVALID_STATE`
**And** 实例状态保持不变

### Scenario 9: 无权限审批

**Given** 存在状态为 `InProgress` 的审批实例
**And** 当前用户不是被指定的审批人
**When** 用户调用 `submit_approval` 命令
**Then** 系统返回错误码 `ERR_NOT_AUTHORIZED`
**And** 实例状态保持不变

---

## 错误码定义

| 错误码 | 错误信息 | 错误类型 | 处理方式 |
|--------|----------|----------|----------|
| ERR_FLOW_NAME_EMPTY | 流程名称不能为空 | ValidationError | 前端提示用户输入流程名称 |
| ERR_FLOW_NAME_TOO_LONG | 流程名称过长（最大100字符） | ValidationError | 前端限制输入长度 |
| ERR_FLOW_CONFIG_INVALID | 流程配置无效 | ValidationError | 提示用户检查流程配置，确保包含 start 和 end 节点 |
| ERR_FLOW_NOT_FOUND | 流程定义不存在 | NotFoundError | 提示用户检查流程 ID |
| ERR_INSTANCE_NOT_FOUND | 审批实例不存在 | NotFoundError | 提示用户检查实例 ID |
| ERR_INVALID_STATE | 当前状态不允许此操作 | StateError | 提示用户检查审批状态 |
| ERR_NOT_AUTHORIZED | 无审批权限 | AuthError | 提示用户没有审批权限 |
| ERR_ALREADY_PROCESSED | 该节点已处理 | ConflictError | 提示用户节点已处理 |
| ERR_INVALID_CONTEXT | 业务上下文数据无效 | ValidationError | 提示用户检查 JSON 格式 |
| ERR_DATABASE_ERROR | 数据库错误 | SystemError | 记录日志，返回通用错误信息 |
| ERR_INTERNAL_ERROR | 内部错误 | SystemError | 记录详细日志，返回通用错误信息 |

---

## 边界条件

### 数据边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 空流程名称 | name 参数为空字符串 | 返回 ERR_FLOW_NAME_EMPTY |
| 超长流程名称 | name 参数超过 100 字符 | 返回 ERR_FLOW_NAME_TOO_LONG |
| 空节点列表 | flow_config.nodes 为空 | 返回 ERR_FLOW_CONFIG_INVALID |
| 缺少 start 节点 | 节点列表中无 start 类型节点 | 返回 ERR_FLOW_CONFIG_INVALID |
| 缺少 end 节点 | 节点列表中无 end 类型节点 | 返回 ERR_FLOW_CONFIG_INVALID |
| 无效的节点引用 | edges 中引用了不存在的节点 | 返回 ERR_FLOW_CONFIG_INVALID |
| 超大上下文数据 | context_data 超过 1MB | 返回 ERR_INVALID_CONTEXT |
| 超长审批意见 | comment 超过 1000 字符 | 前端限制输入长度 |

### 状态边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 重复提交审批 | 同一节点重复提交 | 返回 ERR_ALREADY_PROCESSED |
| 终态转换 | 从 Approved/Rejected/Cancelled 转换 | 返回 ERR_INVALID_STATE |
| 并行节点全部未通过 | 并行节点中任一拒绝 | 整个审批实例拒绝 |
| 超时未审批 | 审批超时（可配置） | 可发送催办通知（后续迭代） |

### 并发边界

| 边界条件 | 描述 | 处理方式 |
|----------|------|----------|
| 并发提交审批 | 两个审批人同时提交同一节点 | 使用数据库事务，后到的返回 ERR_ALREADY_PROCESSED |
| 并发取消审批 | 提交审批的同时取消审批 | 事务隔离，后者根据结果处理 |

---

## 性能规格

| 指标 | 要求 | 说明 |
|------|------|------|
| 审批实例查询响应时间 | < 200ms | 单条实例查询 |
| 流程定义列表响应时间 | < 500ms | 列表查询 |
| 状态流转处理时间 | < 100ms | 单次状态转换 |
| 历史记录查询响应时间 | < 300ms | 单实例历史查询 |
| 数据库连接池大小 | 10-50 | 可配置 |

---

## 兼容性考虑

### 向后兼容
- 新增字段需设置默认值，不影响已有数据
- 状态枚举扩展时需考虑已有代码处理

###  API 版本
- 当前版本为 v1
- 未来如需 breaking change，应创建 v2 版本 API
