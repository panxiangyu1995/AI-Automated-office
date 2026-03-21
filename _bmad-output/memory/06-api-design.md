# API接口设计

## 一、API设计概述

### 1.1 设计原则

| 原则 | 说明 |
|------|------|
| **RESTful** | 遵循REST架构风格，资源导向设计 |
| **版本化** | API版本通过URL路径控制 `/api/v1/` |
| **统一响应** | 标准化的响应格式 |
| **错误处理** | 结构化的错误信息 |
| **认证授权** | 基于JWT的认证机制 |

### 1.2 API分类

```
┌─────────────────────────────────────────────────────────────────┐
│                    API分类                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              内部API (Internal API)                      │   │
│  │  供Agent核心、Hook系统、工具系统调用                      │   │
│  │  - 记忆存储API                                           │   │
│  │  - 记忆检索API                                           │   │
│  │  - 认知状态API                                           │   │
│  │  - 会话管理API                                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              工具API (Tool API)                          │   │
│  │  供LLM调用的工具接口                                      │   │
│  │  - memory_search                                         │   │
│  │  - tunnel_state                                          │   │
│  │  - thinking_trajectory                                   │   │
│  │  - memory_forget                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              管理API (Admin API)                         │   │
│  │  供前端管理界面调用                                       │   │
│  │  - 记忆管理                                              │   │
│  │  - 统计分析                                              │   │
│  │  - 配置管理                                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、统一响应格式

### 2.1 成功响应

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  metadata?: {
    timestamp: string;
    requestId: string;
    [key: string]: any;
  };
}
```

**示例：**
```json
{
  "success": true,
  "data": {
    "id": "msg-001",
    "content": "消息内容"
  },
  "metadata": {
    "timestamp": "2026-03-21T10:30:00.000Z",
    "requestId": "req-abc123"
  }
}
```

### 2.2 错误响应

```typescript
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  metadata: {
    timestamp: string;
    requestId: string;
  };
}
```

**示例：**
```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "会话不存在",
    "details": {
      "sessionKey": "tenant1:hr:session-001"
    }
  },
  "metadata": {
    "timestamp": "2026-03-21T10:30:00.000Z",
    "requestId": "req-abc123"
  }
}
```

### 2.3 分页响应

```typescript
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}
```

---

## 三、内部API

### 3.1 会话管理API

#### 创建会话

```
POST /api/v1/sessions
```

**请求体：**
```typescript
interface CreateSessionRequest {
  tenant_id: string;
  plugin_id: string;
  session_id: string;
  user_id: string;
  user_prompt?: string;
  metadata?: Record<string, any>;
}
```

**响应：**
```typescript
interface SessionResponse {
  session_key: string;
  status: 'active';
  created_at: string;
}
```

#### 获取会话

```
GET /api/v1/sessions/{session_key}
```

**响应：**
```typescript
interface SessionDetailResponse {
  id: number;
  session_key: string;
  tenant_id: string;
  plugin_id: string;
  session_id: string;
  title: string | null;
  user_prompt: string | null;
  status: 'active' | 'completed' | 'archived' | 'error';
  message_count: number;
  token_input: number;
  token_output: number;
  tool_call_count: number;
  thinking_stage: ThinkingStage | null;
  importance: Importance | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}
```

#### 更新会话状态

```
PATCH /api/v1/sessions/{session_key}
```

**请求体：**
```typescript
interface UpdateSessionRequest {
  status?: 'active' | 'completed' | 'archived' | 'error';
  title?: string;
  thinking_stage?: ThinkingStage;
  importance?: Importance;
  stats_increment?: {
    message_count?: number;
    token_input?: number;
    token_output?: number;
    tool_call_count?: number;
  };
}
```

#### 列出会话

```
GET /api/v1/sessions
```

**查询参数：**
```
tenant_id: string (required)
plugin_id?: string
status?: 'active' | 'completed' | 'archived' | 'error'
page?: number (default: 1)
page_size?: number (default: 20)
sort?: 'created_at' | 'updated_at' | 'message_count'
order?: 'asc' | 'desc'
```

