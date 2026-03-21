# 存储层设计

## 一、存储层概述

### 1.1 设计目标

存储层是记忆系统的**数据持久化核心**，负责管理四层存储架构的数据存取、索引维护和一致性保证。

| 目标 | 说明 | 衡量标准 |
|------|------|----------|
| **高性能** | 快速读写响应 | 写入 < 50ms，读取 < 20ms |
| **可靠性** | 数据不丢失 | WAL + 定期备份 |
| **可扩展** | 支持数据增长 | 单库支持百万级消息 |
| **多租户** | 租户数据隔离 | 数据库级隔离 |

### 1.2 存储架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                    存储层架构                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   存储管理器 (StorageManager)             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐               │   │
│  │  │ ConnectionPool  │  │ TransactionMgr  │               │   │
│  │  └─────────────────┘  └─────────────────┘               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│              ┌───────────────┼───────────────┐                 │
│              ▼               ▼               ▼                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │  SQLiteStore  │  │  VectorStore  │  │  CacheStore   │      │
│  │  (L1/L3/L4)   │  │  (L2)         │  │  (热数据)     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐      │
│  │ SQLite + FTS5 │  │   LanceDB     │  │  Redis/Memory │      │
│  │  文件存储     │  │   文件存储    │  │  内存缓存     │      │
│  └───────────────┘  └───────────────┘  └───────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、SQLite存储引擎

### 2.1 数据库布局

```
~/.openclaw/
├── tenants/
│   ├── {tenant_id_1}/
│   │   ├── memory.db           # 主数据库
│   │   ├── memory.db-wal       # WAL日志
│   │   ├── memory.db-shm       # 共享内存
│   │   └── backups/            # 备份目录
│   │       ├── memory-2026-03-21.db
│   │       └── memory-2026-03-20.db
│   ├── {tenant_id_2}/
│   │   └── memory.db
│   └── ...
└── config.json
```

### 2.2 连接管理

```typescript
/**
 * SQLite连接管理器
 */
export class SQLiteConnectionManager {
  private connections: Map<string, DatabaseSync> = new Map();
  private config: SQLiteConfig;
  
  constructor(config: SQLiteConfig) {
    this.config = config;
  }
  
  /**
   * 获取租户数据库连接
   */
  getConnection(tenantId: string): DatabaseSync {
    if (!this.connections.has(tenantId)) {
      const dbPath = this.getDbPath(tenantId);
      const db = this.createConnection(dbPath);
      this.connections.set(tenantId, db);
    }
    return this.connections.get(tenantId)!;
  }
  
  /**
   * 创建数据库连接
   */
  private createConnection(dbPath: string): DatabaseSync {
    const db = new DatabaseSync(dbPath);
    
    // 配置PRAGMA
    db.exec(`PRAGMA journal_mode = WAL`);
    db.exec(`PRAGMA synchronous = NORMAL`);
    db.exec(`PRAGMA cache_size = -64000`);  // 64MB缓存
    db.exec(`PRAGMA temp_store = MEMORY`);
    db.exec(`PRAGMA mmap_size = 268435456`); // 256MB mmap
    db.exec(`PRAGMA busy_timeout = 5000`);
    
    // 初始化Schema
    this.initializeSchema(db);
    
    return db;
  }
  
  /**
   * 获取数据库路径
   */
  private getDbPath(tenantId: string): string {
    const baseDir = this.config.dataDir || path.join(os.homedir(), '.openclaw', 'tenants');
    const tenantDir = path.join(baseDir, tenantId);
    
    // 确保目录存在
    if (!fs.existsSync(tenantDir)) {
      fs.mkdirSync(tenantDir, { recursive: true });
    }
    
    return path.join(tenantDir, 'memory.db');
  }
  
  /**
   * 初始化Schema
   */
  private initializeSchema(db: DatabaseSync): void {
    // 检查Schema版本
    const version = this.getSchemaVersion(db);
    
    if (version === 0) {
      // 初始化所有表
      this.createTables(db);
      this.createIndexes(db);
      this.createFtsTables(db);
      this.setSchemaVersion(db, CURRENT_SCHEMA_VERSION);
    } else if (version < CURRENT_SCHEMA_VERSION) {
      // 执行迁移
      this.runMigrations(db, version);
    }
  }
}
```

