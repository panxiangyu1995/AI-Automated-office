# 检索系统设计

## 一、检索系统概述

### 1.1 设计目标

检索系统是记忆架构的**查询核心**，负责从海量记忆数据中快速定位相关信息，支持多种检索模式。

| 目标 | 说明 | 衡量标准 |
|------|------|----------|
| **高精度** | 返回高度相关的结果 | 精确率 > 85% |
| **低延迟** | 快速响应查询请求 | P95 < 200ms |
| **渐进式** | 按需加载详情，节省Token | 初始响应 < 100 tokens |
| **多模态** | 支持语义、关键词、时间等多维检索 | - |

### 1.2 检索架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    检索系统架构                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   检索协调器 (SearchCoordinator)          │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ QueryParser     │  │ ResultMerger    │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ 语义检索器     │  │ 全文检索器     │  │ 时间线检索器   │      │
│  │ VectorSearch  │  │ FTSSearch     │  │ TimelineSearch│      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │   LanceDB     │  │  SQLite FTS5  │  │  SQLite 索引  │      │
│  │  向量索引     │  │  全文索引     │  │  时间索引     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   渐进式披露层                            │   │
│  │  search() → timeline() → get_details()                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、渐进式披露策略

### 2.1 三层披露模型

借鉴 claude-mem 的设计，实现渐进式信息披露：

```
┌─────────────────────────────────────────────────────────────────┐
│                    渐进式披露模型                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  第一层：索引层 (search)                                         │
│  ├── 返回紧凑索引条目                                           │
│  ├── 每条目约 50 tokens                                         │
│  ├── 包含：ID、标题、时间戳、重要性、领域                        │
│  └── 用途：快速浏览、筛选                                       │
│                                                                 │
│  第二层：时间线层 (timeline)                                     │
│  ├── 返回时序上下文                                             │
│  ├── 每条目约 150 tokens                                        │
│  ├── 包含：索引内容 + 摘要 + 关键概念                           │
│  └── 用途：理解上下文、定位详情                                 │
│                                                                 │
│  第三层：详情层 (get_details)                                    │
│  ├── 返回完整内容                                               │
│  ├── 每条目约 500 tokens                                        │
│  ├── 包含：完整消息、工具调用、观察详情                          │
│  └── 用途：深入分析、决策参考                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Token预算控制

```typescript
/**
 * Token预算管理器
 */
export class TokenBudgetManager {
  private config: TokenBudgetConfig;
  
  constructor(config: TokenBudgetConfig) {
    this.config = config;
  }
  
  /**
   * 计算索引层结果
   */
  calculateIndexResults(
    results: SearchResult[],
    budget: number
  ): SearchResult[] {
    const tokensPerResult = 50;
    const maxResults = Math.floor(budget / tokensPerResult);
    
    return results.slice(0, Math.min(maxResults, this.config.maxIndexResults));
  }
  
  /**
   * 计算时间线层结果
   */
  calculateTimelineResults(
    results: SearchResult[],
    budget: number
  ): SearchResult[] {
    const tokensPerResult = 150;
    const maxResults = Math.floor(budget / tokensPerResult);
    
    return results.slice(0, Math.min(maxResults, this.config.maxTimelineResults));
  }
  
  /**
   * 计算详情层结果
   */
  calculateDetailResults(
    results: SearchResult[],
    budget: number
  ): SearchResult[] {
    const tokensPerResult = 500;
    const maxResults = Math.floor(budget / tokensPerResult);
    
    return results.slice(0, Math.min(maxResults, this.config.maxDetailResults));
  }
}

interface TokenBudgetConfig {
  maxIndexResults: number;      // 默认 20
  maxTimelineResults: number;   // 默认 10
  maxDetailResults: number;     // 默认 5
  defaultBudget: number;        // 默认 2000 tokens
}
```

---

## 三、语义检索

### 3.1 向量相似度搜索

```typescript
/**
 * 语义检索器
 */
