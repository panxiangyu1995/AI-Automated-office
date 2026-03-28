# Spec: 记忆系统三层架构

## 功能规格

### FR14-4: AI助手支持三层记忆架构（个人记忆、企业知识库、图记忆）

**描述**: 记忆系统采用三层架构设计，每层有不同的访问权限和数据范围。

**层级定义**:
- **L1 个人记忆**: 用户级别的记忆，存储用户偏好、会话上下文、个人纠偏记录
- **L2 企业知识库**: 租户级别的知识共享，存储业务规则、部门知识、共享文档
- **L3 图记忆**: 实体关系存储和知识推理（Post-MVP）

**验证**:
- 三层架构正确实现
- 层级边界清晰
- 数据隔离正确

---

### FR14-5: 个人记忆层数据仅用户本人可访问

**描述**: L1个人记忆数据实现严格的用户隔离，只有用户本人可以访问。

**权限规则**:
- 查询必须附带 `user_id` 过滤
- 写入必须绑定当前用户
- 管理员无权查看用户个人记忆
- 审计日志记录所有访问

**验证**:
- 用户A无法访问用户B的个人记忆
- 管理员无法访问用户个人记忆
- 所有访问记录审计日志

---

### FR14-6: 企业知识库层数据租户全员可访问

**描述**: L2企业知识库数据对租户内所有用户开放访问。

**权限规则**:
- 查询必须附带 `tenant_id` 过滤
- 跨租户访问被禁止
- 部门知识库可设置部门级权限
- 写入需要相应权限

**验证**:
- 租户A用户无法访问租户B的知识库
- 租户内所有用户可访问企业知识库
- 部门知识库权限正确

---

### FR14-7: 图记忆层支持实体关系存储和知识推理（Post-MVP）

**描述**: L3图记忆支持实体关系图谱构建和知识推理。

**功能**:
- 实体识别与存储
- 关系抽取与存储
- 图谱查询
- 知识推理

**状态**: Post-MVP，不在当前迭代范围

---

### FR14-8: 记忆系统支持向量数据库本地嵌入式部署和云端独立服务两种模式

**描述**: 向量数据库支持两种部署模式，满足不同场景需求。

**模式定义**:
- **本地嵌入式 (sqlite-vec)**: 无需外部依赖，适合单机部署
- **云端服务 (Qdrant)**: 高性能分布式，适合大规模部署
- **混合模式**: 本地缓存 + 云端同步

**配置**:
```typescript
interface VectorConfig {
  mode: 'local' | 'cloud' | 'hybrid';
  local: {
    path: string;  // sqlite-vec数据库路径
  };
  cloud: {
    url: string;       // Qdrant服务地址
    apiKey?: string;   // API密钥
    collection: string; // 集合名称
  };
}
```

**验证**:
- 本地模式正常工作
- 云端模式正常工作
- 模式切换正确

---

### FR14-9: 记忆数据支持本地优先存储，有云端时增量同步备份

**描述**: 记忆数据采用本地优先策略，支持云端增量同步。

**同步策略**:
- 本地写入立即持久化
- 云端可用时增量同步
- 冲突检测与解决
- 离线模式支持

**冲突解决**:
```typescript
type ConflictStrategy = 
  | 'local_wins'   // 本地优先
  | 'remote_wins'  // 远程优先
  | 'latest_wins'  // 最新优先
  | 'merge';       // 智能合并
```

**验证**:
- 本地写入成功
- 云端同步正确
- 冲突解决正确
- 离线模式正常

---

### FR14-10: 记忆更新采用智能决策机制（ADD/UPDATE/DELETE/NONE）

**描述**: 记忆更新采用智能决策，避免冗余和冲突。

**决策类型**:
- **ADD**: 新增记忆，无相似项
- **UPDATE**: 更新现有记忆，发现矛盾
- **DELETE**: 删除过时记忆
- **NONE**: 无需更新，记忆冗余
- **MERGE**: 合并相关信息