### 2.3 事务管理

```typescript
/**
 * 事务管理器
 */
export class TransactionManager {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 执行事务
   */
  async transaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN IMMEDIATE');
    
    try {
      const tx = new Transaction(this.db);
      const result = await fn(tx);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  
  /**
   * 批量插入事务
   */
  async batchInsert(
    table: string,
    records: Record<string, any>[]
  ): Promise<number[]> {
    return this.transaction(async (tx) => {
      const ids: number[] = [];
      
      for (const record of records) {
        const id = await tx.insert(table, record);
        ids.push(id);
      }
      
      return ids;
    });
  }
}

/**
 * 事务对象
 */
export class Transaction {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  async insert(table: string, data: Record<string, any>): Promise<number> {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...Object.values(data));
    
    return result.lastInsertRowid as number;
  }
  
  async update(table: string, data: Record<string, any>, where: string, params: any[]): Promise<number> {
    const setClause = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...Object.values(data), ...params);
    
    return result.changes as number;
  }
  
  async delete(table: string, where: string, params: any[]): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    
    return result.changes as number;
  }
}
```

### 2.4 数据访问对象 (DAO)

```typescript
/**
 * 会话DAO
 */
export class SessionDAO {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 创建会话
   */
  create(session: Omit<Session, 'id'>): number {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (
        session_key, tenant_id, plugin_id, session_id,
        title, user_prompt, status,
        created_at, created_at_epoch, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date();
    const result = stmt.run(
      session.session_key,
      session.tenant_id,
      session.plugin_id,
      session.session_id,
      session.title || null,
      session.user_prompt || null,
      session.status || 'active',
      now.toISOString(),
      now.getTime(),
      now.toISOString()
    );
    
    return result.lastInsertRowid as number;
  }
  
  /**
   * 根据session_key获取会话
   */
  getByKey(sessionKey: string): Session | null {
    const stmt = this.db.prepare(`
      SELECT * FROM sessions WHERE session_key = ?
    `);
    const row = stmt.get(sessionKey);
    return row ? this.mapRowToSession(row as Record<string, any>) : null;
  }
  
  /**
   * 列出租户的会话
   */
  listByTenant(tenantId: string, options: ListOptions = {}): Session[] {
    const { limit = 50, offset = 0, status } = options;
    
    let sql = 'SELECT * FROM sessions WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY created_at_epoch DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as Record<string, any>[];
    
    return rows.map(row => this.mapRowToSession(row));
  }
  
  /**
   * 更新会话状态
   */
  updateStatus(sessionKey: string, status: SessionStatus): number {
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET status = ?, updated_at = ?, completed_at = ?, completed_at_epoch = ?
      WHERE session_key = ?
    `);
    
    const now = new Date();
    const result = stmt.run(
      status,
      now.toISOString(),
      status === 'completed' ? now.toISOString() : null,
      status === 'completed' ? now.getTime() : null,
      sessionKey
    );
    
    return result.changes as number;
  }
  
  /**
   * 更新会话统计
   */
  updateStats(sessionKey: string, stats: Partial<SessionStats>): number {
    const updates: string[] = [];
    const params: any[] = [];
    
    if (stats.message_count !== undefined) {
      updates.push('message_count = ?');
      params.push(stats.message_count);
    }
    if (stats.token_input !== undefined) {
      updates.push('token_input = token_input + ?');
      params.push(stats.token_input);
    }
    if (stats.token_output !== undefined) {
      updates.push('token_output = token_output + ?');
      params.push(stats.token_output);
    }
    if (stats.tool_call_count !== undefined) {
      updates.push('tool_call_count = tool_call_count + ?');
      params.push(stats.tool_call_count);
    }
    
    if (updates.length === 0) return 0;
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    params.push(sessionKey);
    
    const sql = `UPDATE sessions SET ${updates.join(', ')} WHERE session_key = ?`;
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    
    return result.changes as number;
  }
  
  private mapRowToSession(row: Record<string, any>): Session {
    return {
      id: row.id,
      session_key: row.session_key,
      tenant_id: row.tenant_id,
      plugin_id: row.plugin_id,
      session_id: row.session_id,
      title: row.title,
      user_prompt: row.user_prompt,
      status: row.status,
      message_count: row.message_count,
      token_input: row.token_input,
      token_output: row.token_output,
      tool_call_count: row.tool_call_count,
      thinking_stage: row.thinking_stage,
      importance: row.importance,
      created_at: row.created_at,
      created_at_epoch: row.created_at_epoch,
      updated_at: row.updated_at,
      completed_at: row.completed_at,
      completed_at_epoch: row.completed_at_epoch,
      model_id: row.model_id,
      metadata: row.metadata ? JSON.parse(row.metadata) : null
    };
  }
}