export class SemanticSearcher {
  private vectorStore: VectorStoreOperations;
  private embeddingService: EmbeddingService;
  
  constructor(
    vectorStore: VectorStoreOperations,
    embeddingService: EmbeddingService
  ) {
    this.vectorStore = vectorStore;
    this.embeddingService = embeddingService;
  }
  
  /**
   * 语义搜索
   */
  async search(
    tenantId: string,
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    const {
      limit = 10,
      minScore = 0.5,
      filter,
      includeMetadata = true
    } = options;
    
    // 生成查询向量
    const queryEmbedding = await this.embeddingService.embed(query);
    
    // 执行向量搜索
    const results = await this.vectorStore.vectorSearch(tenantId, query, {
      limit: limit * 2,  // 多取一些用于过滤
      filter,
      minScore
    });
    
    // 重排序（可选）
    const reranked = options.rerank 
      ? await this.rerankResults(query, results)
      : results;
    
    return reranked.slice(0, limit);
  }
  
  /**
   * 相似消息搜索
   */
  async findSimilar(
    tenantId: string,
    messageId: number,
    options: SimilarSearchOptions = {}
  ): Promise<SemanticSearchResult[]> {
    // 获取消息嵌入
    const messageEmbedding = await this.vectorStore.getMessageEmbedding(
      tenantId,
      messageId
    );
    
    if (!messageEmbedding) {
      return [];
    }
    
    // 使用消息嵌入进行搜索
    return this.vectorStore.searchByEmbedding(tenantId, messageEmbedding, {
      limit: options.limit || 5,
      excludeIds: [messageId],
      minScore: options.minScore || 0.7
    });
  }
  
  /**
   * 重排序结果
   */
  private async rerankResults(
    query: string,
    results: SemanticSearchResult[]
  ): Promise<SemanticSearchResult[]> {
    // 使用Cross-Encoder重排序
    // 实际实现需要引入重排序模型
    return results.sort((a, b) => b.score - a.score);
  }
}

interface SemanticSearchOptions {
  limit?: number;
  minScore?: number;
  filter?: VectorSearchFilter;
  includeMetadata?: boolean;
  rerank?: boolean;
}

interface SemanticSearchResult {
  id: string;
  message_id: number;
  session_key: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}
```

### 3.2 混合检索

```typescript
/**
 * 混合检索器
 * 结合向量搜索和全文搜索
 */
export class HybridSearcher {
  private semanticSearcher: SemanticSearcher;
  private ftsSearcher: FTSSearcher;
  
  constructor(
    semanticSearcher: SemanticSearcher,
    ftsSearcher: FTSSearcher
  ) {
    this.semanticSearcher = semanticSearcher;
    this.ftsSearcher = ftsSearcher;
  }
  
  /**
   * 混合搜索
   */
  async search(
    tenantId: string,
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<HybridSearchResult[]> {
    const {
      limit = 10,
      semanticWeight = 0.6,
      ftsWeight = 0.4,
      filter
    } = options;
    
    // 并行执行两种搜索
    const [semanticResults, ftsResults] = await Promise.all([
      this.semanticSearcher.search(tenantId, query, {
        limit: limit * 2,
        filter,
        minScore: 0.3
      }),
      this.ftsSearcher.search(tenantId, query, {
        limit: limit * 2,
        filter
      })
    ]);
    
    // 使用RRF融合结果
    const merged = this.reciprocalRankFusion(
      semanticResults,
      ftsResults,
      semanticWeight,
      ftsWeight
    );
    
    return merged.slice(0, limit);
  }
  
  /**
   * Reciprocal Rank Fusion
   */
  private reciprocalRankFusion(
    semanticResults: SemanticSearchResult[],
    ftsResults: FTSSearchResult[],
    semanticWeight: number,
    ftsWeight: number,
    k: number = 60
  ): HybridSearchResult[] {
    const scores: Map<string, { result: HybridSearchResult; score: number }> = new Map();
    
    // 处理语义搜索结果
    for (let i = 0; i < semanticResults.length; i++) {
      const result = semanticResults[i];
      const rrfScore = semanticWeight / (k + i + 1);
      
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.result.semanticScore = result.score;
      } else {
        scores.set(result.id, {
          result: {
            ...result,
            semanticScore: result.score,
            ftsScore: 0,
            combinedScore: rrfScore
          },
          score: rrfScore
        });
      }
    }
    
    // 处理全文搜索结果
    for (let i = 0; i < ftsResults.length; i++) {
      const result = ftsResults[i];
      const rrfScore = ftsWeight / (k + i + 1);
      
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.result.ftsScore = result.score;
      } else {
        scores.set(result.id, {
          result: {
            ...result,
            semanticScore: 0,
            ftsScore: result.score,
            combinedScore: rrfScore
          },
          score: rrfScore
        });
      }
    }
    