### 3.2 消息管理API

#### 追加消息

```
POST /api/v1/sessions/{session_key}/messages
```

**请求体：**
```typescript
interface CreateMessageRequest {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  metadata?: Record<string, any>;
}
```

**响应：**
```typescript
interface MessageResponse {
  id: number;
  session_key: string;
  role: string;
  content: string;
  created_at: string;
  token_count: number;
}
```

#### 获取会话消息

```
GET /api/v1/sessions/{session_key}/messages
```

**查询参数：**
```
limit?: number (default: 50)
offset?: number (default: 0)
before?: number (message id)
after?: number (message id)
```

**响应：**
```typescript
interface MessageListResponse {
  messages: Message[];
  has_more: boolean;
  total: number;
}
```

### 3.3 观察管理API

#### 创建观察

```
POST /api/v1/sessions/{session_key}/observations
```

**请求体：**
```typescript
interface CreateObservationRequest {
  type: ObservationType;
  title?: string;
  subtitle?: string;
  narrative?: string;
  facts?: string[];
  concepts?: string[];
  tool_name?: string;
  files_read?: string[];
  files_modified?: string[];
  importance?: Importance;
  domain_primary?: string;
  domain_secondary?: string;
}
```

#### 获取会话观察

```
GET /api/v1/sessions/{session_key}/observations
```

### 3.4 摘要管理API

#### 创建摘要

```
POST /api/v1/sessions/{session_key}/summary
```

**请求体：**
```typescript
interface CreateSummaryRequest {
  summary: string;
  key_insights?: string[];
  concepts?: string[];
  decisions?: string[];
  open_questions?: string[];
  quotable?: string[];
  domain_primary: string;
  domain_secondary?: string;
  thinking_stage: ThinkingStage;
  importance?: Importance;
  emotional_tone?: EmotionalTone;
  cognitive_pattern?: CognitivePattern;
}
```

#### 获取摘要

```
GET /api/v1/sessions/{session_key}/summary
```

### 3.5 事实管理API

#### 创建事实

```
POST /api/v1/facts
```

**请求体：**
```typescript
interface CreateFactRequest {
  tenant_id: string;
  user_id: string;
  content: string;
  category: FactCategory;
  importance?: Importance;
  confidence?: number;
  source_session_key?: string;
  source_message_id?: number;
}
```

#### 查询事实

```
GET /api/v1/facts
```

**查询参数：**
```
tenant_id: string (required)
user_id: string (required)
category?: FactCategory
importance?: Importance
verified?: boolean
page?: number
page_size?: number
```

---

## 四、工具API

### 4.1 memory_search 工具

```typescript
const memory_search_tool = {
  name: 'memory_search',
  description: '搜索记忆索引，返回相关的历史对话和观察',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '搜索查询文本'
      },
      mode: {
        type: 'string',
        enum: ['semantic', 'keyword', 'hybrid'],
        default: 'hybrid',
        description: '搜索模式'
      },
      limit: {
        type: 'number',
        default: 10,
        description: '返回结果数量'
      },
      layer: {
        type: 'string',
        enum: ['index', 'timeline', 'details'],
        default: 'index',
        description: '返回层级'
      },
      filter: {
        type: 'object',
        properties: {
          plugin_id: { type: 'string' },
          date_range: {
            type: 'object',
            properties: {
              start: { type: 'string' },
              end: { type: 'string' }
            }
          },
          importance: { type: 'string' }
        }
      }
    },
    required: ['query']
  }
};
```

**响应格式：**
```typescript
interface MemorySearchResult {
  results: Array<{
    id: string;
    type: 'message' | 'observation' | 'summary';
    title: string;
    snippet: string;
    score: number;
    metadata: {
      session_key: string;
      created_at: string;
      importance: string;
    };
  }>;
  total: number;
  query_intent: {
    type: string;
    interpretation: string;
  };
}
```