interface ListOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

interface SessionStats {
  message_count?: number;
  token_input?: number;
  token_output?: number;
  tool_call_count?: number;
}
```

---

## 三、向量存储引擎

### 3.1 LanceDB集成

```typescript
/**
 * LanceDB向量存储管理器
 */
export class LanceDBManager {
  private connections: Map<string, lancedb.Connection> = new Map();
  private config: VectorStoreConfig;
  
  constructor(config: VectorStoreConfig) {
    this.config = config;
  }
  
  /**
   * 获取租户向量数据库连接
   */
  async getConnection(tenantId: string): Promise<lancedb.Connection> {
    if (!this.connections.has(tenantId)) {
      const dbPath = this.getDbPath(tenantId);
      const db = await lancedb.connect(dbPath);
      this.connections.set(tenantId, db);
    }
    return this.connections.get(tenantId)!;
  }
  
  /**
   * 获取或创建表
   */
  async getOrCreateTable(
    tenantId: string,
    tableName: string,
    schema?: ArrowSchema
  ): Promise<lancedb.Table> {
    const db = await this.getConnection(tenantId);
    
    const tables = await db.tableNames();
    
    if (tables.includes(tableName)) {
      return db.openTable(tableName);
    }
    
    if (!schema) {
      schema = this.getDefaultSchema();
    }
    
    // 创建空表
    return db.createTable(tableName, [], { schema });
  }
  
  /**
   * 获取数据库路径
   */
  private getDbPath(tenantId: string): string {
    const baseDir = this.config.dataDir || path.join(os.homedir(), '.openclaw', 'tenants');
    return path.join(baseDir, tenantId, 'vectors');
  }
  
  /**
   * 默认Schema
   */
  private getDefaultSchema(): ArrowSchema {
    return pa.schema([
      pa.field('id', pa.string()),
      pa.field('message_id', pa.int64()),
      pa.field('session_key', pa.string()),
      pa.field('content', pa.string()),
      pa.field('embedding', pa.list_(pa.float32(), this.config.dimensions || 384)),
      pa.field('tenant_id', pa.string()),
      pa.field('plugin_id', pa.string()),
      pa.field('role', pa.string()),
      pa.field('has_code', pa.bool_()),
      pa.field('has_question', pa.bool_()),
      pa.field('importance', pa.string()),
      pa.field('created_at', pa.string()),
      pa.field('year', pa.int32()),
      pa.field('month', pa.int32()),
    ]);
  }
}
```

### 3.2 向量嵌入服务

```typescript
/**
 * 嵌入服务
 */
