# business-context-compact

## ADDED Requirements

### Requirement: 9+X 段式压缩结构

业务全量压缩 SHALL 生成 9+X 段式摘要，结构如下：

**基础 9 段（继承自 Claude Code）：**

1. Primary Request and Intent - 主要业务请求和意图
2. Key Business Concepts - 关键业务概念
3. Documents and Data References - 文档和数据引用
4. Decisions and Resolutions - 决策和解决方案
5. Problem Solving - 问题解决
6. All User Messages - 所有用户消息
7. Pending Tasks - 待处理任务
8. Current Work - 当前工作
9. Optional Next Step - 可选的下一步

**办公扩展段（新增 X）：**

10. Department Context - 部门上下文
11. Approval Chain Status - 审批链状态
12. Related Documents - 关联文档
13. Cross-Department Dependencies - 跨部门依赖
14. Business Rules Applied - 应用的业务规则

#### Scenario: 生成完整 9+X 段摘要

- **WHEN** 触发业务全量压缩时
- **THEN** 系统 SHALL 调用 LLM 生成包含所有 14 段的摘要
- **AND** SHALL 每个段的内容简洁但完整

#### Scenario: 段内容为空处理

- **WHEN** 某段内容为空或不适用时
- **THEN** 系统 SHALL 使用 `[无相关数据]` 占位
- **AND** SHALL 在摘要中保留该段标题

### Requirement: 部门上下文段格式

部门上下文段 SHALL 包含以下信息：

```markdown
## 10. Department Context

**当前部门**: {department_name} ({department_type})
**部门 ID**: {department_id}

**关联部门**:
- {related_dept_1}: {relation_type}
- {related_dept_2}: {relation_type}

**可用权限**:
- {permission_1}
- {permission_2}
```

#### Scenario: 单部门上下文

- **WHEN** 用户仅在一个部门内操作
- **THEN** 部门上下文段 SHALL 仅包含当前部门信息
- **AND** SHALL 关联部门列表为空

#### Scenario: 多部门协作上下文

- **WHEN** 用户涉及多个部门的协作
- **THEN** 部门上下文段 SHALL 列出所有涉及的部门
- **AND** SHALL 说明每个部门的关联类型

### Requirement: 审批链状态段格式

审批链状态段 SHALL 包含以下信息：

```markdown
## 11. Approval Chain Status

**待审批数量**: {pending_count}

**下一步审批**:
- 审批 ID: {approval_id}
- 审批类型: {approval_type}
- 当前节点: {current_step}/{total_steps}
- 截止日期: {deadline or '无'}

**近期审批决定**:
- {date}: [{approval_type}] - {approved/rejected/returned}
- ...
```

#### Scenario: 无待审批项

- **WHEN** 用户没有待审批项
- **THEN** 审批链状态段 SHALL 显示 `待审批数量: 0`
- **AND** SHALL 省略下一步审批详情

#### Scenario: 存在待审批项

- **WHEN** 用户存在待审批项
- **THEN** 系统 SHALL 保留审批 ID、类型、当前状态
- **AND** SHALL 显示截止日期（如有）

### Requirement: 关联文档段格式

关联文档段 SHALL 包含以下信息：

```markdown
## 12. Related Documents

**最近访问文档**:
- {doc_name} (ID: {doc_id}) - {access_time}
- ...

**待处理文档**:
- {doc_name} (ID: {doc_id}) - 状态: {pending_action}
- ...
```

#### Scenario: 文档压缩为引用

- **WHEN** 需要压缩文档详情时
- **THEN** 系统 SHALL 仅保留文档 ID 和名称
- **AND** SHALL 可通过 ID 恢复完整内容

### Requirement: 跨部门依赖段格式

跨部门依赖段 SHALL 包含以下信息：

```markdown
## 13. Cross-Department Dependencies

**待处理依赖**:
- {dep_name}: 等待 {department} 反馈
- ...

**已完成依赖**:
- {dep_name}: {department} 已完成 - {result_summary}
- ...
```

#### Scenario: 无跨部门依赖

- **WHEN** 当前会话不涉及跨部门协作
- **THEN** 跨部门依赖段 SHALL 使用 `[无跨部门依赖]`

### Requirement: 业务规则应用段格式

业务规则应用段 SHALL 包含以下信息：

```markdown
## 14. Business Rules Applied

**已应用规则**:
- {rule_name}: {rule_description}
- ...

**自定义规则**:
- {custom_rule_name}: {custom_rule_description}
- ...
```

### Requirement: 全量压缩触发条件

业务全量压缩 SHALL 在以下条件满足时触发：

- 当前 Token 数 >= 全量压缩阈值（60,000）
- 微压缩无法有效减少 Token
- 用户手动触发压缩

#### Scenario: Token 达到阈值触发全量压缩

- **WHEN** 当前 Token 数 >= 60,000
- **AND** 微压缩后 Token 仍 >= 45,000
- **THEN** 系统 SHALL 触发业务全量压缩

#### Scenario: 用户手动触发全量压缩

- **WHEN** 用户点击"压缩上下文"按钮
- **THEN** 系统 SHALL 立即触发业务全量压缩
- **AND** SHALL 显示压缩进度

### Requirement: 全量压缩性能要求

全量压缩 SHALL 满足以下性能要求：

- 压缩响应时间 < 3 秒（95 百分位）
- 压缩后 Token 数减少 >= 60%
- 摘要内容准确率 >= 90%

#### Scenario: 压缩性能监控

- **WHEN** 执行全量压缩时
- **THEN** 系统 SHALL 记录压缩耗时
- **AND** SHALL 记录压缩前后 Token 数
- **AND** SHALL 在超过 3 秒时记录警告
