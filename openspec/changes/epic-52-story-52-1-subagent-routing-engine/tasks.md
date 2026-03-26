# Tasks: Sub-Agent路由引擎 - 触发条件匹配

## 任务元数据

| 属性 | 值 |
|------|-----|
| **Task ID** | 115 |
| **Epic** | Epic 52 |
| **Story** | Story 52.1 |
| **标题** | Sub-Agent路由引擎 - 触发条件匹配 |
| **implementationType** | refactor |
| **phase** | Phase 2 - Sub-Agent运行时实现 |
| **priority** | medium |
| **backendRequired** | true |

## 验收标准

### AC1: SubAgentRouter核心类

- [ ] SubAgentRouter类实现完整
- [ ] 三种匹配策略整合接口定义
- [ ] 评分计算与排序逻辑正确
- [ ] 路由结果缓存机制实现
- [ ] 与前端UI组件SubAgentRouting.tsx集成

### AC2: 关键词匹配算法

- [ ] 精确关键词匹配实现（包含检查）
- [ ] 模糊匹配实现（编辑距离算法）
- [ ] 同义词扩展匹配实现
- [ ] 关键词权重配置支持
- [ ] 关键词匹配得分计算正确

### AC3: 意图匹配集成

- [ ] 与IntentParsing模块接口对接
- [ ] 意图类型到Sub-Agent映射表实现
- [ ] 意图置信度阈值控制
- [ ] 意图匹配得分计算正确

### AC4: 场景匹配逻辑

- [ ] 当前模块上下文识别
- [ ] 用户操作历史分析
- [ ] 时间/地点等场景因素提取
- [ ] 场景匹配得分计算正确

### AC5: 匹配度评分与排序

- [ ] 评分权重配置（可调整）
- [ ] 加权评分计算实现
- [ ] 结果排序正确
- [ ] 评分阈值过滤实现
- [ ] 结果去重机制

## 任务列表

### Task 115.1: 创建SubAgentRouter核心类 (前端)

**步骤**:
1. 创建 `src/features/subagent/routing/SubAgentRouter.ts`
2. 定义RoutingConfig接口
3. 实现route()方法，协调三种匹配策略
4. 实现缓存机制
5. 编写单元测试

**产出**:
- `src/features/subagent/routing/SubAgentRouter.ts`
- `src/features/subagent/routing/SubAgentRouter.test.ts`

### Task 115.2: 实现KeywordMatcher

**步骤**:
1. 创建 `src/features/subagent/routing/KeywordMatcher.ts`
2. 实现精确匹配算法（包含检查）
3. 实现模糊匹配算法（Levenshtein距离）
4. 实现同义词扩展匹配
5. 实现关键词权重计算
6. 编写单元测试

**产出**:
- `src/features/subagent/routing/KeywordMatcher.ts`
- `src/features/subagent/routing/KeywordMatcher.test.ts`

### Task 115.3: 实现IntentMatcher

**步骤**:
1. 创建 `src/features/subagent/routing/IntentMatcher.ts`
2. 实现与IntentParsing模块接口对接
3. 实现意图类型到Sub-Agent映射表
4. 实现意图置信度阈值过滤
5. 实现意图匹配得分计算
6. 编写单元测试

**产出**:
- `src/features/subagent/routing/IntentMatcher.ts`
- `src/features/subagent/routing/IntentMatcher.test.ts`

### Task 115.4: 实现SceneMatcher

**步骤**:
1. 创建 `src/features/subagent/routing/SceneMatcher.ts`
2. 实现当前模块上下文识别
3. 实现用户操作历史分析
4. 实现时间/地点场景因素提取
5. 实现场景匹配得分计算
6. 编写单元测试

**产出**:
- `src/features/subagent/routing/SceneMatcher.ts`
- `src/features/subagent/routing/SceneMatcher.test.ts`

### Task 115.5: 实现ScoringEngine

**步骤**:
1. 创建 `src/features/subagent/routing/ScoringEngine.ts`
2. 实现加权评分计算
3. 实现结果聚合
4. 实现排序逻辑
5. 实现阈值过滤
6. 编写单元测试

**产出**:
- `src/features/subagent/routing/ScoringEngine.ts`
- `src/features/subagent/routing/ScoringEngine.test.ts`

### Task 115.6: 创建SubAgentRouter后端实现 (Rust)