    // 排序并返回
    return Array.from(scores.values())
      .sort((a, b) => b.score - a.score)
      .map(item => {
        item.result.combinedScore = item.score;
        return item.result;
      });
  }
}

interface HybridSearchOptions {
  limit?: number;
  semanticWeight?: number;
  ftsWeight?: number;
  filter?: SearchFilter;
}

interface HybridSearchResult {
  id: string;
  message_id: number;
  session_key: string;
  content: string;
  semanticScore: number;
  ftsScore: number;
  combinedScore: number;
  metadata?: Record<string, any>;
}
```

---

## 四、全文检索

### 4.1 FTS5搜索实现

```typescript
/**
 * 全文检索器
 */
export class FTSSearcher {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 全文搜索
   */
  search(
    tenantId: string,
    query: string,
    options: FTSSearchOptions = {}
  ): FTSSearchResult[] {
    const {
      limit = 10,
      filter,
      highlight = true,
      snippetSize = 100
    } = options;
    
    // 构建FTS查询
    const ftsQuery = this.buildFTSQuery(query);
    
    // 构建SQL
    let sql = `
      SELECT 
        m.id,
        m.session_key,
        m.role,
        m.created_at,
        ${highlight ? `snippet(messages_fts, -1, '>>>', '<<<', '...', ${snippetSize}) as snippet` : 'm.content'},
        bm25(messages_fts) as score
      FROM messages_fts
      JOIN messages m ON messages_fts.rowid = m.id
      JOIN sessions s ON m.session_key = s.session_key
      WHERE messages_fts MATCH ?
        AND s.tenant_id = ?
    `;
    
    const params: any[] = [ftsQuery, tenantId];
    
    // 添加过滤条件
    if (filter) {
      if (filter.plugin_id) {
        sql += ' AND s.plugin_id = ?';
        params.push(filter.plugin_id);
      }
      if (filter.role) {
        sql += ' AND m.role = ?';
        params.push(filter.role);
      }
      if (filter.date_range) {
        sql += ' AND m.created_at_epoch >= ? AND m.created_at_epoch <= ?';
        params.push(filter.date_range.start_epoch, filter.date_range.end_epoch);
      }
    }
    
    sql += ` ORDER BY score LIMIT ?`;
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, any>[];
    
    return rows.map(row => ({
      id: row.id.toString(),
      message_id: row.id,
      session_key: row.session_key,
      content: row.snippet || row.content,
      score: -row.score,  // BM25返回负值，越小越好
      metadata: {
        role: row.role,
        created_at: row.created_at
      }
    }));
  }
  
  /**
   * 构建FTS查询
   */
  private buildFTSQuery(query: string): string {
    // 清理查询
    const cleaned = query
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ')  // 保留中文和英文
      .trim();
    
    // 分词
    const terms = cleaned.split(/\s+/).filter(t => t.length > 0);
    
    // 构建FTS查询表达式
    // 使用AND连接，支持前缀匹配
    return terms
      .map(term => `"${term}"*`)  // 前缀匹配
      .join(' AND ');
  }
  
