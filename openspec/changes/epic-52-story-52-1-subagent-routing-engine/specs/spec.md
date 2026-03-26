# Specification: Sub-Agent路由引擎 - 触发条件匹配

## 需求来源

### PRD 需求

| 需求ID | 描述 | 覆盖方式 |
|--------|------|----------|
| FR930 | SubAgent路由 - 关键词匹配 | KeywordMatcher实现 |
| FR931 | SubAgent路由 - 意图匹配 | IntentMatcher实现 |
| FR932 | SubAgent路由 - 评分排序 | ScoringEngine实现 |

### NFR 非功能需求

| 需求ID | 描述 | 覆盖方式 |
|--------|------|----------|
| NFR1 | 响应性 - 单次响应 < 2秒 | 路由性能要求 < 100ms |
| NFR16 | 可扩展性 - 模块化设计 | 三种匹配策略解耦 |

### 架构约束

| ADR ID | 描述 | 覆盖方式 |
|--------|------|----------|
| ADR-013 | SubAgent架构 | 路由引擎作为入口 |
| ADR-037 | 适配器模式 | LLM接口抽象 |

### UX 规范

| UX ID | 描述 | 覆盖方式 |
|--------|------|----------|
| UX-01 | VSCode风格布局 | SubAgentRouting.tsx组件 |

## 功能规格

### 用户故事

```
As an Epic 52 user,
I want to 实现sub-agent路由引擎，基于配置的触发条件（关键词、意图、场景）自动选择匹配的sub-agent,
So that 我可以自动获得最适合当前任务的Sub-Agent服务.
```

## 输入输出规格

### SubAgentRouter.route()

#### 输入 (RoutingInput)

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| userInput | string | 是 | 非空, maxLength: 5000 | 用户原始输入 |
| intent | IntentResult | 否 | 有效IntentResult对象 | 意图解析结果 |
| sceneContext | SceneContext | 否 | 有效SceneContext对象 | 场景上下文 |

#### 输出 (RoutingResult[])

| 字段 | 类型 | 描述 |
|------|------|------|
| subAgentId | string | Sub-Agent唯一标识 |
| score | number | 总评分 (0-1) |
| matchDetails | MatchDetails | 各维度得分详情 |

### MatchDetails

| 字段 | 类型 | 描述 |
|------|------|------|
| keywordScore | number | 关键词匹配得分 (0-1) |
| intentScore | number | 意图匹配得分 (0-1) |
| sceneScore | number | 场景匹配得分 (0-1) |

### KeywordMatcher.match()

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| userInput | string | 是 | 非空 | 用户输入 |

#### 输出 (KeywordMatch[])

| 字段 | 类型 | 描述 |
|------|------|------|
| subAgentId | string | Sub-Agent ID |
| matchedKeyword | string | 匹配的关键词 |
| matchType | 'exact' \| 'fuzzy' \| 'synonym' | 匹配类型 |
| score | number | 匹配得分 (0-1) |

### IntentMatcher.match()

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| intent | IntentResult | 是 | 有效对象 | 意图结果 |

#### IntentResult

| 字段 | 类型 | 描述 |
|------|------|------|
| type | string | 意图类型 |
| confidence | number | 置信度 (0-1) |
| entities | Record<string, any> | 实体信息 |

#### 输出 (IntentMatch[])

| 字段 | 类型 | 描述 |
|------|------|------|
| subAgentId | string | Sub-Agent ID |
| intentType | string | 匹配的意图类型 |
| confidence | number | 原始置信度 |
| score | number | 匹配得分 (0-1) |

### SceneMatcher.match()

#### 输入

| 字段 | 类型 | 必填 | 校验规则 | 说明 |
|------|------|------|----------|------|
| context | SceneContext | 是 | 有效对象 | 场景上下文 |

#### SceneContext

| 字段 | 类型 | 描述 |
|------|------|------|
| currentModule | string | 当前模块 |
| recentActions | string[] | 最近操作序列 |
| timeOfDay | string | 时间段 |
| userRole | string | 用户角色 |