### 4.2 tunnel_state 工具

```typescript
const tunnel_state_tool = {
  name: 'tunnel_state',
  description: '重建指定领域的认知状态，恢复思考上下文',
  parameters: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: '目标领域标识（如：hr, sales, finance）'
      },
      depth: {
        type: 'number',
        default: 3,
        description: '重建深度（1-5）'
      },
      include_history: {
        type: 'boolean',
        default: false,
        description: '是否包含历史演变'
      }
    },
    required: ['domain']
  }
};
```

**响应格式：**
```typescript
interface TunnelStateResult {
  domain: string;
  cognitive_state: string;  // 格式化的认知状态文本
  history?: string;         // 历史演变文本
  switching_cost: {
    level: 'none' | 'low' | 'high';
    description: string;
    estimated_tokens: number;
  };
  last_active: string;
}
```

### 4.3 thinking_trajectory 工具

```typescript
const thinking_trajectory_tool = {
  name: 'thinking_trajectory',
  description: '追踪特定主题的思维演变轨迹',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: '要追踪的主题或概念'
      },
      time_range: {
        type: 'string',
        default: '30d',
        description: '时间范围（如：7d, 30d, all）'
      }
    },
    required: ['topic']
  }
};
```

**响应格式：**
```typescript
interface ThinkingTrajectoryResult {
  topic: string;
  trajectory: string;  // 格式化的轨迹文本
  statistics: {
    sessions: number;
    stage_changes: number;
    milestones: number;
  };
  current_stage: ThinkingStage;
}
```

### 4.4 switching_cost 工具

```typescript
const switching_cost_tool = {
  name: 'switching_cost',
  description: '计算上下文切换成本',
  parameters: {
    type: 'object',
    properties: {
      from_domain: {
        type: 'string',
        description: '当前领域'
      },
      to_domain: {
        type: 'string',
        description: '目标领域'
      }
    },
    required: ['to_domain']
  }
};
```

### 4.5 memory_forget 工具

```typescript
const memory_forget_tool = {
  name: 'memory_forget',
  description: '遗忘特定记忆',
  parameters: {
    type: 'object',
    properties: {
      memory_id: {
        type: 'string',
        description: '要遗忘的记忆ID'
      },
      memory_type: {
        type: 'string',
        enum: ['message', 'observation', 'fact', 'session'],
        description: '记忆类型'
      },
      reason: {
        type: 'string',
        description: '遗忘原因'
      }
    },
    required: ['memory_id', 'memory_type']
  }
};
```

### 4.6 memory_update 工具

```typescript
const memory_update_tool = {
  name: 'memory_update',
  description: '更新记忆内容或元数据',
  parameters: {
    type: 'object',
    properties: {
      memory_id: {
        type: 'string',
        description: '记忆ID'
      },
      memory_type: {
        type: 'string',
        enum: ['fact', 'observation'],
        description: '记忆类型'
      },
      updates: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          importance: { type: 'string' },
          verified: { type: 'boolean' }
        }
      }
    },
    required: ['memory_id', 'memory_type', 'updates']
  }
};
```

---

## 五、管理API

### 5.1 记忆管理

#### 获取记忆统计

```
GET /api/v1/admin/memory/stats
```

**查询参数：**
```
tenant_id: string (required)
```

**响应：**
```typescript
interface MemoryStatsResponse {
  sessions: {
    total: number;
    active: number;
    completed: number;
  };
  messages: {
    total: number;
    by_role: Record<string, number>;
  };
  observations: {
    total: number;
    by_type: Record<string, number>;
    by_importance: Record<string, number>;
  };
  facts: {
    total: number;
    by_category: Record<string, number>;
    verified: number;
  };
  storage: {
    db_size_bytes: number;
    vector_size_bytes: number;
    cache_hit_rate: number;
  };
}
```

#### 批量删除记忆

```
POST /api/v1/admin/memory/batch-delete
```