**决策逻辑**:
```typescript
interface UpdateDecision {
  action: 'add' | 'update' | 'delete' | 'none' | 'merge';
  reason: string;
  confidence: number;
  affectedItems: string[];
}
```

**验证**:
- 新记忆正确添加
- 矛盾记忆正确更新
- 冗余记忆正确跳过
- 决策准确率 > 90%

---

### FR14-11: 记忆检索支持混合搜索（向量检索 + BM25关键词检索）

**描述**: 记忆检索采用混合搜索策略，提高召回率和准确率。

**检索策略**:
1. **向量检索**: 语义相似度搜索
2. **BM25检索**: 关键词匹配搜索
3. **RRF融合**: Reciprocal Rank Fusion排序

**RRF公式**:
```
RRF_score(d) = Σ (1 / (k + rank(d)))
```
其中 k = 60（常数）

**查询接口**:
```typescript
interface MemoryQuery {
  query: string;           // 查询文本
  layer: MemoryLayer;      // 记忆层级
  userId: string;          // 用户ID
  tenantId: string;        // 租户ID
  k: number;               // 返回数量
  tokenBudget?: number;    // Token预算
  filters?: MemoryFilter[]; // 过滤条件
}
```

**验证**:
- 向量检索正常
- BM25检索正常
- RRF融合正确
- 检索响应时间 < 200ms
- 召回率 > 95%

---

### FR14-12: 用户可查看和管理自己的记忆数据

**描述**: 提供前端界面让用户查看和管理记忆数据。

**功能**:
- 记忆列表展示
- 记忆搜索
- 记忆详情查看
- 记忆编辑
- 记忆删除
- 同步状态显示
- 统计信息展示

**界面组件**:
- `MemoryInspector.tsx`: 记忆查看器
- `MemoryConfig.tsx`: 记忆配置

**验证**:
- 列表正确展示
- 搜索功能正常
- 编辑/删除功能正常
- 同步状态正确

---

## API规格

### memory_search

检索记忆。

**请求**:
```typescript
interface MemorySearchRequest {
  query: string;
  layer: 'personal' | 'enterprise';
  userId: string;
  tenantId: string;
  k?: number;
  tokenBudget?: number;
}
```

**响应**:
```typescript
interface MemorySearchResponse {
  items: MemorySearchResult[];
  total: number;
  vectorTimeMs: number;
  bm25TimeMs: number;
  fusionTimeMs: number;
}
```

---

### memory_add

添加记忆。

**请求**:
```typescript
interface MemoryAddRequest {
  layer: 'personal' | 'enterprise';
  key: string;
  value: string;
  category: MemoryCategory;
  source: MemorySource;
  userId: string;
  tenantId: string;
}
```

**响应**:
```typescript
interface MemoryAddResponse {
  id: string;
  decision: UpdateDecision;
}
```

---

### memory_update

更新记忆。

**请求**:
```typescript
interface MemoryUpdateRequest {
  id: string;
  value: string;
  userId: string;
  tenantId: string;
}
```

**响应**:
```typescript
interface MemoryUpdateResponse {
  success: boolean;
  version: number;
}
```

---

### memory_delete

删除记忆。

**请求**:
```typescript
interface MemoryDeleteRequest {
  id: string;
  userId: string;
  tenantId: string;
}
```

**响应**:
```typescript
interface MemoryDeleteResponse {
  success: boolean;
}
```

---

### memory_stats

获取记忆统计。

**请求**:
```typescript
interface MemoryStatsRequest {
  userId: string;
  tenantId: string;
}
```

**响应**:
```typescript
interface MemoryStatsResponse {
  personalCount: number;
  enterpriseCount: number;
  totalSize: number;
  lastSyncAt: number | null;
  syncStatus: 'synced' | 'pending' | 'error';
}
```

---

### memory_sync

同步记忆。

**请求**:
```typescript
interface MemorySyncRequest {
  userId: string;
  tenantId: string;
}
```

