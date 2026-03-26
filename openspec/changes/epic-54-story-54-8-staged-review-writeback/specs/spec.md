# Specification: AI暂存写回与审阅机制

## 需求来源

### PRD 需求
- FR530: 暂存内容管理
- FR531: 审阅确认机制
- FR532: 正式写回功能

### 架构约束
- ADR-037: Agent Runtime集成规范

### UX 规范
- UX-01: 组件设计规范
- UX-04: 交互设计规范
- UX-05: 反馈设计规范

## 功能规格

### 用户故事
As a 业务人员,
I want to 在Agent帮我生成报价单、合同等内容时，能够先审阅确认再正式应用,
So that 我可以确保AI生成的内容准确无误，避免错误数据进入系统。

As an Agent,
I want to 将生成的内容先暂存，等待用户确认后再写入业务模块,
So that 我可以在保持智能化的同时确保用户对数据有完全的控制权。

### 验收场景

#### Scenario 1: Agent创建暂存内容
- **GIVEN** Agent执行销售任务生成了报价单内容
- **WHEN** Agent调用create_staged_content API
- **THEN** 系统创建暂存内容，状态为pending
- **AND** 返回暂存内容ID和访问令牌

#### Scenario 2: 用户查看待审阅内容
- **GIVEN** 有待审阅的暂存内容
- **WHEN** 用户打开StagedReviewPanel
- **THEN** 系统显示所有pending状态的暂存内容
- **AND** 显示内容类型、标题、摘要、置信度、来源

#### Scenario 3: 用户批准暂存内容
- **GIVEN** 用户查看了暂存内容，确认无误
- **WHEN** 用户点击"批准"按钮
- **THEN** 暂存内容状态变为approved
- **AND** 记录审阅人和审阅时间
- **AND** 审计日志记录批准操作

#### Scenario 4: 用户拒绝暂存内容
- **GIVEN** 用户发现暂存内容有问题
- **WHEN** 用户点击"拒绝"并填写原因"金额错误"
- **THEN** 暂存内容状态变为rejected
- **AND** 记录拒绝原因
- **AND** 审计日志记录拒绝操作和原因

#### Scenario 5: 用户修改暂存内容
- **GIVEN** 用户发现暂存内容有小问题
- **WHEN** 用户点击"修改"，编辑数据后保存
- **THEN** 暂存内容的modified_data字段更新
- **AND** 状态保持pending
- **AND** 审计日志记录修改操作

#### Scenario 6: 用户确认写回
- **GIVEN** 暂存内容已批准，用户点击"确认写回"
- **WHEN** 系统执行写回操作
- **THEN** 调用对应业务模块的API写入数据
- **AND** 暂存内容状态变为written_back
- **AND** 记录写回结果
- **AND** 审计日志记录写回操作

#### Scenario 7: 写回失败处理
- **GIVEN** 暂存内容已批准，用户点击"确认写回"
- **WHEN** 写回时业务模块返回错误
- **THEN** 暂存内容状态保持approved
- **AND** 返回错误信息给用户
- **AND** 审计日志记录失败

#### Scenario 8: 暂存内容过期
- **GIVEN** 暂存内容已创建超过24小时未被审阅
- **WHEN** 系统执行过期检查
- **THEN** 暂存内容状态变为expired
- **AND** 用户不能再执行任何操作
- **AND** 审计日志记录过期

#### Scenario 9: 查看审阅历史
- **GIVEN** 用户切换到"审阅历史"Tab
- **WHEN** 系统加载历史记录
- **THEN** 显示该会话所有暂存内容的审阅操作记录
- **AND** 包含操作类型、操作人、时间、原因

#### Scenario 10: 批量批准
- **GIVEN** 有多个待审阅内容
- **WHEN** 用户选择多个后点击"批量批准"
- **THEN** 所有选中内容状态变为approved
- **AND** 每个操作都记录审计日志

## 实现规格

### 数据模型规格

