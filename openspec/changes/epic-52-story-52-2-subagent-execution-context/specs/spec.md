# Specification: Sub-Agent执行上下文 - 隔离环境

## 需求来源

### PRD 需求
- FR915: Sub-Agent执行上下文必须支持独立的记忆配置
- FR916: Sub-Agent执行上下文必须支持工具集的动态过滤
- FR918: Sub-Agent执行上下文必须实现权限的隔离与继承
- FR919: Sub-Agent执行上下文必须支持系统提示词的定制
- FR920: Sub-Agent执行上下文必须支持嵌套调用的深度控制
- FR923: Sub-Agent执行上下文必须支持超时控制

### 架构约束
- ADR-013: Sub-Agent架构设计规范
- ADR-037: 工具系统设计规范
- ADR-043: 提示词构建规范

### UX 规范
- UX-01: Agent对话交互规范

## 功能规格

### 用户故事

**As an** Agent Runtime System,
**I want to** 创建Sub-Agent执行上下文，实现独立的记忆、工具集、权限配置，确保Sub-Agent执行的隔离性,
**So that** 主Agent可以安全、可控地调用多个专业化的Sub-Agent来协同完成复杂任务。

### 核心概念

1. **SubAgentExecutionContext**: Sub-Agent执行时的隔离环境，包含记忆范围、工具列表、权限配置等信息
2. **MemoryScopeConfig**: 记忆注入范围配置，定义Sub-Agent可访问的记忆类型和数量限制
3. **ToolFilter**: 工具过滤机制，确保Sub-Agent只能使用授权的工具
4. **PermissionContext**: 权限上下文，支持权限的隔离与继承

## 输入输出规格

### 创建上下文输入

| 字段 | 类型 | 必填 | 默认值 | 校验规则 | 描述 |
|------|------|------|--------|----------|------|
| subAgentId | string | 是 | - | 非空，长度1-128 | Sub-Agent唯一标识 |
| memoryScope | MemoryScopeConfig | 是 | - | 见下方详情 | 记忆注入范围配置 |
| allowedTools | string[] | 是 | [] | 数组，每项非空 | 允许使用的工具名称列表 |
| permissionLevel | PermissionLevel | 是 | Standard | 枚举值 | 权限级别 |
| timeoutMs | number | 否 | 300000 | 正整数，最大86400000 | 超时时间（毫秒） |
| customSystemPrompt | string | 否 | undefined | 长度0-4096 | 自定义系统提示词 |

### MemoryScopeConfig 输入

| 字段 | 类型 | 必填 | 默认值 | 校验规则 | 描述 |
|------|------|------|--------|----------|------|
| enabled | boolean | 是 | true | - | 是否启用记忆注入 |
| allowedMemoryTypes | MemoryType[] | 是 | [] | 枚举值数组，非空 | 可访问的记忆类型列表 |
| maxMemoryCount | number | 否 | 10 | 正整数，最大100 | 记忆检索的最大数量 |
| timeRangeSeconds | number | 否 | 0 | 非负整数 | 记忆检索的时间范围（秒） |
| keywordWhitelist | string[] | 否 | [] | 数组，每项长度1-64 | 关键词过滤白名单 |

### 创建上下文输出

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 上下文唯一标识（UUID格式） |
| subAgentId | string | 关联的Sub-Agent ID |
| createdAt | number | 创建时间戳（Unix毫秒） |
| status | ContextStatus | 上下文状态 |
| nestingDepth | number | 当前嵌套深度（初始为0） |

### 获取上下文输出

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 上下文唯一标识 |
| subAgentId | string | 关联的Sub-Agent ID |
| createdAt | number | 创建时间戳 |
| lastActiveAt | number | 最后活跃时间戳 |
| status | ContextStatus | 上下文状态 |
| nestingDepth | number | 当前嵌套深度 |
| usedTools | ToolUsageRecord[] | 已使用的工具记录 |
| memoryInjections | MemoryInjection[] | 记忆注入记录 |

### 工具验证输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| contextId | string | 是 | 非空，UUID格式 | 上下文ID |
| toolName | string | 是 | 非空，长度1-128 | 要验证的工具名称 |

### 工具验证输出

| 字段 | 类型 | 描述 |
|------|------|------|
| allowed | boolean | 是否允许使用该工具 |
| reason | string | 允许或拒绝的原因 |

## 验收场景

### 场景1: 正常创建Sub-Agent执行上下文

- **GIVEN** 用户提供了完整的上下文配置，包括subAgentId、memoryScope、allowedTools、permissionLevel
- **WHEN** 调用`create_subagent_context`命令
- **THEN** 系统返回新创建的上下文对象，状态为`Initializing`，嵌套深度为0

**详细步骤**:
1. 验证配置合法性（subAgentId非空、timeoutMs正数等）
2. 创建`SubAgentExecutionContext`实例
3. 初始化记忆注入配置
4. 初始化工具白名单
5. 设置权限级别
6. 返回上下文信息

### 场景2: 记忆注入范围控制

- **GIVEN** 上下文的memoryScope配置为`{ enabled: true, allowedMemoryTypes: [Personal, Enterprise], maxMemoryCount: 5 }`
- **WHEN** Sub-Agent执行时需要注入记忆
- **THEN** 系统仅检索并注入Personal和Enterprise类型的记忆，最多5条

