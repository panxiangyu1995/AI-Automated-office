# Design: Sub-Agent路由引擎 - 触发条件匹配

## 技术方案

### 实现类型和优先级

| 属性 | 值 |
|------|-----|
| **类型** | refactor (基于现有UI扩展) |
| **优先级** | medium |
| **阶段** | Phase 2 - Sub-Agent运行时实现 |
| **后端必需** | true |
| **铁律合规** | PRD: FR930/FR931/FR932, NFR: NFR1/NFR16, ARCH: ADR-013/ADR-037 |

### 前端实现方案

#### 技术选型

- **框架**: React + TypeScript
- **状态管理**: Zustand
- **匹配算法**: 自研 / fuse.js (模糊匹配)
- **模块集成**: IntentParsing模块

#### 目录结构

```
src/features/subagent/
├── routing/
│   ├── SubAgentRouter.ts           # 路由核心类
│   ├── KeywordMatcher.ts           # 关键词匹配器
│   ├── IntentMatcher.ts            # 意图匹配器
│   ├── SceneMatcher.ts             # 场景匹配器
│   ├── ScoringEngine.ts            # 评分引擎
│   ├── routingStore.ts             # 路由状态管理
│   └── index.ts
├── types/
│   └── routing.types.ts
└── config/
    └── defaultRules.ts             # 默认路由规则
```

#### 核心模块设计

**SubAgentRouter (路由核心类)**

```typescript
// src/features/subagent/routing/SubAgentRouter.ts

interface RoutingConfig {
  keywordWeight: number;      // 关键词权重 (default: 0.3)
  intentWeight: number;       // 意图权重 (default: 0.4)
  sceneWeight: number;        // 场景权重 (default: 0.3)
  scoreThreshold: number;     // 最低评分阈值 (default: 0.5)
  maxCandidates: number;      // 最大候选数 (default: 3)
}

interface RoutingInput {
  userInput: string;
  intent?: IntentResult;
  sceneContext?: SceneContext;
}

interface RoutingResult {
  subAgentId: string;
  score: number;
  matchDetails: {
    keywordScore: number;
    intentScore: number;
    sceneScore: number;
  };
}

class SubAgentRouter {
  private config: RoutingConfig;
  private keywordMatcher: KeywordMatcher;
  private intentMatcher: IntentMatcher;
  private sceneMatcher: SceneMatcher;
  private scoringEngine: ScoringEngine;
  private cache: Map<string, RoutingResult[]>;

  constructor(config: Partial<RoutingConfig> = {}) {
    this.config = { ...DEFAULT_ROUTING_CONFIG, ...config };
    this.keywordMatcher = new KeywordMatcher();
    this.intentMatcher = new IntentMatcher();
    this.sceneMatcher = new SceneMatcher();
    this.scoringEngine = new ScoringEngine(this.config);
    this.cache = new Map();
  }

  async route(input: RoutingInput): Promise<RoutingResult[]> {
    const cacheKey = this.getCacheKey(input);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 并行执行三种匹配
    const [keywordMatches, intentMatches, sceneMatches] = await Promise.all([
      this.keywordMatcher.match(input.userInput),
      input.intent ? this.intentMatcher.match(input.intent) : [],
      input.sceneContext ? this.sceneMatcher.match(input.sceneContext) : [],
    ]);

    // 评分计算
    const candidates = this.scoringEngine.computeScores({
      keywordMatches,
      intentMatches,
      sceneMatches,
    });

    // 排序和过滤
    const sorted = candidates
      .filter(c => c.totalScore >= this.config.scoreThreshold)
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, this.config.maxCandidates);

    this.cache.set(cacheKey, sorted);
    return sorted;
  }

  private getCacheKey(input: RoutingInput): string {
    return `${input.userInput}:${input.intent?.type}:${input.sceneContext?.module}`;
  }
}
```

**KeywordMatcher (关键词匹配器)**