export class EmbeddingService {
  private provider: EmbeddingProvider;
  private cache: Map<string, number[]> = new Map();
  private config: EmbeddingConfig;
  
  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
  }
  
  /**
   * 生成嵌入向量
   */
  async embed(text: string): Promise<number[]> {
    // 检查缓存
    const cacheKey = this.getCacheKey(text);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // 调用嵌入模型
    const embedding = await this.provider.embed(text);
    
    // 缓存结果
    if (this.config.cacheSize && this.cache.size < this.config.cacheSize) {
      this.cache.set(cacheKey, embedding);
    }
    
    return embedding;
  }
  
  /**
   * 批量嵌入
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    // 过滤已缓存的
    const results: number[][] = new Array(texts.length);
    const toEmbed: { index: number; text: string }[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = this.getCacheKey(texts[i]);
      if (this.cache.has(cacheKey)) {
        results[i] = this.cache.get(cacheKey)!;
      } else {
        toEmbed.push({ index: i, text: texts[i] });
      }
    }
    
    // 批量嵌入未缓存的
    if (toEmbed.length > 0) {
      const embeddings = await this.provider.embedBatch(toEmbed.map(t => t.text));
      
      for (let i = 0; i < toEmbed.length; i++) {
        results[toEmbed[i].index] = embeddings[i];
        
        // 缓存
        const cacheKey = this.getCacheKey(toEmbed[i].text);
        if (this.config.cacheSize && this.cache.size < this.config.cacheSize) {
          this.cache.set(cacheKey, embeddings[i]);
        }
      }
    }
    
    return results;
  }
  
  /**
   * 创建嵌入提供者
   */
  private createProvider(config: EmbeddingConfig): EmbeddingProvider {
    switch (config.provider) {
      case 'fastembed':
        return new FastEmbedProvider(config.model || 'BAAI/bge-small-en-v1.5');
      case 'openai':
        return new OpenAIEmbeddingProvider(config.apiKey!, config.model || 'text-embedding-3-small');
      case 'local':
        return new LocalEmbeddingProvider(config.modelPath!);
      default:
        throw new Error(`Unknown embedding provider: ${config.provider}`);
    }
  }
  
  private getCacheKey(text: string): string {
    // 使用简单hash作为缓存key
    return this.hashString(text);
  }
  
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

/**
 * FastEmbed提供者
 */
export class FastEmbedProvider implements EmbeddingProvider {
  private model: any;
  
  constructor(modelName: string) {
    // 初始化FastEmbed模型
    // 实际实现需要引入fastembed库
  }
  
  async embed(text: string): Promise<number[]> {
    const embeddings = await this.model.embed([text]);
    return Array.from(embeddings[0]);
  }
  
  async embedBatch(texts: string[]): Promise<number[][]> {
    const embeddings = await this.model.embed(texts);
    return embeddings.map(e => Array.from(e));
  }
}
```

### 3.3 向量存储操作

```typescript
/**
 * 向量存储操作
 */
export class VectorStoreOperations {
  private lancedb: LanceDBManager;
  private embeddingService: EmbeddingService;
  
  constructor(lancedb: LanceDBManager, embeddingService: EmbeddingService) {
    this.lancedb = lancedb;
    this.embeddingService = embeddingService;
  }
  
  /**
   * 存储消息嵌入
   */
  async storeMessageEmbedding(
    tenantId: string,
    message: MessageEmbeddingInput
  ): Promise<void> {
    const table = await this.lancedb.getOrCreateTable(tenantId, 'message_embeddings');
    
    const embedding = await this.embeddingService.embed(message.content);
    
    const now = new Date();
    const record = {
      id: uuidv4(),
      message_id: message.message_id,
      session_key: message.session_key,
      content: message.content.substring(0, 1000),  // 截断存储
      embedding,
      tenant_id: tenantId,
      plugin_id: message.plugin_id,
      role: message.role,
      has_code: message.has_code || false,
      has_question: message.has_question || false,
      importance: message.importance || 'routine',
      created_at: now.toISOString(),
      year: now.getFullYear(),
      month: now.getMonth() + 1
    };
    
    await table.add([record]);
  }
  
