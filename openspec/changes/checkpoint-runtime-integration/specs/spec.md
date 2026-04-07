# Specification: 检查点系统Runtime集成

## 需求来源

### PRD 需求
- FR17-1: 系统在用户每次发送消息时自动创建检查点
- FR17-2: 检查点捕获当前对话上下文和会话状态
- FR17-3: 检查点通过Git提交记录文件变更状态
- FR17-4: 检查点在对话界面以标记线形式可视化显示
- FR17-5: 检查点标题自动生成为用户输入的前几个字
- FR17-6: 用户可以从任意检查点回滚到历史状态
- FR17-7: 回滚时弹出确认对话框，显示回滚范围选项
- FR17-8: 支持"仅恢复对话"模式：撤销对话历史和AI记忆，保留文件变更
- FR17-9: 支持"恢复对话和文件内容"模式：通过Git恢复文件状态
- FR17-10: 回滚操作记录审计日志
- FR17-11: 用户可以从历史检查点编辑输入内容并重新发送
- FR17-12: 编辑重试创建分支对话，保留原对话历史作为参考
- FR17-13: 分支对话独立维护，不影响主对话流程
- FR17-19: 用户可以查看检查点列表，按时间倒序排列
- FR17-20: 检查点显示创建时间、用户输入预览、文件变更摘要
- FR17-21: 用户可以删除检查点，清理对应的Git提交
- FR17-22: 系统自动清理超过30天的检查点（可配置）
- FR17-23: 用户可手动标记重要检查点，避免自动清理

### 架构约束
- ARCH-01: 分层微内核架构
- ADR-026: 检查点系统采用Git作为后端存储
- ADR-027: 检查点触发时机：每次用户发送消息前自动创建
- ADR-028: 检查点回滚范围支持两种模式

## 功能规格

### 用户故事

As a **用户**,
I want **系统自动保存对话历史快照**,
So that **可以随时回滚到之前的状态**。

As a **用户**,
I want **从历史检查点重新编辑并发送**,
So that **尝试不同的处理方式而不丢失原始对话**。

### 验收场景

#### Scenario 1: 自动创建检查点（FR17-1）
- **GIVEN** 用户在AI Chat Panel发送消息
- **WHEN** 消息发送成功
- **THEN** 系统自动创建检查点，显示标记线

#### Scenario 2: 仅恢复对话（FR17-8）
- **GIVEN** 用户选择回滚
- **WHEN** 选择"仅恢复对话"模式
- **THEN** 对话历史和AI记忆恢复，文件保持不变

#### Scenario 3: 恢复对话和文件（FR17-9）
- **GIVEN** 用户选择回滚
- **WHEN** 选择"恢复对话和文件"模式
- **THEN** 通过Git恢复到检查点时的文件状态

#### Scenario 4: 编辑重试（FR17-11-FR17-13）
- **GIVEN** 用户选择一个历史检查点
- **WHEN** 编辑输入内容并重新发送
- **THEN** 创建新分支，保留原对话作为参考

## 数据规格

### Checkpoint
| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| id | String | 是 | UUID格式 |
| session_id | String | 是 | 会话ID |
| created_at | i64 | 是 | Unix时间戳 |
| user_input_preview | String | 否 | 最多50字符 |
| user_input_full | String | 否 | 原始输入 |
| conversation_turn | i64 | 否 | 对话轮次 |
| message_ids | Vec<String> | 否 | 消息ID列表 |
| git_commit_hash | String | 否 | Git提交哈希 |
| git_commit_message | String | 否 | Git提交信息 |
| artifacts | JSON | 否 | 工件数据 |
| is_important | bool | 是 | 默认false |
| is_active | bool | 是 | 默认true |
| branch_id | String | 否 | 分支ID |
| parent_checkpoint_id | String | 否 | 父检查点ID |

### RollbackMode
| 值 | 描述 |
|----|------|
| ConversationOnly | 仅恢复对话 |
| ConversationAndFiles | 恢复对话和文件 |

## 边界条件

- 检查点创建失败时继续执行，不阻塞消息发送
- 回滚时检查点不存在返回错误
- 分支超过10个时提示用户清理
- Git未安装时优雅降级到仅对话恢复