**请求体：**
```typescript
interface BatchDeleteRequest {
  tenant_id: string;
  filters: {
    before_date?: string;
    plugin_id?: string;
    status?: string[];
  };
  dry_run?: boolean;
}
```

#### 导出记忆

```
GET /api/v1/admin/memory/export
```

**查询参数：**
```
tenant_id: string (required)
format: 'json' | 'csv' | 'markdown'
include_vectors: boolean
```

### 5.2 认知状态管理

#### 获取用户认知报告

```
GET /api/v1/admin/cognitive/report
```

**查询参数：**
```
tenant_id: string (required)
user_id: string (required)
```

**响应：**
```typescript
interface CognitiveReportResponse {
  summary: string;
  domains: Array<{
    domain: string;
    status: 'active' | 'recent' | 'dormant';
    thinking_stage: ThinkingStage;
    open_questions_count: number;
    decisions_count: number;
    breakthrough_count: number;
    last_active: string;
  }>;
  recommendations: string[];
}
```

#### 获取领域详情

```
GET /api/v1/admin/cognitive/domains/{domain}
```

#### 重置领域状态

```
POST /api/v1/admin/cognitive/domains/{domain}/reset
```

### 5.3 配置管理

#### 获取记忆配置

```
GET /api/v1/admin/config/memory
```

**响应：**
```typescript
interface MemoryConfigResponse {
  embedding: {
    provider: string;
    model: string;
    dimensions: number;
  };
  search: {
    default_limit: number;
    min_score: number;
    hybrid_weights: {
      semantic: number;
      fts: number;
    };
  };
  retention: {
    session_retention_days: number;
    fact_retention_days: number;
    backup_interval_hours: number;
  };
  performance: {
    cache_size: number;
    batch_size: number;
    flush_interval_ms: number;
  };
}
```

#### 更新记忆配置

```
PATCH /api/v1/admin/config/memory
```

---

## 六、WebSocket API

### 6.1 实时事件订阅

```
WS /api/v1/ws
```

**连接参数：**
```
tenant_id: string
auth_token: string
```

**订阅消息：**
```typescript
interface SubscribeMessage {
  action: 'subscribe';
  channels: string[];  // ['memory:*', 'session:tenant1:*']
}
```

**事件消息：**
```typescript
interface MemoryEvent {
  channel: string;
  event: 'created' | 'updated' | 'deleted';
  type: 'session' | 'message' | 'observation' | 'fact';
  data: Record<string, any>;
  timestamp: string;
}
```

### 6.2 事件类型

| 事件 | 说明 |
|------|------|
| `memory:session:created` | 新会话创建 |
| `memory:session:completed` | 会话完成 |
| `memory:message:created` | 新消息追加 |
| `memory:observation:created` | 新观察创建 |
| `memory:fact:created` | 新事实提取 |
| `memory:summary:created` | 摘要生成完成 |
| `memory:cognitive:updated` | 认知状态更新 |

---

## 七、错误码定义

### 7.1 通用错误码

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| `INVALID_REQUEST` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未授权 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源冲突 |
| `RATE_LIMITED` | 429 | 请求频率限制 |
| `INTERNAL_ERROR` | 500 | 内部错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

### 7.2 业务错误码

| 错误码 | 说明 |
|--------|------|
| `SESSION_NOT_FOUND` | 会话不存在 |
| `SESSION_ALREADY_COMPLETED` | 会话已完成 |
| `MESSAGE_TOO_LONG` | 消息过长 |
| `INVALID_SESSION_KEY` | 无效的会话Key格式 |
| `DOMAIN_NOT_FOUND` | 领域不存在 |
| `FACT_CONFLICT` | 事实冲突 |
| `EMBEDDING_FAILED` | 向量嵌入失败 |
| `SEARCH_TIMEOUT` | 搜索超时 |
| `STORAGE_ERROR` | 存储错误 |

---

## 八、API调用示例

### 8.1 完整工作流示例