**详细步骤**:
1. 根据allowedMemoryTypes过滤记忆类型
2. 根据timeRangeSeconds过滤时间范围
3. 根据keywordWhitelist过滤关键词
4. 按相关度排序并限制数量为maxMemoryCount
5. 记录注入历史

### 场景3: 工具白名单过滤

- **GIVEN** 上下文的allowedTools配置为`["hr_employee_query", "hr_employee_create"]`
- **WHEN** Sub-Agent尝试调用`finance_invoice_query`工具
- **THEN** 系统返回`allowed: false`，reason为"Tool 'finance_invoice_query' not in allowed list"

**详细步骤**:
1. 检查工具是否在allowedTools列表中
2. 如不在，返回拒绝结果和原因
3. 如在，返回允许结果

### 场景4: 权限级别控制

- **GIVEN** 上下文的permissionLevel为`ReadOnly`
- **WHEN** Sub-Agent尝试执行写操作（如创建员工）
- **THEN** 系统拒绝操作，返回权限不足错误

**详细步骤**:
1. 根据permissionLevel判断可执行的操作范围
2. ReadOnly级别仅允许读操作
3. 如操作超出权限范围，返回权限错误

### 场景5: 系统提示词构建

- **GIVEN** 上下文配置包含subAgentDefinition和customSystemPrompt
- **WHEN** 需要为Sub-Agent生成系统提示词
- **THEN** 系统生成包含角色、能力、约束、上下文信息的完整提示词

**详细步骤**:
1. 组装角色定义部分
2. 组装可用能力列表（基于allowedTools）
3. 组装上下文信息（基于memoryScope）
4. 添加自定义提示词（如有）
5. 添加行为约束

### 场景6: 嵌套深度控制

- **GIVEN** 当前上下文的nestingDepth为2（已嵌套2层）
- **WHEN** 尝试再次嵌套调用（将是第3层）
- **THEN** 系统拒绝嵌套，返回最大深度超出错误

**详细步骤**:
1. 检查当前nestingDepth是否小于最大值（3）
2. 如已达到最大值，返回错误
3. 如未达到，递增深度并继续

### 场景7: 上下文超时清理

- **GIVEN** 上下文创建后长时间未使用，已超过timeoutMs配置
- **WHEN** 下一次使用该上下文时
- **THEN** 系统检测到超时，将上下文状态置为Timeout

**详细步骤**:
1. 检查当前时间与lastActiveAt的差值
2. 如超过timeoutMs，更新状态为Timeout
3. 返回超时错误

## 错误处理

### 错误码定义

| 错误码 | 错误名称 | 错误信息 | 处理方式 |
|--------|----------|----------|----------|
| CONTEXT_001 | InvalidConfig | "Invalid context config: {detail}" | 返回错误详情，提示用户修正配置 |
| CONTEXT_002 | NotFound | "Context not found: {contextId}" | 返回404，提示上下文不存在 |
| CONTEXT_003 | MaxNestingDepthExceeded | "Maximum nesting depth {max} exceeded" | 拒绝嵌套操作，返回错误 |
| CONTEXT_004 | Timeout | "Context timeout exceeded" | 清理上下文，要求重建 |
| CONTEXT_005 | ToolNotAllowed | "Tool '{toolName}' not allowed in this context" | 拒绝工具调用，返回错误 |
| CONTEXT_006 | PermissionDenied | "Permission denied: {requiredPermission}" | 拒绝操作，返回权限错误 |
| CONTEXT_007 | InvalidMemoryType | "Invalid memory type: {memoryType}" | 返回错误，拒绝无效的记忆类型 |

### 错误响应格式

```typescript
interface ContextError {
  code: string;      // 错误码
  message: string;   // 错误消息
  details?: unknown; // 错误详情
  contextId?: string; // 关联的上下文ID
}
```

## 枚举类型定义

### ContextStatus

| 值 | 描述 |
|----|------|
| Initializing | 初始化中 |
| Ready | 就绪 |
| Executing | 执行中 |
| Completed | 已完成 |
| Failed | 失败 |
| Timeout | 超时 |

### MemoryType

| 值 | 描述 |
|----|------|
| Personal | 个人记忆 |
| Enterprise | 企业知识 |
| Session | 会话记忆 |
| Correction | 错题集 |

### PermissionLevel

| 值 | 描述 | 可执行操作 |
|----|------|------------|
| ReadOnly | 只读 | 读操作 |
| Standard | 标准 | 读+标准写+标准工具 |
| Elevated | 提升权限 | 读+写+标准工具+提升工具 |
| Admin | 管理员 | 所有操作 |

## 边界条件

1. **空allowedTools**: 当allowedTools为空数组时，表示允许使用所有工具
2. **空allowedMemoryTypes**: 当allowedMemoryTypes为空时，memoryInjector应返回空列表
3. **最大嵌套深度**: 固定为3层，超过后必须等待子调用完成
4. **最大超时时间**: 86400000ms（24小时），防止资源泄漏
5. **最大customSystemPrompt长度**: 4096字符，防止提示词注入
6. **并发上下文创建**: 支持同一Sub-Agent创建多个独立上下文
7. **上下文状态转换**: Initializing -> Ready -> Executing -> Completed/Failed/Timeout
