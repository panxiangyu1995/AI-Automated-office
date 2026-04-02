# business-never-compress

## ADDED Requirements

### Requirement: Never Compress 类型定义

系统 SHALL 定义以下业务实体类型为永不压缩：

```typescript
const NEVER_COMPRESS_TYPES = {
  // 用户明确指定
  user_explicit_reference: {
    reason: '用户明确关注的数据',
    retention: 'permanent_until_user_dismissed'
  },

  // 审批相关
  pending_approval: {
    reason: '待审批项时效性最高',
    retention: 'permanent_until_decided'
  },
  approval_decision: {
    reason: '审批决定影响后续流程',
    retention: 'permanent'
  },

  // 业务关键状态
  transaction_in_progress: {
    reason: '进行中的事务不能丢失',
    retention: 'permanent_until_completed'
  },
  form_draft: {
    reason: '表单草稿用户可能继续编辑',
    retention: 'permanent_until_submitted'
  },

  // 当前上下文
  current_department_context: {
    reason: '当前部门是操作的基础',
    retention: 'session_permanent'
  },
  user_permission_context: {
    reason: '权限上下文决定操作范围',
    retention: 'session_permanent'
  },

  // 最近访问
  recently_edited_document: {
    reason: '用户可能继续编辑',
    retention: '24_hours'
  }
};
```

#### Scenario: 识别待审批项

- **WHEN** 压缩过程中检查消息内容
- **THEN** 系统 SHALL 识别包含 `pending_approval` 标签的消息
- **AND** SHALL 标记该消息为不可压缩

#### Scenario: 识别表单草稿

- **WHEN** 压缩过程中检查消息内容
- **THEN** 系统 SHALL 识别包含 `form_draft` 状态的消息
- **AND** SHALL 保留草稿的所有字段数据

### Requirement: 用户显式引用保留

当用户在消息中显式引用某个实体时，该实体 SHALL 被标记为 Never Compress：

- 用户消息中直接提到的文档 ID
- 用户消息中直接提到的审批 ID
- 用户消息中直接提到的员工或部门

#### Scenario: 用户提及文档

- **WHEN** 用户发送消息如"查看合同 #C001"
- **THEN** 系统 SHALL 将文档 C001 标记为 Never Compress
- **AND** SHALL 保留该文档的完整上下文

#### Scenario: 用户提及审批

- **WHEN** 用户发送消息如"审批 #A123 的报销"
- **THEN** 系统 SHALL 将审批 A123 标记为 Never Compress
- **AND** SHALL 保留审批的完整详情

### Requirement: 审批状态强制保留

待审批项 SHALL 保留以下信息不被压缩：

- 审批 ID 和类型
- 申请人信息
- 审批金额/内容摘要
- 当前审批节点
- 截止日期
- 历史审批意见

#### Scenario: 保留待审批详情

- **WHEN** 对话中包含待审批项时执行压缩
- **THEN** 系统 SHALL 保留完整的审批详情
- **AND** SHALL 不将该审批信息压缩为摘要

#### Scenario: 审批状态变更检测

- **WHEN** 用户发送涉及审批状态变更的消息
- **THEN** 系统 SHALL 检测并更新 Never Compress 标记
- **AND** SHALL 保留最新的审批状态

### Requirement: 部门上下文强制保留

当前部门的上下文 SHALL 在整个会话期间保留：

- 当前部门 ID 和名称
- 当前部门类型（核心/扩展）
- 用户在当前部门的权限
- 当前部门关联的工作流

#### Scenario: 保留当前部门信息

- **WHEN** 任何压缩操作执行时
- **THEN** 系统 SHALL 保留当前部门完整上下文
- **AND** SHALL 不将部门信息压缩或删除

#### Scenario: 部门切换时重建上下文

- **WHEN** 用户切换到不同部门时
- **THEN** 系统 SHALL 为新部门重建 Never Compress 标记
- **AND** SHALL 清除旧部门的 Never Compress 标记（除用户显式引用外）

### Requirement: Compressible 类型定义

系统 SHALL 定义以下业务实体类型为可压缩：

```typescript
const COMPRESSIBLE_TYPES = {
  historical_data_query: {
    compressAfter: '24_hours',
    keepSummary: true,
    summaryTemplate: '[查询条件] 返回 [结果数] 条记录'
  },

  report_preview: {
    compressAfter: '1_hour',
    keepSummary: true,
    summaryTemplate: '[报告名] 生成于 [时间]'
  },

  search_results: {
    compressAfter: '30_minutes',
    keepSummary: true,
    summaryTemplate: '[搜索词] 找到 [结果数] 条'
  },

  notification: {
    compressAfter: '1_hour',
    keepSummary: false
  },

  activity_log: {
    compressAfter: '30_minutes',
    keepSummary: false
  },

  document_full_content: {
    compressAfter: '30_minutes',
    keepSummary: true,
    summaryTemplate: '[文档名] (ID: [id])'
  }
};
```

#### Scenario: 历史数据查询可压缩

- **WHEN** 存在超过 24 小时的历史数据查询
- **THEN** 系统 SHALL 将该查询结果标记为可压缩
- **AND** SHALL 保留查询条件的摘要

#### Scenario: 保留搜索结果摘要

- **WHEN** 需要压缩搜索结果时
- **THEN** 系统 SHALL 保留搜索词和结果数量
- **AND** SHALL 删除具体的搜索结果列表

### Requirement: 压缩决策接口

压缩决策 SHALL 通过以下接口实现：

```typescript
interface CompressibilityDecision {
  canCompress: boolean;
  reason: string;
  preserveTypes: string[];
  compressionLevel: 'none' | 'summary' | 'reference';
}
```

#### Scenario: 决策返回不可压缩

- **WHEN** 检查消息是否可以压缩时
- **AND** 消息包含 Never Compress 类型实体
- **THEN** 系统 SHALL 返回 `canCompress: false`
- **AND** SHALL 在 `reason` 中说明保留原因

#### Scenario: 决策返回摘要压缩

- **WHEN** 检查消息是否可以压缩时
- **AND** 消息包含 Compressible 类型实体
- **THEN** 系统 SHALL 返回 `canCompress: true`
- **AND** SHALL 返回 `compressionLevel: 'summary'`
