# Specification: Sub-Agent结果汇总与回传

## 需求来源

### PRD 需求
- FR933: Sub-Agent执行结果必须支持格式归一化
- FR934: Sub-Agent执行结果必须支持上下文整合
- FR936: Sub-Agent执行结果必须包含执行摘要

### 架构约束
- ADR-013: Sub-Agent架构设计规范
- ADR-037: 工具系统设计规范

### UX 规范
- UX-01: Agent对话交互规范
- UX-04: 实时状态展示规范

## 功能规格

### 用户故事

**As an** Agent Runtime System,
**I want to** 实现sub-agent执行结果返回主agent的机制，包括结果格式化、上下文整合、执行摘要生成,
**So that** 主Agent能够正确接收和处理Sub-Agent的执行结果，并将其整合到自己的上下文中。

### 核心概念

1. **SubAgentResult**: 归一化的执行结果，包含状态、摘要、数据、错误等完整信息
2. **ExecutionSummary**: 执行摘要，包含概述、工具使用、关键决策、后续建议
3. **ContextIntegrator**: 上下文整合器，负责将Sub-Agent结果合并到主上下文
4. **IntegrationStrategy**: 整合策略，控制记忆和状态合并的行为

## 输入输出规格

### normalize_result 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| callId | string | 是 | 非空，UUID格式 | 调用ID |
| rawResult | unknown | 是 | - | 原始执行结果（任意格式） |

### normalize_result 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| resultId | string | 结果唯一标识 |
| callId | string | 关联的调用ID |
| contextId | string | 关联的上下文ID |
| status | SubAgentResultStatus | 执行状态 |
| summary | ExecutionSummary | 执行摘要 |
| data | unknown | 返回数据（成功时） |
| error | SubAgentError | 错误信息（失败时） |
| startTime | number | 开始时间 |
| endTime | number | 结束时间 |
| durationMs | number | 总耗时 |

### integrate_to_main_context 输入

| 字段 | 类型 | 必填 | 默认值 | 校验规则 | 描述 |
|------|------|------|--------|----------|------|
| mainContextId | string | 是 | - | 非空，UUID格式 | 主Agent上下文ID |
| result | SubAgentResult | 是 | - | - | Sub-Agent执行结果 |
| strategy | IntegrationStrategy | 否 | Merge | 枚举值 | 整合策略 |

### integrate_to_main_context 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 是否成功 |
| updatedContext | SubAgentExecutionContext | 整合后的上下文 |
| conflicts | IntegrationConflict[] | 冲突列表 |
| warnings | string[] | 警告列表 |

### get_result_visualization 输入

| 字段 | 类型 | 必填 | 校验规则 | 描述 |
|------|------|------|----------|------|
| resultId | string | 是 | 非空，UUID格式 | 结果ID |

### get_result_visualization 输出

| 字段 | 类型 | 描述 |
|------|------|------|
| resultId | string | 结果ID |
| status | SubAgentResultStatus | 执行状态 |
| timeline | TimelineEvent[] | 执行时间线 |
| toolUsageStats | ToolUsageStat[] | 工具使用统计 |
| callTree | CallTreeNode | 调用树 |

## 验收场景

### 场景1: 成功结果归一化

- **GIVEN** Sub-Agent执行成功，返回了原始结果数据
- **WHEN** 调用`normalize_result`处理原始结果
- **THEN** 返回归一化的`SubAgentResult`，包含完整的执行摘要

**详细步骤**:
1. 解析原始结果格式（支持简单值、结构化对象等）
2. 验证结果有效性
3. 生成执行摘要（overview、toolsUsed等）
4. 构建完整的`SubAgentResult`并返回

### 场景2: 失败结果归一化

- **GIVEN** Sub-Agent执行失败，返回了错误信息
- **WHEN** 调用`normalize_result`处理错误结果
- **THEN** 返回归一化的`SubAgentResult`，status为Failed，包含fallbackSuggestions

**详细步骤**:
1. 解析错误信息
2. 生成失败摘要
3. 生成回退建议
4. 构建完整的`SubAgentResult`并返回

### 场景3: 执行摘要自动生成

- **GIVEN** Sub-Agent执行完成，使用了多个工具
- **WHEN** 生成执行摘要
- **THEN** 摘要包含overview、mainOutput、toolsUsed、keyDecisions、suggestedNextSteps

**详细步骤**:
1. 收集执行元数据（工具调用、子调用数等）
2. 生成一句话概述
3. 提取主要输出（限制长度）
4. 汇总工具使用情况
5. 生成关键决策列表
6. 生成后续建议