#### StagedContent（暂存内容）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式，唯一 |
| type | StagedContentType | 是 | enum: quotation, contract, customer, invoice, ledger_entry, custom |
| agentId | string | 是 | 生成该内容的Agent ID |
| sessionId | string | 是 | 所属会话ID |
| title | string | 是 | 最大200字符 |
| summary | string | 是 | 最大500字符 |
| originalData | object | 是 | 原始数据JSON |
| modifiedData | object | 否 | 用户修改后的数据JSON |
| status | StagedContentStatus | 是 | enum: pending, approved, rejected, written_back, expired |
| sourceTool | string | 是 | 来源工具名称 |
| confidence | number | 是 | 0-1之间 |
| createdAt | string | 是 | ISO 8601日期时间 |
| expiresAt | string | 是 | ISO 8601日期时间，createdAt + 24h |
| reviewedAt | string | 否 | ISO 8601日期时间 |
| reviewedBy | string | 否 | 审阅人用户ID |
| rejectReason | string | 否 | 拒绝原因 |

#### ReviewAuditLog（审阅审计日志）
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | string | 是 | UUID格式，唯一 |
| stagedContentId | string | 是 | 关联的暂存内容ID |
| action | ReviewAction | 是 | enum: create, approve, reject, modify, write_back, expire |
| operatorId | string | 是 | 操作人用户ID |
| operatorName | string | 是 | 操作人姓名 |
| oldStatus | StagedContentStatus | 否 | 操作前的状态 |
| newStatus | StagedContentStatus | 是 | 操作后的状态 |
| reason | string | 否 | 操作原因 |
| dataSnapshot | string | 否 | 操作时的数据快照JSON |
| createdAt | string | 是 | ISO 8601日期时间 |

### API规格

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /staged-review/contents | 创建暂存内容 |
| GET | /staged-review/contents | 查询暂存内容列表 |
| GET | /staged-review/contents/:id | 获取暂存内容详情 |
| PATCH | /staged-review/contents/:id | 更新暂存内容（如修改） |
| POST | /staged-review/contents/:id/approve | 批准暂存内容 |
| POST | /staged-review/contents/:id/reject | 拒绝暂存内容 |
| POST | /staged-review/contents/:id/write-back | 写回暂存内容 |
| GET | /staged-review/history | 查询审阅历史 |

### 错误码定义

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| SR001 | 暂存内容不存在 | 提示用户检查ID |
| SR002 | 无效的状态转换 | 提示用户当前状态不允许此操作 |
| SR003 | 暂存内容已过期 | 提示用户内容已过期，需重新生成 |
| SR004 | 写回失败 | 显示错误详情，用户可重试或修改 |
| SR005 | 无对应类型的写回处理器 | 联系管理员配置 |
| SR006 | 权限不足 | 提示用户联系管理员 |
| SR007 | 拒绝原因不能为空 | 提示用户填写拒绝原因 |
| SR008 | 修改后的数据验证失败 | 显示验证错误，用户修正 |
| SR009 | 并发冲突，请刷新后重试 | 提示用户刷新页面 |
| SR010 | 审计日志写入失败 | 记录错误，继续执行 |

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "SR004",
    "message": "写回失败：客户ID不存在",
    "details": {
      "field": "customerId",
      "value": "C999",
      "requirement": "必须存在有效的客户ID"
    }
  }
}
```

## 边界条件

### 暂存内容边界
- 同一内容被多次批准：第一层批准生效，后续返回SR002
- 批准后又被修改：允许修改，但状态保持approved
- 拒绝后又被批准：允许，状态变为approved
- 写回时原数据已被修改：返回SR009并发冲突

### 写回边界
- 写回目标不存在：返回SR004，状态保持approved
- 写回部分成功：返回部分成功结果，状态保持approved
- 写回超时（30s）：返回SR004，状态保持approved

### 过期边界
- 过期检查频率：每小时执行一次
- 已过期的内容不可再被批准/拒绝/写回
- 过期内容可被查看（只读）

### 并发边界
- 同一内容被多人同时操作：使用乐观锁，后到者返回SR009
- 批量操作中的部分失败：返回成功和失败列表

## 性能要求

- 创建暂存内容：< 100ms
- 查询待审阅列表（100条）：< 200ms
- 批准/拒绝操作：< 200ms
- 写回操作：< 2s（取决于业务模块）
- 审阅历史查询（100条）：< 300ms

## 监控指标

- 暂存内容创建成功率
- 暂存内容平均生命周期
- 批准率/拒绝率
- 写回成功率
- 写回平均耗时
- 各类型暂存内容占比
- 审计日志写入成功率
