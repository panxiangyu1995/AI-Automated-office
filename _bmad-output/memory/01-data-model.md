# 记忆数据模型设计

## 一、数据模型概览

### 1.1 模型层次结构

```
┌─────────────────────────────────────────────────────────────────┐
│                    记忆数据模型层次                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              核心实体模型 (Core Entities)                │   │
│  │  Session │ Message │ Observation │ Summary │ Fact       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              认知状态模型 (Cognitive State)              │   │
│  │  DomainState │ ThinkingStage │ Decision │ OpenQuestion  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              向量嵌入模型 (Embedding)                    │   │
│  │  MessageEmbedding │ SummaryEmbedding │ QueryEmbedding   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              元数据模型 (Metadata)                       │   │
│  │  TenantInfo │ PluginInfo │ UserInfo │ Timestamp         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 设计原则

| 原则 | 说明 |
|------|------|
| **租户隔离** | 所有实体包含 tenant_id，支持多租户数据隔离 |
| **插件关联** | 通过 plugin_id 关联部门插件，支持部门记忆隔离 |
| **会话追踪** | 通过 session_key 追踪会话，格式：`{tenantId}:{pluginId}:{sessionId}` |
| **时间戳索引** | 所有实体包含 created_at/updated_at，支持时间序列查询 |
| **软删除** | 重要实体支持软删除，保留历史记录 |

---

## 二、核心实体模型

### 2.1 会话模型 (Session)

```typescript
/**
 * 会话实体
 * 对应表: sessions
 */
interface Session {
  // 主键
  id: number;                          // 自增主键
  
  // 标识
  session_key: string;                 // 会话Key: {tenantId}:{pluginId}:{sessionId}
  tenant_id: string;                   // 租户ID
  plugin_id: string;                   // 插件/部门ID
  session_id: string;                  // 会话实例ID
  
  // 内容
  title: string | null;                // 会话标题（AI生成）
  user_prompt: string | null;          // 用户初始提示
  
  // 状态
  status: 'active' | 'completed' | 'archived' | 'error';
  
  // 统计
  message_count: number;               // 消息数量
  token_input: number;                 // 输入token总数
  token_output: number;                // 输出token总数
  tool_call_count: number;             // 工具调用次数
  
  // 认知状态
  thinking_stage: ThinkingStage | null;
  importance: Importance | null;
  
  // 时间戳
  created_at: string;                  // ISO 8601
  created_at_epoch: number;            // Unix时间戳（毫秒）
  updated_at: string;
  completed_at: string | null;
  completed_at_epoch: number | null;
  
  // 元数据
  model_id: string | null;             // 使用的模型ID
  metadata: Record<string, any> | null;
}