```typescript
// src/features/subagent/routing/KeywordMatcher.ts

interface KeywordRule {
  subAgentId: string;
  keywords: string[];
  synonyms: Map<string, string[]>;
  weight: number; // 该关键词的权重
}

interface KeywordMatch {
  subAgentId: string;
  matchedKeyword: string;
  matchType: 'exact' | 'fuzzy' | 'synonym';
  score: number;
}

class KeywordMatcher {
  private rules: KeywordRule[];
  private fuzzyThreshold: number; // 模糊匹配阈值

  constructor(rules: KeywordRule[] = []) {
    this.rules = rules;
    this.fuzzyThreshold = 0.8;
  }

  async match(userInput: string): Promise<KeywordMatch[]> {
    const normalizedInput = this.normalize(userInput);
    const matches: KeywordMatch[] = [];

    for (const rule of this.rules) {
      for (const keyword of rule.keywords) {
        const normalizedKeyword = this.normalize(keyword);

        // 精确匹配
        if (normalizedInput.includes(normalizedKeyword)) {
          matches.push({
            subAgentId: rule.subAgentId,
            matchedKeyword: keyword,
            matchType: 'exact',
            score: 1.0 * rule.weight,
          });
          continue;
        }

        // 同义词匹配
        const synonyms = rule.synonyms.get(keyword) || [];
        for (const synonym of synonyms) {
          if (normalizedInput.includes(this.normalize(synonym))) {
            matches.push({
              subAgentId: rule.subAgentId,
              matchedKeyword: synonym,
              matchType: 'synonym',
              score: 0.8 * rule.weight,
            });
          }
        }

        // 模糊匹配
        const fuzzyScore = this.computeFuzzyScore(normalizedInput, normalizedKeyword);
        if (fuzzyScore >= this.fuzzyThreshold) {
          matches.push({
            subAgentId: rule.subAgentId,
            matchedKeyword: keyword,
            matchType: 'fuzzy',
            score: fuzzyScore * rule.weight,
          });
        }
      }
    }

    return matches;
  }

  private normalize(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private computeFuzzyScore(s1: string, s2: string): number {
    // 使用Levenshtein距离计算相似度
    const distance = this.levenshteinDistance(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    // 动态规划计算编辑距离
    const m = s1.length, n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i-1] === s2[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
        }
      }
    }
    return dp[m][n];
  }
}
```

**IntentMatcher (意图匹配器)**

```typescript
// src/features/subagent/routing/IntentMatcher.ts

interface IntentRule {
  subAgentId: string;
  intentTypes: string[];
  minConfidence: number;
}

interface IntentMatch {
  subAgentId: string;
  intentType: string;
  confidence: number;
  score: number;
}

class IntentMatcher {
  private rules: IntentRule[];
  private intentMapping: Map<string, string[]>; // 意图类型 -> SubAgent列表

  constructor(rules: IntentRule[] = []) {
    this.rules = rules;
    this.intentMapping = new Map();
    for (const rule of rules) {
      for (const intentType of rule.intentTypes) {
        const existing = this.intentMapping.get(intentType) || [];
        existing.push(rule.subAgentId);
        this.intentMapping.set(intentType, existing);
      }
    }
  }

  async match(intentResult: IntentResult): Promise<IntentMatch[]> {
    const matches: IntentMatch[] = [];
    const intentType = intentResult.type;
    const confidence = intentResult.confidence;

    const subAgents = this.intentMapping.get(intentType) || [];

    for (const subAgentId of subAgents) {
      const rule = this.rules.find(r => r.subAgentId === subAgentId);

      if (rule && confidence >= rule.minConfidence) {
        matches.push({
          subAgentId,
          intentType,
          confidence,
          score: confidence, // 意图得分直接使用置信度
        });
      }
    }

    return matches;
  }
}
```

**SceneMatcher (场景匹配器)**

