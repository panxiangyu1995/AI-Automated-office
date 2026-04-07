# Specification: 审批AI辅助能力

## 需求来源

### PRD 需求
- FR175: AI可以在审批时提供风险提示（金额异常、发票真伪等）
- FR176: AI可以为管理层生成审批摘要日报
- FR177: AI支持对话式查询审批历史
- FR178: AI可以在发起审批时智能填充表单内容
- FR179: AI可以基于历史数据预测审批通过概率

## 功能规格

### 用户故事

As an **审批人**,
I want **AI帮我识别审批风险**,
So that **不会漏掉潜在问题**。

As a **管理层**,
I want **AI帮我生成审批摘要日报**,
So that **快速了解审批情况**。

### 验收场景

#### Scenario 1: 金额异常检测（FR175）
- **GIVEN** 报销金额超过历史平均3倍
- **WHEN** AI分析审批
- **THEN** 显示"金额异常"风险提示

#### Scenario 2: 审批摘要（FR176）
- **GIVEN** 管理层请求日报
- **WHEN** AI生成摘要
- **THEN** 返回总数、分类统计、趋势分析

#### Scenario 3: 智能填充（FR178）
- **GIVEN** 用户发起审批
- **WHEN** 输入项目名称
- **THEN** AI自动填充历史相似的报销标准

## 数据规格

### RiskAlert
| 字段 | 类型 | 描述 |
|------|------|------|
| level | String | high/medium/low/critical |
| type | String | 风险类型 |
| message | String | 风险描述 |
| evidence | JSON | 证据数据 |

### ApprovalSummary
| 字段 | 类型 | 描述 |
|------|------|------|
| total_count | i32 | 总数 |
| total_amount | f64 | 总金额 |
| by_type | JSON | 分类统计 |
| trends | JSON | 趋势分析 |