  /**
   * 向量搜索
   */
  async vectorSearch(
    tenantId: string,
    query: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const { limit = 10, filter, minScore = 0.5 } = options;
    
    const table = await this.lancedb.getOrCreateTable(tenantId, 'message_embeddings');
    const queryEmbedding = await this.embeddingService.embed(query);
    
    let search = table.vectorSearch(queryEmbedding).limit(limit);
    
    // 添加过滤条件
    if (filter) {
      const filterClause = this.buildFilterClause(filter);
      search = search.where(filterClause);
    }
    
    const results = await search.toArray();
    
    return results
      .filter(r => r._distance <= (1 - minScore))  // 距离转换为相似度
      .map(r => ({
        id: r.id,
        message_id: r.message_id,
        session_key: r.session_key,
        content: r.content,
        score: 1 - r._distance,
        metadata: {
          role: r.role,
          importance: r.importance,
          created_at: r.created_at
        }
      }));
  }
  
  /**
   * 构建过滤条件
   */
  private buildFilterClause(filter: VectorSearchFilter): string {
    const clauses: string[] = [];
    
    if (filter.plugin_id) {
      clauses.push(`plugin_id = '${filter.plugin_id}'`);
    }
    if (filter.role) {
      clauses.push(`role = '${filter.role}'`);
    }
    if (filter.importance) {
      clauses.push(`importance = '${filter.importance}'`);
    }
    if (filter.has_code !== undefined) {
      clauses.push(`has_code = ${filter.has_code}`);
    }
    if (filter.date_range) {
      clauses.push(`created_at >= '${filter.date_range.start}'`);
      clauses.push(`created_at <= '${filter.date_range.end}'`);
    }
    
    return clauses.join(' AND ');
  }
}

interface VectorSearchOptions {
  limit?: number;
  filter?: VectorSearchFilter;
  minScore?: number;
}

interface VectorSearchFilter {
  plugin_id?: string;
  role?: string;
  importance?: string;
  has_code?: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}

interface VectorSearchResult {
  id: string;
  message_id: number;
  session_key: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}
```

---

## 四、缓存层设计

### 4.1 内存缓存

```typescript
/**
 * 内存缓存管理器
 */
export class MemoryCache {
  private cache: LRUCache<string, CacheEntry>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  
  constructor(config: CacheConfig) {
    this.cache = new LRUCache<string, CacheEntry>({
      max: config.maxSize || 10000,
      ttl: config.ttl || 1000 * 60 * 30,  // 30分钟
      updateAgeOnGet: true,
      dispose: (value, key) => {
        this.stats.evictions++;
      }
    });
  }
  
  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.hits++;
      return entry.value as T;
    }
    this.stats.misses++;
    return null;
  }
  
  /**
   * 设置缓存
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      ttl: ttl || this.cache.ttl
    });
  }
  
  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * 清除模式匹配的缓存
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * 获取统计信息
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0
    };
  }
}

interface CacheEntry {
  value: any;
  createdAt: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
}
```

### 4.2 缓存策略

```typescript
/**
 * 缓存键生成器
 */
export class CacheKeyGenerator {
  static sessionKey(sessionKey: string): string {
    return `session:${sessionKey}`;
  }
  
  static domainStateKey(tenantId: string, userId: string, domain: string): string {
    return `domain:${tenantId}:${userId}:${domain}`;
  }
  
  static recentSummariesKey(sessionKey: string, limit: number): string {
    return `summaries:${sessionKey}:${limit}`;
  }
  
  static factsKey(tenantId: string, userId: string, category?: string): string {
    return category 
      ? `facts:${tenantId}:${userId}:${category}`
      : `facts:${tenantId}:${userId}`;
  }
}

/**
 * 缓存预热策略
 */
export class CacheWarmupStrategy {
  private cache: MemoryCache;
  private sessionDAO: SessionDAO;
  
  constructor(cache: MemoryCache, sessionDAO: SessionDAO) {
    this.cache = cache;
    this.sessionDAO = sessionDAO;
  }
  
  /**
   * 预热会话缓存
   */
  async warmupSession(sessionKey: string): Promise<void> {
    const session = this.sessionDAO.getByKey(sessionKey);
    if (session) {
      this.cache.set(CacheKeyGenerator.sessionKey(sessionKey), session);
    }
  }
  