```typescript
// src/features/subagent/routing/SceneMatcher.ts

interface SceneContext {
  currentModule: string;      // 当前模块
  recentActions: string[];   // 最近操作序列
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  userRole?: string;
}

interface SceneRule {
  subAgentId: string;
  modules: string[];
  actionPatterns: string[][]; // 操作序列模式
  timeOfDay?: string[];
  userRoles?: string[];
}

interface SceneMatch {
  subAgentId: string;
  matchedFactors: string[];
  score: number;
}

class SceneMatcher {
  private rules: SceneRule[];

  constructor(rules: SceneRule[] = []) {
    this.rules = rules;
  }

  async match(context: SceneContext): Promise<SceneMatch[]> {
    const matches: SceneMatch[] = [];

    for (const rule of this.rules) {
      let score = 0;
      const matchedFactors: string[] = [];

      // 模块匹配
      if (rule.modules.includes(context.currentModule)) {
        score += 0.4;
        matchedFactors.push(`module:${context.currentModule}`);
      }

      // 操作序列匹配
      for (const pattern of rule.actionPatterns) {
        if (this.matchActionPattern(context.recentActions, pattern)) {
          score += 0.4;
          matchedFactors.push('action_pattern');
          break;
        }
      }

      // 时间匹配
      if (rule.timeOfDay?.includes(context.timeOfDay || '')) {
        score += 0.1;
        matchedFactors.push(`time:${context.timeOfDay}`);
      }

      // 角色匹配
      if (rule.userRoles?.includes(context.userRole || '')) {
        score += 0.1;
        matchedFactors.push(`role:${context.userRole}`);
      }

      if (matchedFactors.length > 0) {
        matches.push({
          subAgentId: rule.subAgentId,
          matchedFactors,
          score,
        });
      }
    }

    return matches;
  }

  private matchActionPattern(actions: string[], pattern: string[]): boolean {
    if (pattern.length === 0) return true;
    if (actions.length < pattern.length) return false;

    // 检查actions是否以pattern结尾
    const actionsStart = actions.length - pattern.length;
    for (let i = 0; i < pattern.length; i++) {
      if (actions[actionsStart + i] !== pattern[i]) {
        return false;
      }
    }
    return true;
  }
}
```

**ScoringEngine (评分引擎)**

```typescript
// src/features/subagent/routing/ScoringEngine.ts

interface ScoringInput {
  keywordMatches: KeywordMatch[];
  intentMatches: IntentMatch[];
  sceneMatches: SceneMatch[];
}

interface CandidateScore {
  subAgentId: string;
  totalScore: number;
  keywordScore: number;
  intentScore: number;
  sceneScore: number;
}

class ScoringEngine {
  private config: RoutingConfig;

  constructor(config: RoutingConfig) {
    this.config = config;
  }

  computeScores(input: ScoringInput): CandidateScore[] {
    const scoreMap = new Map<string, CandidateScore>();

    // 聚合关键词得分
    for (const match of input.keywordMatches) {
      const existing = scoreMap.get(match.subAgentId) || this.emptyScore(match.subAgentId);
      existing.keywordScore += match.score * this.config.keywordWeight;
      scoreMap.set(match.subAgentId, existing);
    }

    // 聚合意图得分
    for (const match of input.intentMatches) {
      const existing = scoreMap.get(match.subAgentId) || this.emptyScore(match.subAgentId);
      existing.intentScore += match.score * this.config.intentWeight;
      scoreMap.set(match.subAgentId, existing);
    }

    // 聚合场景得分
    for (const match of input.sceneMatches) {
      const existing = scoreMap.get(match.subAgentId) || this.emptyScore(match.subAgentId);
      existing.sceneScore += match.score * this.config.sceneWeight;
      scoreMap.set(match.subAgentId, existing);
    }

    // 计算总分
    const results: CandidateScore[] = [];
    for (const [subAgentId, candidate] of scoreMap) {
      results.push({
        subAgentId,
        totalScore: candidate.keywordScore + candidate.intentScore + candidate.sceneScore,
        keywordScore: candidate.keywordScore,
        intentScore: candidate.intentScore,
        sceneScore: candidate.sceneScore,
      });
    }

    return results;
  }

  private emptyScore(subAgentId: string): CandidateScore {
    return {
      subAgentId,
      totalScore: 0,
      keywordScore: 0,
      intentScore: 0,
      sceneScore: 0,
    };
  }
}
```

### 后端实现方案 (Rust)