#### 输出 (SceneMatch[])

| 字段 | 类型 | 描述 |
|------|------|------|
| subAgentId | string | Sub-Agent ID |
| matchedFactors | string[] | 匹配的因素 |
| score | number | 场景匹配得分 (0-1) |

### RoutingConfig

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| keywordWeight | number | 0.3 | 关键词权重 |
| intentWeight | number | 0.4 | 意图权重 |
| sceneWeight | number | 0.3 | 场景权重 |
| scoreThreshold | number | 0.5 | 最低评分阈值 |
| maxCandidates | number | 3 | 最大候选数 |

## 验收场景

### 场景1: 关键词精确匹配

```
Feature: 关键词精确匹配

  Scenario: 用户输入包含Sub-Agent配置的关键词
    Given 路由规则:
      | subAgentId | keywords |
      | hr_agent | ["请假", "休假", "调休"] |
      | sales_agent | ["报价", "合同", "订单"] |
    When 用户输入 "我想请假三天"
    Then 路由结果:
      | subAgentId | keywordScore | matchType |
      | hr_agent | 1.0 | exact |
    And hr_agent.score = 0.3 (keyword权重)
```

### 场景2: 模糊匹配

```
Feature: 关键词模糊匹配

  Scenario: 用户输入有轻微拼写错误
    Given 路由规则:
      | subAgentId | keywords |
      | sales_agent | ["报价", "quotation"] |
    And fuzzyThreshold = 0.8
    When 用户输入 "我想做quotaiion"
    Then 匹配 "quotation" (编辑距离3/9 = 0.67 < 0.8, 需调整阈值或使用同义词)
    When 用户输入 "我想做quotation"
    Then 匹配成功
```

### 场景3: 意图匹配

```
Feature: 意图匹配

  Scenario: 意图解析模块返回高置信度结果
    Given 意图映射:
      | intentType | subAgentId | minConfidence |
      | file_operation | file_agent | 0.7 |
      | data_query | data_agent | 0.7 |
    When 意图结果为 { type: "file_operation", confidence: 0.85 }
    Then 路由结果包含 file_agent
    And intentScore = 0.85 * 0.4 (intent权重)
```

### 场景4: 场景匹配

```
Feature: 场景匹配

  Scenario: 基于当前模块和操作历史匹配
    Given 场景规则:
      | subAgentId | modules | actionPatterns |
      | approval_agent | ["hr", "finance"] | [["clock_in"], ["apply_leave"]] |
    When 场景上下文:
      """
      {
        "currentModule": "hr",
        "recentActions": ["view_profile", "apply_leave"],
        "timeOfDay": "morning"
      }
      """
    Then 路由结果:
      | subAgentId | sceneScore | matchedFactors |
      | approval_agent | 0.8 | ["module:hr", "action_pattern"] |
```

### 场景5: 综合评分排序

```
Feature: 综合评分排序

  Scenario: 多种匹配因素综合评分
    Given 路由配置:
      | keywordWeight | intentWeight | sceneWeight |
      | 0.3 | 0.4 | 0.3 |
    And 匹配结果:
      | subAgentId | keywordScore | intentScore | sceneScore |
      | hr_agent | 1.0 | 0.8 | 0.6 |
      | sales_agent | 0.3 | 0.9 | 0.2 |
    When 计算总分
    Then hr_agent:
      - total = 1.0*0.3 + 0.8*0.4 + 0.6*0.3 = 0.3 + 0.32 + 0.18 = 0.80
    And sales_agent:
      - total = 0.3*0.3 + 0.9*0.4 + 0.2*0.3 = 0.09 + 0.36 + 0.06 = 0.51
    And 排序结果: [hr_agent, sales_agent]
```

### 场景6: 阈值过滤

```
Feature: 阈值过滤

  Scenario: 低于阈值的候选被过滤
    Given scoreThreshold = 0.5
    And 候选评分: [0.8, 0.45, 0.3]
    When 返回结果
    Then 只返回 score >= 0.5 的候选
    And 结果: [0.8]
```

### 场景7: 缓存命中