  /**
   * 预热活跃会话
   */
  async warmupActiveSessions(tenantId: string): Promise<void> {
    const sessions = this.sessionDAO.listByTenant(tenantId, {
      status: 'active',
      limit: 10
    });
    
    for (const session of sessions) {
      this.cache.set(CacheKeyGenerator.sessionKey(session.session_key), session);
    }
  }
}
```

---

## 五、数据同步与备份

### 5.1 数据备份策略

```typescript
/**
 * 备份管理器
 */
export class BackupManager {
  private config: BackupConfig;
  private scheduler: NodeJS.Timeout | null = null;
  
  constructor(config: BackupConfig) {
    this.config = config;
  }
  
  /**
   * 启动定时备份
   */
  startScheduledBackup(): void {
    // 每天凌晨3点执行备份
    this.scheduler = setInterval(() => {
      this.performBackup();
    }, 24 * 60 * 60 * 1000);
  }
  
  /**
   * 执行备份
   */
  async performBackup(): Promise<BackupResult> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupDir = path.join(this.config.backupDir, timestamp);
    
    // 创建备份目录
    fs.mkdirSync(backupDir, { recursive: true });
    
    // 备份SQLite数据库
    const dbBackupPath = path.join(backupDir, 'memory.db');
    await this.backupSQLite(dbBackupPath);
    
    // 备份向量数据库
    const vectorBackupPath = path.join(backupDir, 'vectors');
    await this.backupVectors(vectorBackupPath);
    
    // 清理旧备份
    this.cleanupOldBackups();
    
    return {
      timestamp,
      dbPath: dbBackupPath,
      vectorPath: vectorBackupPath,
      size: this.calculateBackupSize(backupDir)
    };
  }
  
  /**
   * 备份SQLite
   */
  private async backupSQLite(targetPath: string): Promise<void> {
    // 使用SQLite的备份API
    const source = new DatabaseSync(this.config.dbPath);
    const target = new DatabaseSync(targetPath);
    
    await source.backup(target);
    
    target.close();
    source.close();
  }
  
  /**
   * 清理旧备份
   */
  private cleanupOldBackups(): void {
    const retentionDays = this.config.retentionDays || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const backupDirs = fs.readdirSync(this.config.backupDir);
    
    for (const dir of backupDirs) {
      const dirDate = new Date(dir);
      if (dirDate < cutoffDate) {
        const fullPath = path.join(this.config.backupDir, dir);
        fs.rmSync(fullPath, { recursive: true });
      }
    }
  }
}
```

### 5.2 数据同步（云端）

```typescript
/**
 * 云端同步管理器
 */
export class CloudSyncManager {
  private config: CloudSyncConfig;
  private syncQueue: SyncTask[] = [];
  private isSyncing: boolean = false;
  
  constructor(config: CloudSyncConfig) {
    this.config = config;
  }
  
  /**
   * 添加同步任务
   */
  enqueueSync(task: SyncTask): void {
    this.syncQueue.push(task);
    this.processQueue();
  }
  
