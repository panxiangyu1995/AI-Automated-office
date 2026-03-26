# Specification: 错题集规则自动应用

## 需求来源

### PRD 需求
- FR446: 必须实现基于场景的规则自动检索
- FR447: 必须实现规则效果反馈收集

### 架构约束
- ADR-043: Agent 核心模块设计

### UX 规范
- UX-01: AI 即入口，透明可控

## 功能规格

### 用户故事

**As an** Agent Runtime,
**I want to** 在执行任务时自动检索和应用匹配的错题集规则，
**So that** 避免重复犯错，提高任务执行准确性。

## 输入输出规格

### 输入规格

#### invoke_match_correction_rules 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| session_id | string | 是 | 会话唯一标识 | 非空 |
| context | RuleMatchContext | 是 | 匹配上下文 | 非空 |

#### RuleMatchContext 结构

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| current_task | string | 是 | 当前任务描述 | 非空，最大 2000 字符 |
| scene_type | string | 是 | 场景类型 | 非空 |
| user_input | string | 是 | 用户输入 | 非空，最大 10000 字符 |
| relevant_memories | string[] | 否 | 相关记忆 | 可选 |

#### invoke_feedback_rule_effectiveness 命令输入

| 字段 | 类型 | 必填 | 描述 | 校验规则 |
|------|------|------|------|----------|
| feedback_id | string | 是 | 反馈唯一标识 | 非空 |
| rule_id | string | 是 | 规则唯一标识 | 非空 |
| session_id | string | 是 | 会话唯一标识 | 非空 |
| task_result | string | 是 | 任务结果 | 非空 |
| was_helpful | boolean | 是 | 规则是否有帮助 | 必填 |
| user_rating | number | 否 | 用户评分 | 1-5 |
| comments | string | 否 | 用户评论 | 最大 500 字符 |

### 输出规格

#### invoke_match_correction_rules 命令输出

| 字段 | 类型 | 描述 |
|------|------|------|
| success | boolean | 匹配是否成功 |
| matched_rules | RuleMatchResult[] | 匹配的规则列表 |
| total_candidates | number | 候选规则总数 |

#### RuleMatchResult 结构

| 字段 | 类型 | 描述 |
|------|------|------|
| rule_id | string | 规则 ID |
| scenario | string | 场景类型 |
| instruction | string | 规则指令 |
| match_score | number | 匹配分数 (0-1) |
| match_type | string | 匹配类型 |
| matched_keywords | string[] | 匹配的关键词 |

## 验收场景

### 场景 1: 关键词精确匹配

**Given** 错题集中有规则 `rule_contract_amount_uppercase`
**And** 关键词为 `["合同", "金额", "大写"]`
**When** 用户输入 "帮我创建一个合同，金额是壹佰万元"
**Then** 系统匹配到该规则
**And** match_type = "ExactKeyword"
**And** match_score > 0.8

### 场景 2: 语义相似匹配

**Given** 错题集中有规则 `rule_approval_process`
**When** 用户输入 "申请采购办公设备"
**Then** 系统通过语义匹配识别相关规则
**And** match_type = "SemanticSimilar"
**And** match_score > similarity_threshold

### 场景 3: 多规则排序

**Given** 用户输入匹配到 3 条规则
**When** 匹配结果排序
**Then** 按 match_score * priority_weight 降序排列
**And** 保留 top N 条（N = max_rules_per_scene）

### 场景 4: 规则提示词注入

**Given** 匹配到 2 条规则
**When** 调用 PromptBuilder 构建提示词
**Then** 生成包含规则指令和示例的提示词片段
**And** 格式符合设计规范

### 场景 5: 规则应用审计

**Given** Agent 执行使用了匹配到的规则
**When** 执行完成
**Then** 审计器记录 `RuleApplicationEvent`
**And** 包含规则 ID、分数、应用结果

### 场景 6: 效果反馈提交

**Given** 用户完成了一个使用规则的任务
**When** 用户提交规则效果反馈
**Then** 反馈被记录到审计系统
**And** 可用于规则效果统计

### 场景 7: 规则统计查询

**Given** 管理员查询规则使用统计
**When** 调用 `invoke_get_rule_statistics`
**Then** 返回该规则的应用次数、成功率、平均评分

### 场景 8: 无匹配规则

**Given** 用户输入不匹配任何规则
**When** 匹配执行
**Then** 返回空列表
**And** 不报错

## 错误处理

### 错误码定义

| 错误码 | 错误信息 | 处理方式 | 严重级别 |
|--------|----------|----------|----------|
| CR001 | Session not found | 返回错误 | ERROR |
| CR002 | Rule store unavailable | 返回警告，使用空规则列表 | WARN |
| CR003 | Invalid context | 返回错误 | ERROR |
| CR004 | Feedback submission failed | 返回错误，可重试 | ERROR |
| CR005 | Rule not found | 返回错误 | ERROR |
| CR006 | Statistics unavailable | 返回错误 | ERROR |

### 错误响应结构

```json
{
  "success": false,
  "error": {
    "code": "CR002",
    "message": "Rule store unavailable",
    "severity": "WARN"
  },
  "matched_rules": [],
  "total_candidates": 0
}
```

## 边界条件

### 边界条件清单

| 边界条件 | 预期行为 |
|----------|----------|
| session_id 为空 | 返回 CR001 错误 |
| current_task 为空 | 返回 CR003 错误 |
| 无匹配规则 | 返回空列表，success: true |
| 匹配规则超过 N 条 | 按分数排序，保留前 N 条 |
| rule_id 不存在 | 返回 CR005 错误 |
| 反馈提交失败 | 返回 CR004 错误，可重试 |
| 相关记忆为空 | 使用空列表继续匹配 |

### 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| similarity_threshold | 0.7 | 语义匹配阈值 |
| max_rules_per_scene | 5 | 每场景最大规则数 |
| max_keywords_match | 10 | 最大关键词匹配数 |
| priority_weight | 0.3 | 优先级权重 |

### 匹配分数计算

```
final_score = match_score * (1 + priority * priority_weight)

其中:
- match_score: 匹配分数 (0-1)
- priority: 规则优先级 (1-10)
- priority_weight: 优先级权重 (默认 0.3)
```

### 规则示例格式

```
【执行规则 - 合同金额大写】

请确保合同金额使用正确的大写格式。
示例：
- 错误：壹佰万元整
- 正确：壹佰万元整（正确的大写金额）

【执行规则 - 合同审批流程】

合同金额超过10万元必须经过财务总监审批。
示例：
- 错误：直接签署合同
- 正确：先提交财务审批，获得批准后再签署
```