  /**
   * 搜索建议
   */
  getSuggestions(tenantId: string, prefix: string, limit: number = 5): string[] {
    const sql = `
      SELECT DISTINCT word
      FROM messages_fts_vocab
      WHERE word LIKE ? || '%'
      ORDER BY docfreq DESC
      LIMIT ?
    `;
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(prefix, limit) as Record<string, any>[];
    
    return rows.map(row => row.word);
  }
}

interface FTSSearchOptions {
  limit?: number;
  filter?: SearchFilter;
  highlight?: boolean;
  snippetSize?: number;
}

interface FTSSearchResult {
  id: string;
  message_id: number;
  session_key: string;
  content: string;
  score: number;
  metadata?: Record<string, any>;
}
```

### 4.2 高级搜索功能

```typescript
/**
 * 高级搜索功能
 */
export class AdvancedSearch {
  private db: DatabaseSync;
  private ftsSearcher: FTSSearcher;
  
  constructor(db: DatabaseSync, ftsSearcher: FTSSearcher) {
    this.db = db;
    this.ftsSearcher = ftsSearcher;
  }
  
  /**
   * 布尔搜索
   */
  booleanSearch(
    tenantId: string,
    query: BooleanQuery,
    options: SearchOptions = {}
  ): FTSSearchResult[] {
    const ftsQuery = this.buildBooleanFTSQuery(query);
    
    return this.ftsSearcher.search(tenantId, ftsQuery, options);
  }
  
  /**
   * 短语搜索
   */
  phraseSearch(
    tenantId: string,
    phrase: string,
    options: SearchOptions = {}
  ): FTSSearchResult[] {
    // FTS5短语搜索使用双引号
    const ftsQuery = `"${phrase}"`;
    
    return this.ftsSearcher.search(tenantId, ftsQuery, options);
  }
  
  /**
   * 通配符搜索
   */
  wildcardSearch(
    tenantId: string,
    pattern: string,
    options: SearchOptions = {}
  ): FTSSearchResult[] {
    // FTS5支持*前缀通配符
    const ftsQuery = pattern.replace(/\*/g, '*');
    
    return this.ftsSearcher.search(tenantId, ftsQuery, options);
  }
  
  /**
   * 构建布尔FTS查询
   */
  private buildBooleanFTSQuery(query: BooleanQuery): string {
    const parts: string[] = [];
    
    if (query.must) {
      parts.push(...query.must.map(t => `"${t}"`));
    }
    
    if (query.should) {
      const shouldPart = '(' + query.should.map(t => `"${t}"`).join(' OR ') + ')';
      parts.push(shouldPart);
    }
    
    if (query.must_not) {
      parts.push(...query.must_not.map(t => `NOT "${t}"`));
    }
    
    return parts.join(' AND ');
  }
}

interface BooleanQuery {
  must?: string[];      // 必须包含
  should?: string[];    // 应该包含（至少一个）
  must_not?: string[];  // 不能包含
}
```

---

## 五、时间线检索

### 5.1 时序上下文检索

```typescript
/**
 * 时间线检索器
 */
export class TimelineSearcher {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 获取消息时间线
   */
  getTimeline(
    sessionKey: string,
    options: TimelineOptions = {}
  ): TimelineResult {
    const {
      anchorId,
      depth = 5,
      direction = 'both',
      includeSummaries = true
    } = options;
    
    let anchorTime: number;
    
    if (anchorId) {
      // 获取锚点消息时间
      const anchorStmt = this.db.prepare(`
        SELECT created_at_epoch FROM messages WHERE id = ?
      `);
      const anchor = anchorStmt.get(anchorId) as any;
      anchorTime = anchor?.created_at_epoch || Date.now();
    } else {
      // 使用最新消息作为锚点
      anchorTime = Date.now();
    }
    
    // 获取时间线消息
    const messages = this.getTimelineMessages(
      sessionKey,
      anchorTime,
      depth,
      direction
    );
    
    // 获取相关摘要
    let summaries: Summary[] = [];
    if (includeSummaries) {
      summaries = this.getRelevantSummaries(sessionKey, messages);
    }
    
    return {
      anchor: anchorId,
      messages,
      summaries,
      context: this.buildContext(messages, summaries)
    };
  }
  