```typescript
// 1. 创建会话
const session = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: 'tenant-001',
    plugin_id: 'hr',
    session_id: 'session-001',
    user_id: 'user-001',
    user_prompt: '帮我分析员工离职率'
  })
});

// 2. 追加用户消息
await fetch('/api/v1/sessions/tenant-001:hr:session-001/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'user',
    content: '帮我分析员工离职率'
  })
});

// 3. 追加助手响应
await fetch('/api/v1/sessions/tenant-001:hr:session-001/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    role: 'assistant',
    content: '我来帮您分析员工离职率...',
    tool_calls: [{
      id: 'call-001',
      name: 'memory_search',
      arguments: { query: '离职率分析' }
    }]
  })
});

// 4. 创建观察
await fetch('/api/v1/sessions/tenant-001:hr:session-001/observations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'discovery',
    title: '发现离职率趋势',
    narrative: '通过分析发现离职率在过去6个月呈上升趋势',
    importance: 'significant',
    domain_primary: 'hr'
  })
});

// 5. 完成会话并生成摘要
await fetch('/api/v1/sessions/tenant-001:hr:session-001', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'completed'
  })
});
```

### 8.2 工具调用示例

```typescript
// LLM调用 memory_search 工具
const searchResult = await memorySearchTool.execute({
  query: '员工离职率分析',
  mode: 'hybrid',
  limit: 5,
  filter: {
    plugin_id: 'hr'
  }
}, context);

// LLM调用 tunnel_state 工具
const stateResult = await tunnelStateTool.execute({
  domain: 'hr',
  depth: 3,
  include_history: true
}, context);
```

---

## 九、SDK封装

### 9.1 TypeScript SDK

```typescript
/**
 * 记忆系统SDK
 */
export class MemorySDK {
  private baseUrl: string;
  private authToken: string;
  
  constructor(config: SDKConfig) {
    this.baseUrl = config.baseUrl;
    this.authToken = config.authToken;
  }
  
  // 会话管理
  sessions = {
    create: (data: CreateSessionRequest) => 
      this.post('/sessions', data),
    
    get: (sessionKey: string) => 
      this.get(`/sessions/${sessionKey}`),
    
    update: (sessionKey: string, data: UpdateSessionRequest) => 
      this.patch(`/sessions/${sessionKey}`, data),
    
    list: (params: SessionListParams) => 
      this.get('/sessions', params),
    
    complete: (sessionKey: string) => 
      this.patch(`/sessions/${sessionKey}`, { status: 'completed' })
  };
  
  // 消息管理
  messages = {
    append: (sessionKey: string, data: CreateMessageRequest) => 
      this.post(`/sessions/${sessionKey}/messages`, data),
    
    list: (sessionKey: string, params?: MessageListParams) => 
      this.get(`/sessions/${sessionKey}/messages`, params)
  };
  
  // 检索
  search = {
    query: (params: SearchParams) => 
      this.post('/search', params),
    
    timeline: (sessionKey: string, params?: TimelineParams) => 
      this.get(`/sessions/${sessionKey}/timeline`, params)
  };
  
  // 认知状态
  cognitive = {
    tunnelState: (domain: string, params?: TunnelParams) => 
      this.post('/cognitive/tunnel', { domain, ...params }),
    
    trajectory: (topic: string, params?: TrajectoryParams) => 
      this.post('/cognitive/trajectory', { topic, ...params }),
    
    report: (tenantId: string, userId: string) => 
      this.get('/cognitive/report', { tenant_id: tenantId, user_id: userId })
  };
  
  // 私有方法
  private async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    
    return this.handleResponse(response);
  }
  
  private async post<T>(path: string, data?: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }
  
  private async patch<T>(path: string, data: Record<string, any>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/v1${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(data)
    });
    
    return this.handleResponse(response);
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    const json = await response.json();
    
    if (!response.ok || !json.success) {
      throw new ApiError(json.error || { message: 'Unknown error' });
    }
    
    return json.data;
  }
}
```

---

*文档版本: 1.0*
*创建日期: 2026-03-21*
*作者: Winston (Architect Agent)*
