# Specification: Sub-Agent嵌套调用控制

## 需求来源

### PRD 需求
- FR935: Sub-Agent嵌套调用必须支持深度控制
- FR937: Sub-Agent嵌套调用必须支持调用链路追踪
- FR938: Sub-Agent嵌套调用必须支持循环检测

### 架构约束
- ADR-013: Sub-Agent架构设计规范

### UX 规范
- UX-01: Agent对话交互规范
- UX-04: 实时状态展示规范

## 功能规格

### 用户故事

**As an** Agent Runtime System,
**I want to** 实现Sub-Agent嵌套调用机制，支持最多3层嵌套，包含深度控制和调用链路追踪,
**So that** 我可以安全、可控地处理复杂的多级Sub-Agent协同任务，同时防止无限递归和循环调用。

### 核心概念

1. **NestedCallController**: 嵌套调用控制器，负责协调嵌套调用的执行、深度控制、超时管理
2. **CallStackTracker**: 调用栈追踪器，记录完整的调用链路
3. **CycleDetector**: 循环检测器，防止A→B→A等循环调用模式
4. **CallChainData**: 调用链路可视化数据，包含完整的调用树信息

## 输入输出规格

### execute_nested_call 输入

| 字段 | 类型 | 必填 | 默认值 | 校验规则 | 描述 |
|------|------|------|--------|----------|------|
| parentContextId | string | 是 | - | 非空，UUID格式 | 父上下文ID |
| subAgentId | string | 是 | - | 非空，长度1-128 | 要调用的Sub-Agent ID |
| parameters | Record<string, unknown> | 是 | {} | - | 调用参数 |
| timeoutMs | number | 否 | 按层级计算 | 正整数，最大86400000 | 超时时间（毫秒） |

### execute_nested_call 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| callId | string | 调用唯一标识（UUID格式） |
| contextId | string | 关联的上下文ID |
| status | NestedCallStatus | 调用状态 |
| result | unknown | 调用结果（成功时） |
| error | NestedCallError | 错误信息（失败时） |
| callChain | CallChainData | 完整调用链路数据 |

### get_call_stack_info 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| contextId | string | 是 | 非空，UUID格式 | 上下文ID |

### get_call_stack_info 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| rootContextId | string | 根上下文ID |
| currentContextId | string | 当前上下文ID |
| currentDepth | number | 当前深度 |
| maxDepth | number | 历史最大深度 |
| stack | CallStackFrame[] | 调用栈帧列表 |

### cancel_nested_call 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| callId | string | 是 | 非空，UUID格式 | 要取消的调用ID |

### get_call_chain 输入/输出

| 字段 | 类型 | 描述 |
|------|------|------|
| callId | string | 调用ID（输入） |
| callId | string | 调用ID |
| rootCallId | string | 根调用ID |
| depth | number | 调用深度 |
| chain | CallChainNode[] | 调用链节点列表 |
| startTime | number | 开始时间（Unix毫秒） |
| endTime | number | 结束时间（Unix毫秒） |
| durationMs | number | 总耗时（毫秒） |

### CallChainNode 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| callId | string | 调用ID |
| subAgentId | string | Sub-Agent ID |
| subAgentName | string | Sub-Agent名称 |
| parentCallId | string | 父调用ID |
| childCallIds | string[] | 子调用ID列表 |
| depth | number | 层级深度 |
| status | NestedCallStatus | 状态 |
| startTime | number | 开始时间 |
| endTime | number | 结束时间 |

## 验收场景

### 场景1: 正常嵌套调用（第1层）

- **GIVEN** 主Agent创建了一个上下文，depth为0
- **WHEN** 主Agent调用第一个Sub-Agent
- **THEN** 调用成功执行，context depth变为1

**详细步骤**:
1. 检查当前depth（0）< 最大深度（3）
2. 检测是否形成循环（无）
3. 创建子上下文，depth为1
4. 执行Sub-Agent调用
5. 调用完成后，depth恢复为0

### 场景2: 嵌套调用至第2层

- **GIVEN** 当前调用depth为1（已在第1层嵌套）
- **WHEN** Sub-Agent再次调用另一个Sub-Agent
- **THEN** 调用成功执行，depth变为2

**详细步骤**:
1. 检查当前depth（1）< 最大深度（3）
2. 检测是否形成循环（无）
3. 创建子上下文，depth为2
4. 执行Sub-Agent调用
5. 调用完成后，depth恢复为1

### 场景3: 超出最大深度限制

- **GIVEN** 当前调用depth已达到3
- **WHEN** Sub-Agent尝试再次嵌套调用
- **THEN** 系统拒绝调用，返回`MaxDepthExceeded`错误

**详细步骤**:
1. 检查当前depth（3）>= 最大深度（3）
2. 直接返回错误，不创建新上下文
3. 错误码为`MAX_DEPTH_EXCEEDED`