### 场景4: Merge策略整合上下文

- **GIVEN** 主上下文有记忆M1，Sub-Agent结果产生记忆M2
- **WHEN** 使用Merge策略整合
- **THEN** 结果包含M1和M2的合并，如有冲突保留最新版本

**详细步骤**:
1. 提取主上下文的记忆
2. 提取Sub-Agent结果中的记忆
3. 识别冲突的记忆（相同ID）
4. 对于冲突：比较updatedAt，保留最新的
5. 对于不冲突：合并到一起
6. 返回合并后的上下文和冲突列表

### 场景5: Replace策略整合上下文

- **GIVEN** 主上下文有记忆M1，Sub-Agent结果产生记忆M2
- **WHEN** 使用Replace策略整合
- **THEN** 主上下文的记忆被完全替换为M2

**详细步骤**:
1. 获取Sub-Agent结果中的记忆M2
2. 直接替换主上下文的记忆
3. 返回更新后的上下文

### 场景6: 回退建议生成

- **GIVEN** Sub-Agent执行失败，错误类型为Timeout
- **WHEN** 生成回退建议
- **THEN** 返回针对超时的特定建议列表

**详细步骤**:
1. 根据错误类型分类
2. 针对Timeout类型添加：
   - "增加超时时间后重试"
   - "检查网络连接是否稳定"
3. 返回建议列表

### 场景7: 结果可视化数据生成

- **GIVEN** 复杂的嵌套Sub-Agent执行结果
- **WHEN** 调用`get_result_visualization`
- **THEN** 返回包含timeline、toolUsageStats、callTree的可视化数据

**详细步骤**:
1. 构建执行时间线事件
2. 统计工具使用情况
3. 构建调用树结构
4. 返回可视化数据

## 错误处理

### 错误码定义

| 错误码 | 错误名称 | 错误信息 | 处理方式 |
|--------|----------|----------|----------|
| RESULT_001 | InvalidFormat | "Cannot parse result into known format" | 返回原始错误，检查输入格式 |
| RESULT_002 | NullResult | "Result is null or undefined" | 返回错误，要求重新执行 |
| RESULT_003 | MissingData | "Result missing required data field" | 返回错误，检查执行状态 |
| RESULT_004 | ContextNotFound | "Context not found: {contextId}" | 返回404，检查上下文ID |
| RESULT_005 | IntegrationFailed | "Failed to integrate result: {detail}" | 返回错误，查看详情 |
| RESULT_006 | VisualizationNotFound | "Visualization data not found" | 返回404，检查resultId |

### 错误响应格式

```typescript
interface NormalizationError {
  code: string;      // 错误码
  message: string;   // 错误消息
  details?: {
    raw_result?: unknown;
    parse_error?: string;
  };
}
```

## 枚举类型定义

### SubAgentResultStatus

| 值 | 描述 |
|----|------|
| Success | 成功完成 |
| Failed | 执行失败 |
| PartialSuccess | 部分成功 |
| Timeout | 执行超时 |

### SubAgentErrorType

| 值 | 描述 |
|----|------|
| ExecutionError | 执行错误 |
| Timeout | 超时错误 |
| PermissionDenied | 权限拒绝 |
| ToolNotFound | 工具不存在 |
| InvalidInput | 输入无效 |
| ResourceExhausted | 资源耗尽 |
| Unknown | 未知错误 |

### IntegrationStrategy

| 值 | 描述 | 行为 |
|----|------|------|
| Replace | 替换 | 完全替换主上下文中的数据 |
| Merge | 合并 | 与主上下文数据合并，解决冲突 |
| Append | 追加 | 仅追加新数据，不修改已有数据 |
| Ignore | 忽略 | 不整合Sub-Agent结果 |

### ConflictType

| 值 | 描述 |
|----|------|
| MemoryConflict | 记忆冲突 |
| StateConflict | 状态冲突 |
| PermissionConflict | 权限冲突 |

## 边界条件

1. **空结果处理**: 原始结果为空时返回NullResult错误
2. **超长输出**: mainOutput超过限制时截断并添加"..."
3. **大量工具调用**: toolsUsed最多列出20个工具
4. **循环整合**: 检测到自我整合时返回错误
5. **格式兼容**: 支持JSON对象、字符串、数字等常见格式
6. **时间戳处理**: 使用Unix毫秒时间戳
7. **冲突数量**: 超过10个冲突时只返回前10个并警告
