# Specs: MCP工具Approve策略系统

## 功能规格

### 1. 策略列表 (mcp_approve_list)

**输入：** void
**输出：** `McpApprovePolicy[]`

### 2. 创建策略 (mcp_approve_create)

**输入：** policy: McpApprovePolicy
**输出：** string (policy_id)

### 3. 批量配置 (mcp_approve_batch)

**输入：** toolPatterns: string[], strategy: ApproveStrategy
**输出：** number (affected_count)

### 4. AI推荐 (mcp_approve_recommend)

**输入：** toolName: string
**输出：** `AiRecommendation`

### 5. 临时批准 (mcp_temp_approve)

**输入：** toolName: string, expiresInSecs: number
**输出：** TempApproval

### 6. 决策日志 (mcp_approve_logs)

**输入：** toolName?: string, from: number, to: number
**输出：** `ApproveDecisionLog[]`

## 接口规格

| 命令 | 参数 | 返回值 |
|------|------|--------|
| mcp_approve_list | - | McpApprovePolicy[] |
| mcp_approve_create | policy | string |
| mcp_approve_batch | patterns, strategy | number |
| mcp_approve_recommend | toolName | AiRecommendation |
| mcp_temp_approve | toolName, expiresInSecs | TempApproval |
| mcp_approve_logs | toolName?, from, to | ApproveDecisionLog[] |

## 错误码

| 错误码 | 说明 |
|--------|------|
| POLICY_NOT_FOUND | 策略不存在 |
| INVALID_STRATEGY | 无效策略类型 |
| APPROVE_FAILED | 审批失败 |
