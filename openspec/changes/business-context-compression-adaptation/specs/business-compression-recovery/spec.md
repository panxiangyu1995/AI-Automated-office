# business-compression-recovery

## ADDED Requirements

### Requirement: 恢复触发规则

系统 SHALL 定义以下自动恢复触发规则：

```typescript
const AUTO_RECOVERY_RULES = [
  {
    trigger: 'user_mentions_document',
    pattern: /\b(doc|文档|文件|合同|报告)\s*[#：:]\s*(\w+)/i,
    action: 'restore_document_content',
    priority: 1
  },
  {
    trigger: 'user_mentions_approval',
    pattern: /\b(审批|approve)\s*[#：:]\s*(\w+)/i,
    action: 'restore_approval_details',
    priority: 1
  },
  {
    trigger: 'department_switch',
    action: 'restore_department_context',
    priority: 2
  },
  {
    trigger: 'user_asks_about_previous',
    pattern: /\b(之前|刚才|上面|之前提到)\b/,
    action: 'restore_recent_context',
    priority: 2
  }
];
```

#### Scenario: 用户提及文档时自动恢复

- **WHEN** 用户发送"查看合同 #C001"
- **AND** C001 的详细内容已被压缩
- **THEN** 系统 SHALL 自动恢复该文档的完整内容
- **AND** SHALL 在响应中包含恢复的内容

#### Scenario: 用户提及审批时自动恢复

- **WHEN** 用户发送"审批 #A123 的报销"
- **AND** A123 的详细内容已被压缩
- **THEN** 系统 SHALL 自动恢复审批的完整详情
- **AND** SHALL 包含历史审批意见

### Requirement: 手动恢复触发

系统 SHALL 支持以下手动恢复触发方式：

```typescript
interface ManualRecoveryTriggers {
  '@查看详情 {entity_id}': 'restore_entity_full_content';
  '@恢复文档 {doc_id}': 'restore_document';
  '@审批详情 {approval_id}': 'restore_approval_chain';
  '@查看历史 {query}': 'restore_search_history';
  '@全部恢复': 'restore_all_compressed';
}
```

#### Scenario: 用户使用恢复命令

- **WHEN** 用户发送 "@恢复文档 C001"
- **THEN** 系统 SHALL 恢复文档 C001 的完整内容
- **AND** SHALL 在响应中标注"已恢复"

#### Scenario: 恢复全部压缩内容

- **WHEN** 用户发送 "@全部恢复"
- **THEN** 系统 SHALL 显示所有可恢复的内容列表
- **AND** SHALL 允许用户选择性恢复

### Requirement: 恢复优先级

恢复操作 SHALL 按以下优先级执行：

| 优先级 | 内容类型 | 说明 |
|-------|---------|------|
| P0 | pending_approval_details | 必须立即恢复 |
| P0 | current_form_data | 当前表单数据 |
| P1 | recently_edited_document | 最近编辑的文档 |
| P1 | active_workflow_status | 活跃工作流状态 |
| P2 | historical_report | 历史报告 |
| P2 | old_notification | 旧通知 |

#### Scenario: P0 优先级立即恢复

- **WHEN** 需要恢复 P0 优先级内容
- **THEN** 系统 SHALL 立即执行恢复
- **AND** SHALL 优先于其他操作

#### Scenario: P2 优先级延迟恢复

- **WHEN** 需要恢复 P2 优先级内容
- **AND** 系统正忙
- **THEN** 系统 SHALL 在后台异步恢复
- **AND** SHALL 通知用户恢复状态

### Requirement: 恢复数据源

恢复内容 SHALL 从以下数据源获取：

1. **数据库**：原始业务数据（文档、审批、员工等）
2. **消息历史**：完整消息记录（SQLite 保留）
3. **压缩摘要**：用于验证恢复内容一致性

#### Scenario: 从数据库恢复文档

- **WHEN** 需要恢复被压缩的文档内容
- **THEN** 系统 SHALL 从文档数据库查询完整内容
- **AND** SHALL 使用文档 ID 作为查询条件

#### Scenario: 从消息历史恢复

- **WHEN** 需要恢复被压缩的消息详情
- **THEN** 系统 SHALL 从 SQLite 消息表查询原始消息
- **AND** SHALL 重建消息上下文

### Requirement: 恢复缓存

恢复的内容 SHALL 被缓存以提高性能：

- 缓存有效期：5 分钟
- 缓存大小限制：100 个实体
- 缓存策略：LRU（最近最少使用）

#### Scenario: 恢复后缓存内容

- **WHEN** 成功恢复某个实体的内容
- **THEN** 系统 SHALL 将内容存入缓存
- **AND** SHALL 在有效期内直接返回缓存内容

#### Scenario: 缓存过期处理

- **WHEN** 缓存的内容超过 5 分钟
- **THEN** 系统 SHALL 从缓存中清除
- **AND** 下次需要时重新从数据源恢复

### Requirement: 恢复结果展示

恢复的内容 SHALL 按以下格式展示：

```markdown
**[已恢复] 文档: 采购合同-C001**
> ID: C001
> 类型: 采购合同
> 甲方: XXX 公司
> 乙方: YYY 公司
> 金额: ¥500,000
> 状态: 待审批
> 恢复时间: 2024-01-15 10:30:00
```

#### Scenario: 展示恢复的文档

- **WHEN** 成功恢复文档内容
- **THEN** 系统 SHALL 使用结构化格式展示
- **AND** SHALL 标注"[已恢复]"前缀

#### Scenario: 展示恢复的审批

- **WHEN** 成功恢复审批详情
- **THEN** 系统 SHALL 展示审批的完整历史
- **AND** SHALL 高亮当前审批节点

### Requirement: 恢复失败处理

恢复操作失败时 SHALL 按以下方式处理：

- **数据源不可用**：显示"无法恢复，数据源暂时不可用"
- **实体不存在**：显示"该实体已被删除"
- **权限不足**：显示"您无权查看此内容"

#### Scenario: 数据源不可用

- **WHEN** 尝试恢复时数据库连接失败
- **THEN** 系统 SHALL 返回友好的错误消息
- **AND** SHALL 建议用户稍后重试

#### Scenario: 实体已删除

- **WHEN** 尝试恢复已删除的实体
- **THEN** 系统 SHALL 返回"该内容已被删除"
- **AND** SHALL 提供删除记录的查看选项