```
Feature: 路由缓存

  Scenario: 相同输入返回缓存结果
    Given 相同输入已缓存结果
    When 再次路由相同输入
    Then 直接返回缓存结果
    And 不重新计算匹配
```

## 边界条件

### 输入边界

| 条件 | 预期行为 |
|------|----------|
| userInput为空 | 返回验证错误 INVALID_INPUT |
| userInput超长 (>5000字符) | 截断处理或返回错误 |
| intent.type为空 | 跳过意图匹配 |
| sceneContext缺失字段 | 使用默认值 |

### 状态边界

| 条件 | 预期行为 |
|------|----------|
| 无匹配结果 | 返回空数组或默认SubAgent |
| 所有得分低于阈值 | 返回空数组 |
| 规则配置为空 | 使用默认规则 |

### 并发边界

| 条件 | 预期行为 |
|------|----------|
| 并发路由请求 | 独立缓存，互不影响 |
| 规则更新中路由 | 使用旧规则或阻塞更新 |

## 错误码定义

### 路由引擎错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| ROUTE_001 | Invalid input: userInput is empty | 验证失败，拒绝处理 |
| ROUTE_002 | Routing timeout | 返回缓存或降级结果 |
| ROUTE_003 | No matching subagent found | 返回空结果或默认SubAgent |
| ROUTE_004 | All scores below threshold | 过滤后返回空结果 |
| ROUTE_005 | Matcher initialization failed | 使用备用匹配器 |

### 匹配器错误码

| 错误码 | 错误信息 | 处理方式 |
|--------|----------|----------|
| MATCH_001 | Keyword rule not found | 跳过该规则 |
| MATCH_002 | Intent parser not available | 跳过意图匹配 |
| MATCH_003 | Scene context invalid | 使用默认场景 |
| MATCH_004 | Fuzzy matching timeout | 降级为精确匹配 |

## 数据类型定义

### RoutingRule

```typescript
interface RoutingRule {
  id: string;
  subAgentId: string;
  ruleType: 'keyword' | 'intent' | 'scene';
  config: KeywordRule | IntentRule | SceneRule;
  priority: number;
  enabled: boolean;
}

interface KeywordRule {
  keywords: string[];
  synonyms?: Record<string, string[]>;
  weight: number;
}

interface IntentRule {
  intentTypes: string[];
  minConfidence: number;
}

interface SceneRule {
  modules?: string[];
  actionPatterns?: string[][];
  timeOfDay?: string[];
  userRoles?: string[];
}
```

### IntentResult

```typescript
interface IntentResult {
  type: string;
  confidence: number;
  entities: Record<string, any>;
  raw?: any;
}
```

### SceneContext

```typescript
interface SceneContext {
  currentModule: string;
  recentActions: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  userRole?: string;
  metadata?: Record<string, any>;
}
```

## 验收标准检查清单

### AC1: SubAgentRouter核心类

- [ ] SubAgentRouter类实现完整
- [ ] route()方法协调三种匹配策略
- [ ] 缓存机制正常工作
- [ ] 与SubAgentRouting.tsx集成

### AC2: 关键词匹配

- [ ] 精确匹配正确识别
- [ ] 模糊匹配（编辑距离）正确实现
- [ ] 同义词扩展正确
- [ ] 权重计算正确

### AC3: 意图匹配

- [ ] 与IntentParsing模块正确对接
- [ ] 意图类型映射正确
- [ ] 置信度阈值过滤正确
- [ ] 得分计算正确

### AC4: 场景匹配

- [ ] 模块上下文识别正确
- [ ] 操作历史分析正确
- [ ] 场景因素提取正确
- [ ] 得分计算正确

### AC5: 评分排序

- [ ] 权重配置生效
- [ ] 加权评分计算正确
- [ ] 结果降序排序正确
- [ ] 阈值过滤正确
- [ ] 去重机制正常

### AC6: 端到端

- [ ] 用户输入 → 路由决策 → 结果返回
- [ ] 响应时间 < 100ms
- [ ] UI组件正确展示结果