#### 模块结构

```
src-tauri/src/agent/
├── subagent/
│   ├── routing/
│   │   ├── mod.rs
│   │   ├── router.rs         # 路由核心
│   │   ├── keyword_matcher.rs # 关键词匹配
│   │   ├── intent_matcher.rs  # 意图匹配
│   │   └── scene_matcher.rs   # 场景匹配
│   └── registry.rs            # SubAgent注册表
```

### API设计

#### Tauri命令

```rust
// src-tauri/src/commands/subagent.rs

#[tauri::command]
async fn route_to_subagent(
    user_input: String,
    intent: Option<IntentResult>,
    scene: Option<SceneContext>,
) -> Result<Vec<RoutingResult>, String>;

#[tauri::command]
async fn get_routing_rules() -> Result<Vec<RoutingRule>, String>;

#[tauri::command]
async fn update_routing_rule(
    rule: RoutingRule,
) -> Result<(), String>;
```

#### 前端API

```typescript
// src/features/subagent/routing/api.ts

export const routingApi = {
  async route(input: RoutingInput): Promise<RoutingResult[]> {
    return invoke('route_to_subagent', { ...input });
  },

  async getRules(): Promise<RoutingRule[]> {
    return invoke('get_routing_rules');
  },

  async updateRule(rule: RoutingRule): Promise<void> {
    return invoke('update_routing_rule', { rule });
  },
};
```

## 组件设计

### 新增组件

| 组件 | 类型 | 职责 |
|------|------|------|
| SubAgentRouter | 类 | 路由核心，协调三种匹配策略 |
| KeywordMatcher | 类 | 关键词匹配，支持精确/模糊/同义词 |
| IntentMatcher | 类 | 意图匹配，与IntentParsing集成 |
| SceneMatcher | 类 | 场景匹配，基于上下文 |
| ScoringEngine | 类 | 评分计算，加权求和 |
| RoutingConfigPanel | React组件 | 路由配置UI |

### 修改组件

| 组件 | 修改内容 |
|------|----------|
| SubAgentRouting.tsx | 集成SubAgentRouter核心逻辑 |

## 状态管理

```typescript
// src/stores/routingStore.ts

interface RoutingState {
  config: RoutingConfig;
  rules: RoutingRule[];
  recentRoutes: RoutingHistory[];
  isLoading: boolean;
}

export const useRoutingStore = create<RoutingState>((set, get) => ({
  config: DEFAULT_ROUTING_CONFIG,
  rules: [],
  recentRoutes: [],
  isLoading: false,

  setConfig: (config) => set({ config }),
  setRules: (rules) => set({ rules }),
  addToHistory: (route) => set(state => ({
    recentRoutes: [route, ...state.recentRoutes].slice(0, 100),
  })),
}));
```

## 数据库设计

```sql
-- 路由配置表
CREATE TABLE subagent_routing_config (
  id TEXT PRIMARY KEY,
  keyword_weight REAL DEFAULT 0.3,
  intent_weight REAL DEFAULT 0.4,
  scene_weight REAL DEFAULT 0.3,
  score_threshold REAL DEFAULT 0.5,
  max_candidates INTEGER DEFAULT 3,
  updated_at DATETIME
);

-- 路由规则表
CREATE TABLE routing_rules (
  id TEXT PRIMARY KEY,
  subagent_id TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'keyword', 'intent', 'scene'
  config JSON NOT NULL,
  priority INTEGER DEFAULT 0,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
);

-- 路由历史表
CREATE TABLE routing_history (
  id TEXT PRIMARY KEY,
  user_input TEXT NOT NULL,
  selected_subagent_id TEXT,
  routing_scores JSON,
  created_at DATETIME
);
```

## 安全考虑

- **ADR-018**: 输入验证，防止SQL注入
- **ADR-013**: SubAgent权限隔离
- 输入脱敏处理
- 路由规则权限控制

## 性能考虑

- **NFR1**: 路由响应时间 < 100ms
- 路由结果缓存（TTL: 5分钟）
- 评分计算优化（避免重复计算）
- 规则懒加载