**步骤**:
1. 创建 `src-tauri/src/agent/subagent/routing/` 目录
2. 实现 `router.rs` - 路由核心
3. 实现 `keyword_matcher.rs` - 关键词匹配
4. 实现 `intent_matcher.rs` - 意图匹配
5. 实现 `scene_matcher.rs` - 场景匹配
6. 添加Tauri命令暴露
7. 编写集成测试

**产出**:
- `src-tauri/src/agent/subagent/routing/mod.rs`
- `src-tauri/src/agent/subagent/routing/router.rs`
- `src-tauri/src/agent/subagent/routing/keyword_matcher.rs`
- `src-tauri/src/agent/subagent/routing/intent_matcher.rs`
- `src-tauri/src/agent/subagent/routing/scene_matcher.rs`

### Task 115.7: 集成SubAgentRouting.tsx UI组件

**步骤**:
1. 读取现有 `SubAgentRouting.tsx`
2. 集成SubAgentRouter核心逻辑
3. 实现路由配置UI
4. 实现路由结果展示
5. 添加路由历史记录
6. 浏览器测试验证

**产出**:
- 更新后的 `src/features/settings/components/SubAgentRouting.tsx`

### Task 115.8: 端到端集成测试

**步骤**:
1. 创建端到端测试场景
2. 测试关键词匹配流程
3. 测试意图匹配流程
4. 测试场景匹配流程
5. 测试综合评分排序
6. 验证UI组件功能

**产出**:
- `tests/e2e/subagent/routing.test.ts`

## 执行顺序

```
[Task 115.1] SubAgentRouter核心类
       ↓
[Task 115.2] KeywordMatcher ──┐
       ↓                     │
[Task 115.3] IntentMatcher ──┼─ 并行开发
       ↓                     │
[Task 115.4] SceneMatcher ──┘
       ↓
[Task 115.5] ScoringEngine
       ↓
[Task 115.6] 后端Rust实现 (并行)
       ↓
[Task 115.7] UI集成
       ↓
[Task 115.8] E2E测试 ← 需要 Story 21.16/21.17/51.1 完成
```

## 前置条件检查

在开始Task 115.8之前，必须确认以下Story已完成：

| Story | 名称 | 验证方式 |
|-------|------|----------|
| Story 21.16 | 意图解析 - 意图识别 | IntentResult类型定义存在 |
| Story 21.17 | 意图解析 - 意图置信度 | confidence字段可用 |
| Story 51.1 | 主Agent协调器 - 核心协调模块 | AgentOrchestrator可调用 |

## 测试要点

### 单元测试

**KeywordMatcher**
- 精确匹配：包含关系正确识别
- 模糊匹配：编辑距离阈值正确
- 同义词匹配：同义词扩展正确
- 权重计算：多关键词累积正确

**IntentMatcher**
- 意图映射：类型到SubAgent映射正确
- 阈值过滤：低于阈值不匹配
- 得分计算：置信度正确映射

**SceneMatcher**
- 模块匹配：当前模块识别正确
- 序列匹配：操作历史模式匹配
- 组合得分：多因素加权正确

**ScoringEngine**
- 权重配置：可调整权重生效
- 聚合计算：多维度得分相加
- 排序算法：降序排列正确
- 阈值过滤：低于阈值过滤

### 集成测试

- 三种匹配策略并行执行
- 评分引擎正确聚合
- 路由结果缓存命中
- UI组件正确展示

### E2E测试

- 用户输入 → 路由决策 → SubAgent执行
- 多轮对话场景路由稳定
- 跨模块切换路由正确

## 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| IntentParsing未初始化 | 使用空意图，仅依赖关键词和场景 |
| 缓存未命中 | 重新计算，更新缓存 |
| 所有匹配得分低于阈值 | 返回空结果或默认SubAgent |
| 规则配置无效 | 跳过无效规则，记录日志 |

## 里程碑

| 里程碑 | 描述 | 完成标准 |
|--------|------|----------|
| M1: 核心路由 | SubAgentRouter + 三种Matcher完成 | 单元测试通过率 100% |
| M2: 后端实现 | Rust后端路由完成 | 集成测试通过 |
| M3: UI集成 | SubAgentRouting.tsx集成完成 | 浏览器测试通过 |
| M4: E2E验证 | 完整路由流程验证 | E2E测试通过 |
