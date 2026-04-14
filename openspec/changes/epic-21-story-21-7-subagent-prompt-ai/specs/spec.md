# Specs: Sub-Agent AI辅助提示词生成

## 功能规格

### 1. AI生成提示词 (subagent_generate_prompt)

**输入：** roleDescription, capabilities
**输出：** string (generated_prompt)

### 2. 创建配置 (subagent_config_create)

**输入：** config: SubAgentConfig
**输出：** string (agent_id)

### 3. 任务路由 (subagent_route)

**输入：** taskDescription
**输出：** `SubAgentConfig?`

### 4. 执行Sub-Agent (subagent_execute)

**输入：** agentId, task, parentTraceId
**输出：** DelegationResult

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| subagent_generate_prompt | roleDescription, capabilities | string |
| subagent_config_create | config | string |
| subagent_route | taskDescription | SubAgentConfig? |
| subagent_execute | agentId, task, parentTraceId | DelegationResult |

## 错误码

| 错误码 | 说明 |
|--------|------|
| AGENT_NOT_FOUND | Sub-Agent不存在 |
| GENERATE_FAILED | 生成失败 |
| EXECUTE_FAILED | 执行失败 |
| MAX_DEPTH_EXCEEDED | 超过最大嵌套深度 |