  /**
   * 获取时间线消息
   */
  private getTimelineMessages(
    sessionKey: string,
    anchorTime: number,
    depth: number,
    direction: 'before' | 'after' | 'both'
  ): Message[] {
    let sql: string;
    let params: any[];
    
    if (direction === 'before') {
      sql = `
        SELECT * FROM messages
        WHERE session_key = ? AND created_at_epoch < ?
        ORDER BY created_at_epoch DESC
        LIMIT ?
      `;
      params = [sessionKey, anchorTime, depth];
    } else if (direction === 'after') {
      sql = `
        SELECT * FROM messages
        WHERE session_key = ? AND created_at_epoch > ?
        ORDER BY created_at_epoch ASC
        LIMIT ?
      `;
      params = [sessionKey, anchorTime, depth];
    } else {
      // both
      sql = `
        SELECT * FROM (
          SELECT * FROM messages
          WHERE session_key = ? AND created_at_epoch <= ?
          ORDER BY created_at_epoch DESC
          LIMIT ?
        ) before
        UNION ALL
        SELECT * FROM (
          SELECT * FROM messages
          WHERE session_key = ? AND created_at_epoch > ?
          ORDER BY created_at_epoch ASC
          LIMIT ?
        ) after
        ORDER BY created_at_epoch ASC
      `;
      params = [sessionKey, anchorTime, depth, sessionKey, anchorTime, depth];
    }
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, any>[];
    
    return rows.map(row => this.mapRowToMessage(row));
  }
  
  /**
   * 构建上下文
   */
  private buildContext(messages: Message[], summaries: Summary[]): string {
    const lines: string[] = [];
    
    // 添加摘要
    if (summaries.length > 0) {
      lines.push('## 会话摘要');
      for (const summary of summaries) {
        lines.push(`- ${summary.summary}`);
      }
      lines.push('');
    }
    
    // 添加消息
    lines.push('## 对话历史');
    for (const message of messages) {
      const role = message.role === 'user' ? '👤 用户' : '🤖 助手';
      lines.push(`**${role}**: ${message.content.substring(0, 200)}...`);
    }
    
    return lines.join('\n');
  }
}

interface TimelineOptions {
  anchorId?: number;          // 锚点消息ID
  depth?: number;             // 前后消息数量
  direction?: 'before' | 'after' | 'both';
  includeSummaries?: boolean;
}

interface TimelineResult {
  anchor?: number;
  messages: Message[];
  summaries: Summary[];
  context: string;
}
```

### 5.2 时间范围检索

```typescript
/**
 * 时间范围检索
 */
export class TimeRangeSearcher {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 按时间范围搜索
   */
  searchByTimeRange(
    tenantId: string,
    range: TimeRange,
    options: TimeRangeOptions = {}
  ): TimeRangeResult {
    const { pluginId, limit = 100, includeDetails = false } = options;
    
    let sql = `
      SELECT 
        s.session_key,
        s.title,
        s.created_at,
        s.completed_at,
        s.message_count,
        s.thinking_stage,
        s.importance
      FROM sessions s
      WHERE s.tenant_id = ?
        AND s.created_at_epoch >= ?
        AND s.created_at_epoch <= ?
    `;
    
    const params: any[] = [tenantId, range.start_epoch, range.end_epoch];
    
    if (pluginId) {
      sql += ' AND s.plugin_id = ?';
      params.push(pluginId);
    }
    
    sql += ' ORDER BY s.created_at_epoch DESC LIMIT ?';
    params.push(limit);
    
    const stmt = this.db.prepare(sql);
    const sessions = stmt.all(...params) as Record<string, any>[];
    
    // 获取每个会话的摘要
    const results = sessions.map(session => {
      const summaryStmt = this.db.prepare(`
        SELECT summary, key_insights, decisions
        FROM summaries
        WHERE session_key = ?
      `);
      const summary = summaryStmt.get(session.session_key) as any;
      
      return {
        session_key: session.session_key,
        title: session.title,
        created_at: session.created_at,
        completed_at: session.completed_at,
        message_count: session.message_count,
        thinking_stage: session.thinking_stage,
        importance: session.importance,
        summary: summary?.summary || null,
        key_insights: summary?.key_insights ? JSON.parse(summary.key_insights) : [],
        decisions: summary?.decisions ? JSON.parse(summary.decisions) : []
      };
    });
    
    return {
      range,
      sessions: results,
      total: results.length,
      statistics: this.calculateStatistics(results)
    };
  }
  