type ThinkingStage = 'exploring' | 'crystallizing' | 'refining' | 'executing';
type Importance = 'breakthrough' | 'significant' | 'routine';
```

**SQL 定义：**

```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  session_key TEXT UNIQUE NOT NULL,
  tenant_id TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  
  title TEXT,
  user_prompt TEXT,
  
  status TEXT CHECK(status IN ('active', 'completed', 'archived', 'error')) 
    NOT NULL DEFAULT 'active',
  
  message_count INTEGER DEFAULT 0,
  token_input INTEGER DEFAULT 0,
  token_output INTEGER DEFAULT 0,
  tool_call_count INTEGER DEFAULT 0,
  
  thinking_stage TEXT CHECK(thinking_stage IN ('exploring', 'crystallizing', 'refining', 'executing')),
  importance TEXT CHECK(importance IN ('breakthrough', 'significant', 'routine')),
  
  created_at TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  completed_at_epoch INTEGER,
  
  model_id TEXT,
  metadata TEXT,  -- JSON
  
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- 索引
CREATE INDEX idx_sessions_key ON sessions(session_key);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_plugin ON sessions(plugin_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created ON sessions(created_at_epoch DESC);
CREATE INDEX idx_sessions_tenant_plugin ON sessions(tenant_id, plugin_id);
```

### 2.2 消息模型 (Message)

```typescript
/**
 * 消息实体
 * 对应表: messages
 */
interface Message {
  // 主键
  id: number;
  
  // 关联
  session_key: string;                 // 关联会话
  
  // 内容
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;                     // 消息内容
  
  // 工具调用（仅assistant消息）
  tool_calls: ToolCall[] | null;       // 工具调用列表
  tool_call_id: string | null;         // 工具调用ID（仅tool消息）
  
  // 特征标记
  has_code: boolean;                   // 包含代码块
  has_url: boolean;                    // 包含URL
  has_question: boolean;               // 包含问题
  has_decision: boolean;               // 包含决策
  
  // 统计
  token_count: number;                 // 消息token数
  word_count: number;                  // 词数
  
  // 时间戳
  created_at: string;
  created_at_epoch: number;
  
  // 元数据
  model_id: string | null;             // 生成此消息的模型
  metadata: Record<string, any> | null;
}

interface ToolCall {
  id: string;                          // 工具调用ID
  name: string;                        // 工具名称
  arguments: Record<string, any>;      // 工具参数
  result?: string;                     // 工具结果（异步填充）
  status?: 'pending' | 'success' | 'error';
}
```

**SQL 定义：**

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  session_key TEXT NOT NULL,
  
  role TEXT CHECK(role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,
  
  tool_calls TEXT,  -- JSON
  tool_call_id TEXT,
  
  has_code INTEGER DEFAULT 0,
  has_url INTEGER DEFAULT 0,
  has_question INTEGER DEFAULT 0,
  has_decision INTEGER DEFAULT 0,
  
  token_count INTEGER DEFAULT 0,
  word_count INTEGER DEFAULT 0,
  
  created_at TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  
  model_id TEXT,
  metadata TEXT,  -- JSON
  
  FOREIGN KEY (session_key) REFERENCES sessions(session_key) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_messages_session ON messages(session_key);
CREATE INDEX idx_messages_role ON messages(role);
CREATE INDEX idx_messages_created ON messages(created_at_epoch DESC);
CREATE INDEX idx_messages_session_created ON messages(session_key, created_at_epoch);
```

### 2.3 观察模型 (Observation)

```typescript
/**
 * 观察实体 - 工具执行的结构化记录
 * 对应表: observations
 */
interface Observation {
  // 主键
  id: number;
  
  // 关联
  session_key: string;
  message_id: number | null;           // 关联的消息
  
  // 分类
  type: ObservationType;
  
  // 内容
  title: string | null;                // 观察标题
  subtitle: string | null;             // 副标题
  narrative: string | null;            // 叙述性描述
  facts: string[] | null;              // 事实列表
  concepts: string[] | null;           // 概念标签
  
  // 上下文
  tool_name: string | null;            // 触发的工具名称
  files_read: string[] | null;         // 读取的文件
  files_modified: string[] | null;     // 修改的文件
  
  // 重要性
  importance: Importance;
  discovery_tokens: number;            // 发现token数（用于ROI计算）
  
  // 领域
  domain_primary: string | null;       // 主要领域
  domain_secondary: string | null;     // 次要领域
  
  // 时间戳
  created_at: string;
  created_at_epoch: number;
}

type ObservationType = 
  | 'decision'     // 架构或设计决策
  | 'bugfix'       // Bug修复和纠正
  | 'feature'      // 新功能或能力
  | 'refactor'     // 代码重构和清理
  | 'discovery'    // 关于代码库的学习
  | 'change';      // 通用变更和修改
```

**SQL 定义：**

```sql
CREATE TABLE observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  session_key TEXT NOT NULL,
  message_id INTEGER,
  
  type TEXT CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery', 'change')) 
    NOT NULL,
  
  title TEXT,
  subtitle TEXT,
  narrative TEXT,
  facts TEXT,      -- JSON array
  concepts TEXT,   -- JSON array
  
  tool_name TEXT,
  files_read TEXT,    -- JSON array
  files_modified TEXT, -- JSON array
  
  importance TEXT CHECK(importance IN ('breakthrough', 'significant', 'routine')) 
    DEFAULT 'routine',
  discovery_tokens INTEGER DEFAULT 0,
  
  domain_primary TEXT,
  domain_secondary TEXT,
  
  created_at TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  
  FOREIGN KEY (session_key) REFERENCES sessions(session_key) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_observations_session ON observations(session_key);
CREATE INDEX idx_observations_type ON observations(type);
CREATE INDEX idx_observations_importance ON observations(importance);
CREATE INDEX idx_observations_domain ON observations(domain_primary);
CREATE INDEX idx_observations_created ON observations(created_at_epoch DESC);
```

### 2.4 摘要模型 (Summary)

```typescript
/**
 * 摘要实体 - 会话的结构化摘要
 * 对应表: summaries
 */
interface Summary {
  // 主键
  id: number;
  
  // 关联
  session_key: string;                 // 一对一关联会话
  
  // 核心内容
  summary: string;                     // 摘要文本
  key_insights: string[];              // 关键洞察
  concepts: string[];                  // 概念提取
  decisions: string[];                 // 决策列表
  open_questions: string[];            // 开放问题
  quotable: string[];                  // 可引用内容
  
  // 分类
  domain_primary: string;
  domain_secondary: string | null;
  thinking_stage: ThinkingStage;
  importance: Importance;
  
  // 认知分析
  emotional_tone: EmotionalTone | null;
  cognitive_pattern: CognitivePattern | null;
  problem_solving: ProblemSolving | null;
  
  // 统计
  message_count: number;
  token_input: number;
  token_output: number;
  
  // 关联
  connections_to: string[] | null;     // 关联领域
  
  // 时间戳
  summarized_at: string;
  summarized_at_epoch: number;
}

type EmotionalTone = 'analytical' | 'enthusiastic' | 'cautious' | 'frustrated' | 'neutral';
type CognitivePattern = 'deep-dive' | 'exploratory' | 'systematic' | 'creative';
type ProblemSolving = 'analytical' | 'intuitive' | 'collaborative' | 'iterative';
```

**SQL 定义：**

```sql
CREATE TABLE summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  session_key TEXT UNIQUE NOT NULL,
  
  summary TEXT NOT NULL,
  key_insights TEXT,    -- JSON array
  concepts TEXT,        -- JSON array
  decisions TEXT,       -- JSON array
  open_questions TEXT,  -- JSON array
  quotable TEXT,        -- JSON array
  
  domain_primary TEXT NOT NULL,
  domain_secondary TEXT,
  thinking_stage TEXT CHECK(thinking_stage IN ('exploring', 'crystallizing', 'refining', 'executing')),
  importance TEXT CHECK(importance IN ('breakthrough', 'significant', 'routine')) DEFAULT 'routine',
  
  emotional_tone TEXT CHECK(emotional_tone IN ('analytical', 'enthusiastic', 'cautious', 'frustrated', 'neutral')),
  cognitive_pattern TEXT CHECK(cognitive_pattern IN ('deep-dive', 'exploratory', 'systematic', 'creative')),
  problem_solving TEXT CHECK(problem_solving IN ('analytical', 'intuitive', 'collaborative', 'iterative')),
  
  message_count INTEGER DEFAULT 0,
  token_input INTEGER DEFAULT 0,
  token_output INTEGER DEFAULT 0,
  
  connections_to TEXT,  -- JSON array
  
  summarized_at TEXT NOT NULL,
  summarized_at_epoch INTEGER NOT NULL,
  
  FOREIGN KEY (session_key) REFERENCES sessions(session_key) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_summaries_session ON summaries(session_key);
CREATE INDEX idx_summaries_domain ON summaries(domain_primary);
CREATE INDEX idx_summaries_stage ON summaries(thinking_stage);
CREATE INDEX idx_summaries_importance ON summaries(importance);
CREATE INDEX idx_summaries_summarized ON summaries(summarized_at_epoch DESC);
```

### 2.5 事实模型 (Fact)

```typescript
/**
 * 事实实体 - 从对话中提取的关键事实
 * 对应表: facts
 * 用于 L2 个人记忆层
 */
interface Fact {
  // 主键
  id: number;
  
  // 关联
  tenant_id: string;
  user_id: string;
  source_session_key: string | null;   // 来源会话
  source_message_id: number | null;    // 来源消息
  
  // 内容
  content: string;                     // 事实内容
  category: FactCategory;              // 事实类别
  
  // 重要性
  importance: Importance;
  confidence: number;                  // 置信度 0-1
  
  // 验证
  verified: boolean;                   // 是否已验证
  verified_at: string | null;
  verification_count: number;          // 验证次数（被引用）
  
  // 时间衰减
  last_accessed: string | null;
  access_count: number;
  decay_score: number;                 // 衰减分数
  
  // 时间戳
  created_at: string;
  created_at_epoch: number;
  updated_at: string;
}

type FactCategory = 
  | 'preference'    // 用户偏好
  | 'constraint'    // 约束条件
  | 'decision'      // 决策记录
  | 'knowledge'     // 知识事实
  | 'relationship'  // 关系信息
  | 'process';      // 流程信息
```

**SQL 定义：**

```sql
CREATE TABLE facts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  source_session_key TEXT,
  source_message_id INTEGER,
  
  content TEXT NOT NULL,
  category TEXT CHECK(category IN ('preference', 'constraint', 'decision', 'knowledge', 'relationship', 'process')) 
    NOT NULL,
  
  importance TEXT CHECK(importance IN ('breakthrough', 'significant', 'routine')) DEFAULT 'routine',
  confidence REAL DEFAULT 1.0 CHECK(confidence >= 0 AND confidence <= 1),
  
  verified INTEGER DEFAULT 0,
  verified_at TEXT,
  verification_count INTEGER DEFAULT 0,
  
  last_accessed TEXT,
  access_count INTEGER DEFAULT 0,
  decay_score REAL DEFAULT 1.0,
  
  created_at TEXT NOT NULL,
  created_at_epoch INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  
  FOREIGN KEY (source_session_key) REFERENCES sessions(session_key) ON DELETE SET NULL,
  FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- 索引
CREATE INDEX idx_facts_tenant_user ON facts(tenant_id, user_id);
CREATE INDEX idx_facts_category ON facts(category);
CREATE INDEX idx_facts_importance ON facts(importance);
CREATE INDEX idx_facts_decay ON facts(decay_score DESC);
CREATE INDEX idx_facts_created ON facts(created_at_epoch DESC);
```

---

## 三、认知状态模型

### 3.1 领域状态模型 (DomainState)

```typescript
/**
 * 领域状态实体 - 每个部门/领域的认知状态
 * 对应表: domain_states
 */
interface DomainState {
  // 主键
  id: number;
  
  // 标识
  tenant_id: string;
  user_id: string;
  domain: string;                      // 领域/部门标识
  
  // 认知状态
  thinking_stage: ThinkingStage;
  emotional_tone: EmotionalTone | null;
  cognitive_pattern: CognitivePattern | null;
  
  // 聚合内容
  open_questions: string[];            // 开放问题列表
  decisions: string[];                 // 决策列表
  concepts: string[];                  // 活跃概念
  key_insights: string[];              // 关键洞察
  
  // 统计
  session_count: number;               // 会话数量
  breakthrough_count: number;          // 突破数量
  significant_count: number;           // 重要数量
  
  // 关联
  connected_domains: string[];         // 关联领域
  
  // 时间戳
  last_active: string;
  last_active_epoch: number;
  created_at: string;
  updated_at: string;
}
```

**SQL 定义：**

```sql
CREATE TABLE domain_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  
  thinking_stage TEXT CHECK(thinking_stage IN ('exploring', 'crystallizing', 'refining', 'executing')),
  emotional_tone TEXT CHECK(emotional_tone IN ('analytical', 'enthusiastic', 'cautious', 'frustrated', 'neutral')),
  cognitive_pattern TEXT CHECK(cognitive_pattern IN ('deep-dive', 'exploratory', 'systematic', 'creative')),
  
  open_questions TEXT,    -- JSON array
  decisions TEXT,         -- JSON array
  concepts TEXT,          -- JSON array
  key_insights TEXT,      -- JSON array
  
  session_count INTEGER DEFAULT 0,
  breakthrough_count INTEGER DEFAULT 0,
  significant_count INTEGER DEFAULT 0,
  
  connected_domains TEXT, -- JSON array
  
  last_active TEXT NOT NULL,
  last_active_epoch INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  
  UNIQUE(tenant_id, user_id, domain)
);

-- 索引
CREATE INDEX idx_domain_states_tenant_user ON domain_states(tenant_id, user_id);
CREATE INDEX idx_domain_states_domain ON domain_states(domain);
CREATE INDEX idx_domain_states_last_active ON domain_states(last_active_epoch DESC);
```

### 3.2 思维轨迹模型 (ThinkingTrajectory)

```typescript
/**
 * 思维轨迹实体 - 概念/主题的演变追踪
 * 对应表: thinking_trajectories
 */
interface ThinkingTrajectory {
  // 主键
  id: number;
  
  // 标识
  tenant_id: string;
  user_id: string;
  topic: string;                       // 追踪主题
  
  // 轨迹数据
  stages: StageTransition[];           // 阶段转换历史
  milestones: Milestone[];             // 关键里程碑
  
  // 统计
  session_count: number;               // 相关会话数
  velocity: number;                    // 讨论频率
  
  // 时间戳
  first_mentioned: string;
  last_mentioned: string;
  created_at: string;
  updated_at: string;
}

interface StageTransition {
  date: string;
  from_stage: ThinkingStage | null;
  to_stage: ThinkingStage;
  session_key: string;
}

interface Milestone {
  date: string;
  session_key: string;
  summary: string;
  decisions: string[];
  questions: string[];
}
```

---

## 四、向量嵌入模型

### 4.1 消息嵌入模型 (MessageEmbedding)

```typescript
/**
 * 消息嵌入实体
 * 存储在 LanceDB
 */
interface MessageEmbedding {
  // 标识
  id: string;                          // UUID
  message_id: number;                  // 关联消息ID
  session_key: string;
  
  // 内容
  content: string;                     // 原始文本（用于显示）
  embedding: number[];                 // 向量嵌入
  
  // 元数据
  tenant_id: string;
  plugin_id: string;
  role: 'user' | 'assistant';
  
  // 特征
  has_code: boolean;
  has_question: boolean;
  importance: Importance;
  
  // 时间
  created_at: string;
  year: number;
  month: number;
}
```

**LanceDB 表结构：**

```python
# LanceDB Schema
schema = pa.schema([
    pa.field("id", pa.string()),
    pa.field("message_id", pa.int64()),
    pa.field("session_key", pa.string()),
    pa.field("content", pa.string()),
    pa.field("embedding", pa.list_(pa.float32(), list_size=384)),  # FastEmbed维度
    pa.field("tenant_id", pa.string()),
    pa.field("plugin_id", pa.string()),
    pa.field("role", pa.string()),
    pa.field("has_code", pa.bool_()),
    pa.field("has_question", pa.bool_()),
    pa.field("importance", pa.string()),
    pa.field("created_at", pa.string()),
    pa.field("year", pa.int32()),
    pa.field("month", pa.int32()),
])
```

### 4.2 摘要嵌入模型 (SummaryEmbedding)

```typescript
/**
 * 摘要嵌入实体
 * 存储在 LanceDB
 */
interface SummaryEmbedding {
  id: string;
  summary_id: number;
  session_key: string;
  
  content: string;                     // 摘要文本
  embedding: number[];
  
  tenant_id: string;
  plugin_id: string;
  
  domain_primary: string;
  thinking_stage: ThinkingStage;
  importance: Importance;
  
  created_at: string;
  year: number;
  month: number;
}
```

---

## 五、全文搜索索引

### 5.1 消息全文索引

```sql
-- FTS5 虚拟表
CREATE VIRTUAL TABLE messages_fts USING fts5(
  content,
  content='messages',
  content_rowid='id',
  tokenize='unicode61'  -- 支持中文
);

-- 同步触发器
CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, content)
  VALUES (new.id, new.content);
END;

CREATE TRIGGER messages_ad AFTER DELETE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, content)
  VALUES('delete', old.id, old.content);
END;

CREATE TRIGGER messages_au AFTER UPDATE ON messages BEGIN
  INSERT INTO messages_fts(messages_fts, rowid, content)
  VALUES('delete', old.id, old.content);
  INSERT INTO messages_fts(rowid, content)
  VALUES (new.id, new.content);
END;
```

### 5.2 观察全文索引

```sql
CREATE VIRTUAL TABLE observations_fts USING fts5(
  title,
  subtitle,
  narrative,
  facts,
  concepts,
  content='observations',
  content_rowid='id',
  tokenize='unicode61'
);

-- 同步触发器（类似messages）
```

### 5.3 摘要全文索引

```sql
CREATE VIRTUAL TABLE summaries_fts USING fts5(
  summary,
  key_insights,
  concepts,
  decisions,
  open_questions,
  content='summaries',
  content_rowid='id',
  tokenize='unicode61'
);
```

---

## 六、实体关系图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           实体关系图                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐           │
│  │   Tenant    │       │    User     │       │   Plugin    │           │
│  │             │       │             │       │             │           │
│  │ id          │──┐    │ id          │──┐    │ id          │           │
│  │ name        │  │    │ name        │  │    │ name        │           │
│  └─────────────┘  │    └─────────────┘  │    └─────────────┘           │
│         │         │           │         │           │                   │
│         │         │           │         │           │                   │
│         ▼         │           ▼         │           ▼                   │
│  ┌───────────────────────────────────────────────────────────────┐     │
│  │                         Session                                │     │
│  │                                                                │     │
│  │ session_key: {tenant_id}:{plugin_id}:{session_id}             │     │
│  │ tenant_id ────────────────────────────────────────────────────┼─┐   │
│  │ plugin_id ────────────────────────────────────────────────────┼─┼─┐ │
│  │ user_id ──────────────────────────────────────────────────────┼─┼─┤ │
│  └───────────────────────────────────────────────────────────────┘ │ │ │
│         │                                                           │ │ │
│         │ 1:N                                                       │ │ │
│         ▼                                                           │ │ │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       │ │ │
│  │   Message   │       │ Observation │       │   Summary   │       │ │ │
│  │             │       │             │       │             │       │ │ │
│  │ session_key │       │ session_key │       │ session_key │       │ │ │
│  │ role        │       │ type        │       │ summary     │       │ │ │
│  │ content     │       │ narrative   │       │ concepts    │       │ │ │
│  └──────┬──────┘       │ concepts    │       │ decisions   │       │ │ │
│         │              └─────────────┘       └─────────────┘       │ │ │
│         │ 1:N                                                       │ │ │
│         ▼                                                           │ │ │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       │ │ │
│  │MessageEmbed │       │  Fact       │       │DomainState  │       │ │ │
│  │             │       │             │       │             │       │ │ │
│  │ message_id  │       │ tenant_id   │       │ tenant_id   │───────┘ │ │
│  │ embedding   │       │ user_id     │       │ user_id     │─────────┘ │
│  │ (LanceDB)   │       │ content     │       │ domain      │───────────┘
│  └─────────────┘       │ category    │       │ thinking_   │
│                        └─────────────┘       │   stage     │
│                                              └─────────────┘
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 七、数据访问模式

### 7.1 会话访问模式

| 操作 | 访问路径 | 索引使用 |
|------|----------|----------|
| 创建会话 | INSERT sessions | - |
| 获取会话 | SELECT * FROM sessions WHERE session_key = ? | idx_sessions_key |
| 列出租户会话 | SELECT * FROM sessions WHERE tenant_id = ? ORDER BY created_at_epoch DESC | idx_sessions_tenant, idx_sessions_created |
| 列出插件会话 | SELECT * FROM sessions WHERE tenant_id = ? AND plugin_id = ? | idx_sessions_tenant_plugin |
| 更新会话状态 | UPDATE sessions SET status = ? WHERE session_key = ? | idx_sessions_key |

### 7.2 消息访问模式

| 操作 | 访问路径 | 索引使用 |
|------|----------|----------|
| 追加消息 | INSERT messages | - |
| 获取会话消息 | SELECT * FROM messages WHERE session_key = ? ORDER BY created_at_epoch | idx_messages_session_created |
| 获取最近N条 | SELECT * FROM messages WHERE session_key = ? ORDER BY created_at_epoch DESC LIMIT N | idx_messages_session_created |
| 全文搜索 | SELECT * FROM messages_fts WHERE messages_fts MATCH ? | FTS5索引 |

### 7.3 向量检索模式

| 操作 | 访问路径 | 说明 |
|------|----------|------|
| 语义搜索 | LanceDB.search(embedding).limit(N) | 向量相似度 |
| 混合搜索 | LanceDB.search(query, query_type="hybrid") | 向量+全文 |
| 过滤搜索 | LanceDB.search(embedding).where(filter) | 向量+元数据过滤 |

---

## 八、数据迁移策略

### 8.1 迁移版本管理

```sql
CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL,
  description TEXT
);

-- 初始迁移
INSERT INTO schema_migrations (version, applied_at, description)
VALUES (1, datetime('now'), 'Initial schema');
```

### 8.2 迁移脚本结构

```typescript
interface Migration {
  version: number;
  description: string;
  up: string;      // 升级SQL
  down: string;    // 回滚SQL
}

const migrations: Migration[] = [
  {
    version: 1,
    description: 'Create sessions and messages tables',
    up: `
      CREATE TABLE sessions (...);
      CREATE TABLE messages (...);
    `,
    down: `
      DROP TABLE messages;
      DROP TABLE sessions;
    `
  },
  {
    version: 2,
    description: 'Add FTS5 indexes',
    up: `
      CREATE VIRTUAL TABLE messages_fts USING fts5(...);
      CREATE TRIGGER messages_ai ...;
    `,
    down: `
      DROP TRIGGER messages_ai;
      DROP TABLE messages_fts;
    `
  },
  // ... 更多迁移
];
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