### 场景4: 循环调用检测 - 直接自调用

- **GIVEN** Sub-Agent A的上下文
- **WHEN** Sub-Agent A尝试调用自己
- **THEN** 系统拒绝调用，返回`CycleDetected`错误

**详细步骤**:
1. 检测到caller_sub_agent_id == callee_sub_agent_id
2. 返回错误，错误码为`CYCLE_DETECTED`

### 场景5: 循环调用检测 - 间接循环

- **GIVEN** Sub-Agent A → Sub-Agent B → Sub-Agent C的调用链
- **WHEN** Sub-Agent C尝试调用Sub-Agent A
- **THEN** 系统拒绝调用，返回`CycleDetected`错误

**详细步骤**:
1. 获取Sub-Agent C的调用历史（包含A、B）
2. 检测到A已在历史中，会形成循环
3. 返回错误，错误码为`CYCLE_DETECTED`

### 场景6: 调用超时控制

- **GIVEN** 嵌套调用配置了timeoutMs为5000
- **WHEN** Sub-Agent执行时间超过5秒
- **THEN** 调用被强制取消，返回`Timeout`错误

**详细步骤**:
1. 记录调用开始时间
2. 使用tokio::timeout监控执行时间
3. 超过timeoutMs后强制取消
4. 返回错误，错误码为`TIMEOUT`

### 场景7: 调用栈追踪

- **GIVEN** 发生了3层嵌套调用
- **WHEN** 调用完成后查询调用栈
- **THEN** 返回完整的调用链路，包含所有3层信息

**详细步骤**:
1. 调用`get_call_stack_info`
2. 返回CallStackInfo包含完整的stack
3. 每个CallStackFrame包含contextId、callId、subAgentId等

### 场景8: 取消嵌套调用

- **GIVEN** 一个嵌套调用正在执行中
- **WHEN** 调用`cancel_nested_call`
- **THEN** 调用被取消，状态更新为Cancelled

**详细步骤**:
1. 根据callId找到对应的调用
2. 更新状态为Cancelled
3. 清理相关资源
4. 返回成功

## 错误处理

### 错误码定义

| 错误码 | 错误名称 | 错误信息 | 处理方式 |
|--------|----------|----------|----------|
| NESTED_001 | MaxDepthExceeded | "Maximum nesting depth {max} exceeded" | 返回错误，要求重构调用结构 |
| NESTED_002 | CycleDetected | "Cycle detected in sub-agent call chain" | 返回错误，要求检查调用设计 |
| NESTED_003 | Timeout | "Call timed out after {timeout}ms" | 返回错误，可选择重试 |
| NESTED_004 | ContextNotFound | "Context not found: {contextId}" | 返回404，检查上下文ID |
| NESTED_005 | CallNotFound | "Call not found: {callId}" | 返回404，检查调用ID |
| NESTED_006 | InvalidParameters | "Invalid call parameters: {detail}" | 返回错误，检查参数格式 |
| NESTED_007 | SubAgentNotFound | "Sub-agent not found: {subAgentId}" | 返回404，检查Sub-Agent ID |

### 错误响应格式

```typescript
interface NestedCallError {
  code: string;      // 错误码
  message: string;   // 错误消息
  details?: {
    current_depth?: number;
    max_depth?: number;
    timeout_ms?: number;
    cycle_chain?: string[];
  };
}
```

## 枚举类型定义

### NestedCallStatus

| 值 | 描述 |
|----|------|
| Pending | 待执行 |
| Running | 执行中 |
| Completed | 已完成 |
| Failed | 失败 |
| Timeout | 超时 |
| CycleDetected | 检测到循环 |
| MaxDepthExceeded | 超出最大深度 |

## 超时配置默认值

| 配置项 | 默认值 | 最大值 | 描述 |
|--------|--------|--------|------|
| defaultTimeoutPerLevel | 60000ms (1分钟) | - | 每层级默认超时 |
| timeoutIncrementPerLevel | 30000ms (30秒) | - | 每增加一层增加的超时 |
| maxTimeout | 300000ms (5分钟) | - | 最大超时限制 |

**层级超时计算公式**: `min(defaultTimeoutPerLevel + depth * timeoutIncrementPerLevel, maxTimeout)`

- 深度0: 60000ms
- 深度1: 90000ms
- 深度2: 120000ms
- 深度3: 150000ms (达到maxTimeout限制)

## 边界条件

1. **最大嵌套深度**: 固定为3层，不可配置
2. **超时时间**: 最大86400000ms（24小时），防止极端情况
3. **循环检测范围**: 基于调用历史，支持检测间接循环
4. **调用栈最大容量**: 1000帧，超出后清理最旧记录
5. **并发调用**: 支持同一上下文的多个并发子调用
6. **取消操作**: 仅能取消Pending或Running状态的调用
7. **超时精度**: 毫秒级精度，使用tokio::timeout保证