  /**
   * 按日期分组
   */
  groupByDate(
    tenantId: string,
    range: TimeRange,
    pluginId?: string
  ): DateGroupedResult {
    const result = this.searchByTimeRange(tenantId, range, { pluginId });
    
    const grouped: Map<string, SessionSummary[]> = new Map();
    
    for (const session of result.sessions) {
      const date = session.created_at.split('T')[0];
      
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      
      grouped.get(date)!.push(session);
    }
    
    return {
      range,
      groups: Array.from(grouped.entries()).map(([date, sessions]) => ({
        date,
        sessions,
        count: sessions.length
      }))
    };
  }
  
  /**
   * 计算统计信息
   */
  private calculateStatistics(sessions: SessionSummary[]): TimeRangeStatistics {
    return {
      total_sessions: sessions.length,
      total_messages: sessions.reduce((sum, s) => sum + s.message_count, 0),
      breakthrough_count: sessions.filter(s => s.importance === 'breakthrough').length,
      significant_count: sessions.filter(s => s.importance === 'significant').length,
      by_thinking_stage: this.groupByField(sessions, 'thinking_stage')
    };
  }
  
  private groupByField(sessions: SessionSummary[], field: string): Record<string, number> {
    const result: Record<string, number> = {};
    
    for (const session of sessions) {
      const value = (session as any)[field] || 'unknown';
      result[value] = (result[value] || 0) + 1;
    }
    
    return result;
  }
}

interface TimeRange {
  start: string;      // ISO 8601
  end: string;        // ISO 8601
  start_epoch: number;
  end_epoch: number;
}

interface TimeRangeOptions {
  pluginId?: string;
  limit?: number;
  includeDetails?: boolean;
}
```

---

## 六、检索协调器

### 6.1 统一检索接口

```typescript
/**
 * 检索协调器
 */
export class SearchCoordinator {
  private hybridSearcher: HybridSearcher;
  private timelineSearcher: TimelineSearcher;
  private timeRangeSearcher: TimeRangeSearcher;
  private budgetManager: TokenBudgetManager;
  
  constructor(
    hybridSearcher: HybridSearcher,
    timelineSearcher: TimelineSearcher,
    timeRangeSearcher: TimeRangeSearcher,
    budgetManager: TokenBudgetManager
  ) {
    this.hybridSearcher = hybridSearcher;
    this.timelineSearcher = timelineSearcher;
    this.timeRangeSearcher = timeRangeSearcher;
    this.budgetManager = budgetManager;
  }
  
  /**
   * 统一搜索入口
   */
  async search(
    tenantId: string,
    query: SearchQuery
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // 解析查询意图
    const intent = this.parseQueryIntent(query);
    
    let results: SearchResult[];
    
    switch (intent.type) {
      case 'semantic':
        results = await this.executeSemanticSearch(tenantId, query, intent);
        break;
      case 'temporal':
        results = await this.executeTemporalSearch(tenantId, query, intent);
        break;
      case 'hybrid':
      default:
        results = await this.executeHybridSearch(tenantId, query, intent);
    }
    
    // 应用Token预算
    const budgetedResults = this.applyBudget(results, query.budget);
    
    return {
      query: query.text,
      intent,
      results: budgetedResults,
      metadata: {
        total: results.length,
        returned: budgetedResults.length,
        latency_ms: Date.now() - startTime,
        budget_used: this.estimateTokens(budgetedResults)
      }
    };
  }
  