**响应**:
```typescript
interface MemorySyncResponse {
  uploaded: number;
  downloaded: number;
  conflicts: number;
  resolvedConflicts: number;
}
```

---

## 事件规格

### MemoryAdded

记忆添加事件。

```typescript
interface MemoryAddedEvent {
  type: 'MemoryAdded';
  memoryId: string;
  layer: MemoryLayer;
  userId: string;
  tenantId: string;
  timestamp: number;
}
```

---

### MemoryUpdated

记忆更新事件。

```typescript
interface MemoryUpdatedEvent {
  type: 'MemoryUpdated';
  memoryId: string;
  layer: MemoryLayer;
  userId: string;
  tenantId: string;
  version: number;
  timestamp: number;
}
```

---

### MemoryDeleted

记忆删除事件。

```typescript
interface MemoryDeletedEvent {
  type: 'MemoryDeleted';
  memoryId: string;
  layer: MemoryLayer;
  userId: string;
  tenantId: string;
  timestamp: number;
}
```

---

### MemorySynced

记忆同步事件。

```typescript
interface MemorySyncedEvent {
  type: 'MemorySynced';
  userId: string;
  tenantId: string;
  uploaded: number;
  downloaded: number;
  conflicts: number;
  timestamp: number;
}
```

---

## 数据类型规格

### MemoryLayer

```typescript
type MemoryLayer = 
  | 'personal'    // L1: 个人记忆
  | 'enterprise'  // L2: 企业知识库
  | 'graph';      // L3: 图记忆 (Post-MVP)
```

### MemoryCategory

```typescript
type MemoryCategory =
  | 'preference'   // 用户偏好
  | 'fact'         // 关键事实
  | 'rule'         // 业务规则
  | 'context'      // 会话上下文
  | 'observation'  // 观察
  | 'summary'      // 摘要
  | 'knowledge';   // 知识
```

### MemorySource

```typescript
type MemorySource =
  | 'user_input'      // 用户输入
  | 'agent_inference' // Agent推理
  | 'tool_result'     // 工具结果
  | 'system_import'   // 系统导入
  | 'knowledge_base'; // 知识库
```

### MemoryItem

```typescript
interface MemoryItem {
  id: string;
  layer: MemoryLayer;
  tenantId: string;
  userId?: string;
  sessionKey?: string;
  key: string;
  value: string;
  category: MemoryCategory;
  confidence: number;
  source: MemorySource;
  embedding?: number[];
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  lastAccessedAt?: number;
  accessCount: number;
  version: number;
  isDeleted: boolean;
}
```

### MemorySearchResult

```typescript
interface MemorySearchResult {
  item: MemoryItem;
  score: number;
  vectorScore?: number;
  bm25Score?: number;
  highlights: string[];
}
```

### UpdateDecision

```typescript
interface UpdateDecision {
  action: 'add' | 'update' | 'delete' | 'none' | 'merge';
  reason: string;
  confidence: number;
  affectedItems: string[];
}
```

---

## 错误码规格

| 错误码 | 描述 |
|--------|------|
| `MEMORY_001` | 记忆不存在 |
| `MEMORY_002` | 权限不足 |
| `MEMORY_003` | 向量检索失败 |
| `MEMORY_004` | Embedding服务不可用 |
| `MEMORY_005` | 同步失败 |
| `MEMORY_006` | 冲突解决失败 |
| `MEMORY_007` | 存储空间不足 |
| `MEMORY_008` | 配置无效 |

---

## 性能规格

| 指标 | 要求 |
|------|------|
| 记忆检索响应时间 | < 200ms |
| 记忆写入响应时间 | < 100ms |
| 向量检索延迟 | < 100ms |
| BM25检索延迟 | < 50ms |
| 同步吞吐量 | > 1000条/秒 |
| 最大记忆条数/用户 | 100,000 |
| 最大向量维度 | 1536 |
