# business-reactive-compact

## ADDED Requirements

### Requirement: 响应式压缩触发条件

业务响应式压缩 SHALL 作为最后防线在以下条件满足时触发：

- LLM API 返回 `prompt_too_long` 错误
- 尝试其他压缩策略后 Token 仍超出限制
- 紧急需要释放上下文空间

#### Scenario: API 返回上下文过长错误

- **WHEN** LLM API 返回 `prompt_too_long` 错误
- **THEN** 系统 SHALL 立即触发响应式压缩
- **AND** SHALL 从最旧的消息轮次开始删除

#### Scenario: 压缩后仍超出限制

- **WHEN** 执行全量压缩后 Token 仍超出 API 限制
- **THEN** 系统 SHALL 触发响应式压缩
- **AND** SHALL 使用更激进的删除策略

### Requirement: 响应式压缩策略

响应式压缩 SHALL 按以下优先级删除内容：

1. 最旧的历史查询结果（保留摘要）
2. 最旧的活动日志
3. 最旧的通知消息
4. 次旧的对话轮次
5. 最早的对话轮次

**关键约束**：
- SHALL 始终保留最近 5 轮完整对话
- SHALL 保留所有 Never Compress 类型的实体
- SHALL 保留当前部门上下文

#### Scenario: 保留最近对话

- **WHEN** 执行响应式压缩时
- **THEN** 系统 SHALL 保留最近 5 轮对话完整内容
- **AND** SHALL 不删除这些轮次中的任何消息

#### Scenario: 保护 Never Compress 实体

- **WHEN** 响应式压缩需要删除消息时
- **THEN** 系统 SHALL 检查消息中是否包含 Never Compress 实体
- **AND** SHALL 跳过包含此类实体的消息

### Requirement: 渐进式删除策略

响应式压缩 SHALL 采用渐进式删除策略：

**Phase 1**：删除可替代内容
- 删除历史查询结果的完整内容（保留摘要）
- 删除活动日志详情

**Phase 2**：删除次旧轮次
- 删除第 6-10 轮对话的详情
- 保留摘要

**Phase 3**：删除最早轮次
- 删除第 11+ 轮对话
- 仅保留关键意图摘要

**Phase 4**：紧急删除
- 删除最近的图片/附件
- 必要时删除部分工具调用结果

#### Scenario: Phase 1 渐进删除

- **WHEN** 需要释放约 5% Token 空间
- **THEN** 系统 SHALL 仅执行 Phase 1 删除
- **AND** SHALL 保留所有对话轮次

#### Scenario: Phase 3 深度删除

- **WHEN** 需要释放超过 30% Token 空间
- **THEN** 系统 SHALL 执行到 Phase 3
- **AND** SHALL 为每个被删除的轮次生成摘要

### Requirement: 响应式压缩重试

响应式压缩 SHALL 实现自动重试机制：

- 首次删除后立即重试发送
- 如果仍然超出限制，继续删除并重试
- 最多重试 3 次
- 3 次后返回用户错误

#### Scenario: 单次删除成功

- **WHEN** 响应式压缩删除后 Token 降至限制以下
- **THEN** 系统 SHALL 立即重试 LLM 请求
- **AND** SHALL 不显示任何提示

#### Scenario: 需要多次删除

- **WHEN** 首次删除后 Token 仍超限
- **THEN** 系统 SHALL 继续删除更多内容
- **AND** SHALL 显示进度指示

#### Scenario: 删除超过限制

- **WHEN** 删除 3 次后 Token 仍超限
- **THEN** 系统 SHALL 显示错误消息给用户
- **AND** SHALL 建议用户开启新会话或手动压缩

### Requirement: 响应式压缩记录

响应式压缩 SHALL 记录以下信息：

- 触发原因
- 删除的内容类型和数量
- 每次删除后剩余 Token 数
- 最终是否成功

#### Scenario: 记录压缩历史

- **WHEN** 执行响应式压缩时
- **THEN** 系统 SHALL 记录压缩事件到历史表
- **AND** SHALL 记录每次删除的详细信息

### Requirement: 用户通知

响应式压缩 SHALL 在以下情况通知用户：

- 删除内容较多（> 20% Token）时
- 删除可能影响上下文理解时
- 压缩失败需要用户干预时

#### Scenario: 重要删除通知

- **WHEN** 响应式压缩删除了超过 20% 的内容
- **THEN** 系统 SHALL 显示通知：上下文已被压缩以满足 API 限制
- **AND** SHALL 提供"查看详情"选项