  /**
   * 解析查询意图
   */
  private parseQueryIntent(query: SearchQuery): QueryIntent {
    const text = query.text.toLowerCase();
    
    // 时间相关意图
    const timePatterns = [
      /昨天|今天|本周|上周|本月|上月/,
      /\d{4}-\d{2}-\d{2}/,
      /最近\s*\d+\s*(天|周|月)/
    ];
    
    if (timePatterns.some(p => p.test(text))) {
      return {
        type: 'temporal',
        timeRange: this.extractTimeRange(text)
      };
    }
    
    // 语义相关意图
    if (query.mode === 'semantic' || query.mode === 'hybrid') {
      return {
        type: query.mode,
        semanticQuery: query.text
      };
    }
    
    return {
      type: 'hybrid',
      semanticQuery: query.text
    };
  }
  
  /**
   * 执行混合搜索
   */
  private async executeHybridSearch(
    tenantId: string,
    query: SearchQuery,
    intent: QueryIntent
  ): Promise<SearchResult[]> {
    return this.hybridSearcher.search(tenantId, query.text, {
      limit: query.limit || 20,
      filter: query.filter
    });
  }
  
  /**
   * 执行时间搜索
   */
  private async executeTemporalSearch(
    tenantId: string,
    query: SearchQuery,
    intent: QueryIntent
  ): Promise<SearchResult[]> {
    const result = this.timeRangeSearcher.searchByTimeRange(
      tenantId,
      intent.timeRange!,
      { pluginId: query.filter?.plugin_id }
    );
    
    return result.sessions.map(s => ({
      id: s.session_key,
      type: 'session' as const,
      title: s.title || '无标题会话',
      content: s.summary || '',
      score: 1.0,
      metadata: {
        created_at: s.created_at,
        message_count: s.message_count,
        importance: s.importance,
        thinking_stage: s.thinking_stage
      }
    }));
  }
  
  /**
   * 应用Token预算
   */
  private applyBudget(
    results: SearchResult[],
    budget?: number
  ): SearchResult[] {
    const actualBudget = budget || 2000;
    return this.budgetManager.calculateIndexResults(results, actualBudget);
  }
  
  /**
   * 估算Token数
   */
  private estimateTokens(results: SearchResult[]): number {
    return results.length * 50;  // 索引层每条约50 tokens
  }
}

interface SearchQuery {
  text: string;
  mode?: 'semantic' | 'temporal' | 'hybrid';
  limit?: number;
  budget?: number;
  filter?: SearchFilter;
}

interface QueryIntent {
  type: 'semantic' | 'temporal' | 'hybrid';
  semanticQuery?: string;
  timeRange?: TimeRange;
}

interface SearchResponse {
  query: string;
  intent: QueryIntent;
  results: SearchResult[];
  metadata: {
    total: number;
    returned: number;
    latency_ms: number;
    budget_used: number;
  };
}
```

---

## 七、检索优化策略

### 7.1 查询缓存

```typescript
/**
 * 查询结果缓存
 */
export class QueryCache {
  private cache: LRUCache<string, CachedResult>;
  private config: QueryCacheConfig;
  
  constructor(config: QueryCacheConfig) {
    this.config = config;
    this.cache = new LRUCache({
      max: config.maxSize || 1000,
      ttl: config.ttl || 5 * 60 * 1000  // 5分钟
    });
  }
  
  /**
   * 获取缓存
   */
  get(query: SearchQuery): SearchResult[] | null {
    const key = this.getCacheKey(query);
    const cached = this.cache.get(key);
    
    if (cached) {
      // 检查是否过期
      if (Date.now() - cached.timestamp < this.cache.ttl) {
        return cached.results;
      }
      this.cache.delete(key);
    }
    
    return null;
  }
  