  /**
   * 处理同步队列
   */
  private async processQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    
    try {
      while (this.syncQueue.length > 0) {
        const task = this.syncQueue.shift()!;
        await this.executeSync(task);
      }
    } finally {
      this.isSyncing = false;
    }
  }
  
  /**
   * 执行同步
   */
  private async executeSync(task: SyncTask): Promise<void> {
    switch (task.type) {
      case 'session':
        await this.syncSession(task.data);
        break;
      case 'message':
        await this.syncMessage(task.data);
        break;
      case 'summary':
        await this.syncSummary(task.data);
        break;
    }
  }
  
  /**
   * 同步会话
   */
  private async syncSession(session: Session): Promise<void> {
    const response = await fetch(`${this.config.apiUrl}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(session)
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }
}

interface SyncTask {
  type: 'session' | 'message' | 'summary';
  data: any;
  timestamp: number;
}
```

---

## 六、性能优化

### 6.1 批量写入优化

```typescript
/**
 * 批量写入缓冲区
 */
export class BatchWriteBuffer {
  private buffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private flushCallback: (table: string, records: any[]) => Promise<void>;
  
  constructor(config: BatchConfig, flushCallback: (table: string, records: any[]) => Promise<void>) {
    this.config = config;
    this.flushCallback = flushCallback;
    this.startFlushTimer();
  }
  
  /**
   * 添加记录到缓冲区
   */
  add(table: string, record: any): void {
    if (!this.buffer.has(table)) {
      this.buffer.set(table, []);
    }
    
    this.buffer.get(table)!.push(record);
    
    // 检查是否需要立即刷新
    if (this.buffer.get(table)!.length >= this.config.batchSize) {
      this.flushTable(table);
    }
  }
  
  /**
   * 刷新单个表
   */
  private async flushTable(table: string): Promise<void> {
    const records = this.buffer.get(table);
    if (!records || records.length === 0) return;
    
    this.buffer.set(table, []);
    
    await this.flushCallback(table, records);
  }
  
  /**
   * 刷新所有缓冲区
   */
  async flushAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [table, records] of this.buffer) {
      if (records.length > 0) {
        promises.push(this.flushCallback(table, records));
      }
    }
    
    this.buffer.clear();
    
    await Promise.all(promises);
  }
  
  /**
   * 启动定时刷新
   */
  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      this.flushAll();
    }, this.config.flushInterval || 5000);
  }
}
```

### 6.2 索引优化建议

```sql
-- 复合索引优化
CREATE INDEX idx_messages_session_created ON messages(session_key, created_at_epoch DESC);
CREATE INDEX idx_observations_session_type ON observations(session_key, type);
CREATE INDEX idx_summaries_domain_importance ON summaries(domain_primary, importance);

-- 部分索引（只索引活跃会话）
CREATE INDEX idx_sessions_active ON sessions(created_at_epoch DESC) 
WHERE status = 'active';

-- 表达式索引（JSON字段查询优化）
-- SQLite不支持表达式索引，但可以通过生成列实现
ALTER TABLE sessions ADD COLUMN thinking_stage_text TEXT 
  GENERATED ALWAYS AS (json_extract(metadata, '$.thinking_stage')) STORED;
CREATE INDEX idx_sessions_thinking_stage ON sessions(thinking_stage_text);
```

---

## 七、监控与诊断

### 7.1 存储指标收集

```typescript
/**
 * 存储指标收集器
 */
export class StorageMetricsCollector {
  private db: DatabaseSync;
  
  constructor(db: DatabaseSync) {
    this.db = db;
  }
  
  /**
   * 收集数据库统计
   */
  collect(): StorageMetrics {
    return {
      // 表统计
      tables: {
        sessions: this.getTableStats('sessions'),
        messages: this.getTableStats('messages'),
        observations: this.getTableStats('observations'),
        summaries: this.getTableStats('summaries'),
        facts: this.getTableStats('facts')
      },
      
      // 数据库大小
      dbSize: this.getDbSize(),
      
      // 索引使用情况
      indexUsage: this.getIndexUsage(),
      
      // WAL状态
      walStatus: this.getWalStatus()
    };
  }
  
  private getTableStats(table: string): TableStats {
    const countStmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`);
    const count = (countStmt.get() as any).count;
    
    // 获取表大小估算
    const sizeStmt = this.db.prepare(`
      SELECT SUM(pgsize) as size 
      FROM dbstat 
      WHERE name = ?
    `);
    const size = (sizeStmt.get(table) as any)?.size || 0;
    
    return { count, size };
  }
  
  private getDbSize(): number {
    const stmt = this.db.prepare(`
      SELECT SUM(pgsize) as size FROM dbstat
    `);
    return (stmt.get() as any).size || 0;
  }
  
  private getWalStatus(): WalStatus {
    const stmt = this.db.prepare('PRAGMA wal_checkpoint');
    const result = stmt.get() as any;
    
    return {
      busy: result?.busy || 0,
      log: result?.log || 0,
      checkpointed: result?.checkpointed || 0
    };
  }
}
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
