# Specification: 记忆检索与注入集成

## 需求来源

### PRD 需求
- FR448: 必须实现 Agent 执行前的记忆检索
- FR449: 必须实现记忆的优先级排序和来源追踪

### 架构约束
- ADR-043: Agent 核心模块设计
- ADR-044: 记忆系统集成规范

### UX 规范
- UX-01: AI 即入口，透明可控
- UX-04: 操作可追溯

## 功能规格

### 用户故事

**As an** Agent Runtime,
**I want to** 在执行任务前自动检索相关记忆并注入到提示词上下文，
**So that** Agent 能够利用用户的历史偏好和上下文信息，提供更个性化的服务。

## 输入输出规格

### 输入规格

#### invoke_get_relevant_memories 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空 |
| user_input | string | 是 | 用户输入 | 非空，最大 10000 字符 |
| scene_type | string | 否 | 场景类型 | 可选 |
| limit | number | 否 | 返回数量限制 | 默认 10，最大 100 |

#### invoke_preload_session_memories 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空 |

### 输出规格

#### invoke_get_relevant_memories 命令输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 检索是否成功 |
| memories | MemoryItem[] | 记忆列表 |
| total_tokens | number | 估算的 Token 数 |
| retrieval_method | string | 检索方法 |
| source_tracking | MemorySourceMeta[] | 来源追踪信息 |

#### MemoryItem 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| memory_id | string | 记忆唯一标识 |
| content | string | 记忆内容 |
| memory_type | string | 记忆类型 |
| created_at | number | 创建时间戳 |
| last_accessed | number | 最后访问时间 |
| access_count | number | 访问次数 |
| relevance_tags | string[] | 相关性标签 |
| importance | number | 重要性等级 (1-5) |
| source | MemorySource | 来源信息 |

#### MemorySourceMeta 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| memory_id | string | 记忆 ID |
| source | MemorySource | 来源信息 |
| relevance_score | number | 相关性分数 |
| injection_position | number | 注入位置 |

## 验收场景

### 场景 1: 会话启动记忆预加载

**Given** 用户启动新会话
**When** 会话初始化
**Then** 系统自动加载用户偏好记忆
**And** 加载最近任务历史记忆
**And** 返回 MemoryContext 供 PromptBuilder 使用

### 场景 2: 用户输入触发记忆检索

**Given** 用户输入 "帮我创建一个采购合同"
**When** Agent 处理输入
**Then** 系统检索相关记忆：
- 关键词匹配: "合同", "采购"
- 语义相似: 合同创建相关记忆
**And** 按优先级排序返回 top N 条

### 场景 3: 记忆优先级排序

**Given** 检索到多条相关记忆
**When** 返回结果前
**Then** 按综合分数排序：
- 相关性分数 × 0.4
- 时间衰减分数 × 0.2
- 频率分数 × 0.2
- 重要性分数 × 0.2
**And** 高分记忆排在前面

### 场景 4: Token 限制裁剪

**Given** 相关记忆的 Token 总数超过限制
**When** 排序完成后
**Then** 从低分到高分逐一裁剪
**Until** 总 Token 数满足限制

### 场景 5: 记忆格式化注入

**Given** 返回的记忆列表
**When** PromptBuilder 注入记忆
**Then** 生成格式化的提示词片段
**And** 包含记忆类型、内容、时间、相关性

### 场景 6: 记忆来源追踪

**Given** 记忆被注入到提示词
**When** 每次注入
**Then** 记录来源追踪信息：
- memory_id
- session_id
- relevance_score
- injection_position
**And** 可通过 API 查询

### 场景 7: 敏感信息过滤

**Given** 用户记忆包含敏感信息
**When** 记忆检索
**Then** 自动过滤包含敏感词的记忆
**And** 不返回到结果中

### 场景 8: 无相关记忆

**Given** 用户输入不匹配任何记忆
**When** 检索执行
**Then** 返回空列表
**And** success: true

### 场景 9: 混合检索方法

**Given** 用户输入触发记忆检索
**When** 检索执行
**Then** 结合使用：
- 关键词匹配（快速筛选）
- 语义相似度（深度匹配）
**And** 合并去重后返回

### 场景 10: 记忆来源展示

**Given** 用户希望了解记忆来源
**When** 调用 `invoke_get_memory_source_tracking`
**Then** 返回当前会话的记忆注入历史
**And** 包含每条记忆的来源和相关性

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 处理方式 | 严重级别 |
|--------|----------|----------|----------|
| MI001 | Session not found | 返回错误 | ERROR |
| MI002 | Memory store unavailable | 返回警告，空列表 | WARN |
| MI003 | Invalid query | 返回错误 | ERROR |
| MI004 | Retrieval timeout | 返回警告，空列表 | WARN |
| MI005 | Token limit exceeded | 返回部分结果 + 警告 | WARN |
| MI006 | Sensitive content detected | 过滤后返回 | WARN |
| MI007 | Source tracking failed | 记录日志，继续 | WARN |

### 错误响应结构

```json
{
  "success": false,
  "error": {
    "code": "MI002",
    "message": "Memory store unavailable",
    "severity": "WARN"
  },
  "memories": [],
  "total_tokens": 0
}
```

## 边界条件

### 边界条件清单

| 边界条件 | 预期行为 |
|----------|----------|
| session_id 为空 | 返回 MI001 错误 |
| user_input 为空 | 返回 MI003 错误 |
| 无相关记忆 | 返回空列表，success: true |
| 记忆数量超过 limit | 按 limit 截断 |
| Token 超限 | 按优先级裁剪 |
| 记忆存储不可用 | 返回 MI002 警告，空列表 |
| 检索超时 | 返回 MI004 警告，空列表 |
| 包含敏感词 | 过滤该记忆，继续其他 |

### 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| max_memories_per_query | 10 | 每查询最大记忆数 |
| max_tokens_per_memory | 200 | 每条记忆最大 Token |
| relevance_threshold | 0.5 | 相关性阈值 |
| time_decay_factor | 0.01 | 时间衰减因子 |
| priority_weights.relevance | 0.4 | 相关性权重 |
| priority_weights.time_decay | 0.2 | 时间衰减权重 |
| priority_weights.frequency | 0.2 | 频率权重 |
| priority_weights.importance | 0.2 | 重要性权重 |

### 记忆类型定义

| 类型 | 说明 | 示例 |
|------|------|------|
| UserPreference | 用户偏好 | 偏好使用电子合同 |
| TaskHistory | 任务历史 | 经常创建采购合同 |
| ContextSnippet | 上下文片段 | 上次的合同金额是10万 |
| KeyDecision | 关键决策 | 超过10万需要总监审批 |
| PersonalFact | 个人事实 | 公司名称是XXX |

### 记忆提示词格式模板

```
【相关记忆】

{index}. [{memory_type}] {content}
   - 来源: {source.session_id} ({relative_time})
   - 相关性: {high/medium/low}

...（最多 {max_memories_per_query} 条）
```

## 性能指标

| 指标 | 目标值 |
|------|--------|
| 记忆检索延迟 | < 100ms |
| 优先级排序延迟 | < 10ms |
| 提示词生成延迟 | < 20ms |
| 敏感信息过滤延迟 | < 5ms |