  /**
   * 设置缓存
   */
  set(query: SearchQuery, results: SearchResult[]): void {
    const key = this.getCacheKey(query);
    this.cache.set(key, {
      results,
      timestamp: Date.now()
    });
  }
  
  /**
   * 生成缓存Key
   */
  private getCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      text: query.text,
      mode: query.mode,
      limit: query.limit,
      filter: query.filter
    });
  }
  
  /**
   * 清除缓存
   */
  clear(): void {
    this.cache.clear();
  }
}
```

### 7.2 结果后处理

```typescript
/**
 * 结果后处理器
 */
export class ResultPostProcessor {
  
  /**
   * 去重
   */
  deduplicate(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.id)) {
        return false;
      }
      seen.add(result.id);
      return true;
    });
  }
  
  /**
   * 多样性重排
   */
  diversify(
    results: SearchResult[],
    options: DiversifyOptions = {}
  ): SearchResult[] {
    const { maxPerSession = 3, maxPerPlugin = 5 } = options;
    
    const sessionCounts: Map<string, number> = new Map();
    const pluginCounts: Map<string, number> = new Map();
    
    return results.filter(result => {
      const sessionKey = result.metadata?.session_key;
      const pluginId = result.metadata?.plugin_id;
      
      // 检查会话限制
      if (sessionKey) {
        const sessionCount = sessionCounts.get(sessionKey) || 0;
        if (sessionCount >= maxPerSession) {
          return false;
        }
        sessionCounts.set(sessionKey, sessionCount + 1);
      }
      
      // 检查插件限制
      if (pluginId) {
        const pluginCount = pluginCounts.get(pluginId) || 0;
        if (pluginCount >= maxPerPlugin) {
          return false;
        }
        pluginCounts.set(pluginId, pluginCount + 1);
      }
      
      return true;
    });
  }
  
  /**
   * 高亮关键词
   */
  highlight(
    results: SearchResult[],
    query: string,
    options: HighlightOptions = {}
  ): SearchResult[] {
    const { tag = '**', maxLength = 200 } = options;
    const terms = query.toLowerCase().split(/\s+/);
    
    return results.map(result => {
      let content = result.content;
      
      // 截断
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...';
      }
      
      // 高亮
      for (const term of terms) {
        const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
        content = content.replace(regex, `${tag}$1${tag}`);
      }
      
      return {
        ...result,
        content
      };
    });
  }
  
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
```

---

## 八、检索监控

### 8.1 检索指标

```typescript
/**
 * 检索指标收集器
 */
export class SearchMetricsCollector {
  private metrics: SearchMetrics = {
    total_queries: 0,
    queries_by_type: {},
    avg_latency_ms: 0,
    p95_latency_ms: 0,
    cache_hit_rate: 0,
    zero_result_rate: 0
  };
  
  private latencies: number[] = [];
  private cacheHits = 0;
  private cacheMisses = 0;
  private zeroResults = 0;
  
  /**
   * 记录查询
   */
  recordQuery(
    type: string,
    latencyMs: number,
    resultCount: number,
    cacheHit: boolean
  ): void {
    this.metrics.total_queries++;
    
    // 按类型统计
    this.metrics.queries_by_type[type] = 
      (this.metrics.queries_by_type[type] || 0) + 1;
    
    // 延迟统计
    this.latencies.push(latencyMs);
    
    // 缓存统计
    if (cacheHit) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    
    // 零结果统计
    if (resultCount === 0) {
      this.zeroResults++;
    }
  }
  
  /**
   * 获取指标
   */
  getMetrics(): SearchMetrics {
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    
    return {
      ...this.metrics,
      avg_latency_ms: this.average(this.latencies),
      p95_latency_ms: this.percentile(sortedLatencies, 95),
      cache_hit_rate: this.cacheHits / (this.cacheHits + this.cacheMisses),
      zero_result_rate: this.zeroResults / this.metrics.total_queries
    };
  }
  
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }
}
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
