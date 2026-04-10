# Agent模块前后端集成对齐 - 规格说明

## Spec

### 1. 类型定义规格

| 类型 | 字段 | 类型 |
|------|------|------|
| Message | id, agentId, content, messageType, status, createdAt, updatedAt | string, string, string, enum, enum, string, string |
| MessageStatus | sending, sent, delivered, read | enum |
| MessageType | text, tool_call, tool_result | enum |
| AgentConfig | id, name, description, type, enabled, config, createdAt, updatedAt | ... |

### 2. 参数验证规格

| 命令 | 验证规则 |
|------|---------|
| send_agent_message | agent_id非空, content非空且<=65535 |
| get_agent_messages | agent_id非空, limit可选(默认50) |
| create_personal_subagent | name非空且<=64, 只允许字母数字下划线连字符 |

### 3. 命令契约规格

| 前端格式 | 后端格式 | 处理方式 |
|----------|----------|---------|
| camelCase | snake_case | Tauri自动转换 |
| {agentId, content} | {agent_id, content} | invoke参数映射 |

---

## 验收测试用例

| 场景 | 输入 | 期望结果 |
|------|------|---------|
| 空agent_id | {agent_id: ""} | 返回错误 |
| 超长content | content超过65535 | 返回错误 |
| 无效name | name包含特殊字符 | 返回错误 |
| 正常调用 | 有效参数 | 返回成功 |
