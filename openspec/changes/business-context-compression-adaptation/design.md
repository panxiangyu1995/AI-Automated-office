## Context

### 背景

现有上下文压缩机制基于 Claude Code 的 9 段式设计实现，主要面向 Coding 场景。当前实现存在以下问题：

1. **场景不匹配**：Claude Code 面向代码生成场景，压缩保留的是技术上下文（文件、函数、错误）；办公场景需要保留业务上下文（审批状态、部门权限、文档关联）

2. **触发条件单一**：现有实现仅基于 Token 阈值触发，缺少办公场景特有的触发条件（部门切换、审批变更）

3. **保留规则缺失**：没有区分业务关键信息（待审批项）和可压缩信息（历史查询结果）

4. **恢复机制不完善**：压缩后无法按需恢复特定业务实体

### 当前状态

- `context_compression.rs` 基础压缩逻辑已完成
- `epic-53-story-53-2-context-compression` 变更已实现会话摘要持久化
- `message-context-compression` 变更已实现基础压缩策略

### 约束

- 必须向后兼容现有压缩机制
- 压缩不能丢失关键业务信息
- 需要支持多部门、多租户场景
- 压缩应该对用户透明

## Goals / Non-Goals

**Goals:**

1. 将 9 段式压缩扩展为 9+X 段式，新增办公场景专用段
2. 实现 4 层渐进式压缩策略（业务记忆 → 微压缩 → 业务压缩 → 响应式）
3. 定义业务 Never Compress 规则（审批状态、表单草稿、部门上下文等）
4. 实现多维度触发条件（Token 阈值 + 业务事件）
5. 实现业务实体恢复机制

**Non-Goals:**

1. 不改变消息存储格式（SQLite 仍存完整消息）
2. 不实现 LLM Function Calling 压缩
3. 不支持实时压缩（仅在发送前压缩）
4. 不实现跨会话压缩（仅处理当前会话）

## Decisions

### Decision 1: 压缩结构 - 9+X 段式

**选择：** 在 Claude Code 的 9 段基础上扩展，新增 5 个办公专用段

**理由：**
- 继承成熟的 9 段结构，确保通用信息保留
- 新增段针对办公场景特殊需求
- X 设计预留扩展性

**9+X 段结构：**

```
基础9段（继承）:
1. Primary Request and Intent     - 主要业务请求和意图
2. Key Business Concepts          - 关键业务概念（替代技术概念）
3. Documents and Data References   - 文档和数据引用
4. Decisions and Resolutions       - 决策和解决方案（替代错误修复）
5. Problem Solving                 - 问题解决
6. All User Messages              - 所有用户消息
7. Pending Tasks                  - 待处理任务
8. Current Work                   - 当前工作
9. Optional Next Step             - 可选的下一步

办公扩展段（新增）:
10. Department Context            - 部门上下文
    - current_department: 当前部门
    - related_departments: 关联部门
    - department_permissions: 部门权限
11. Approval Chain Status        - 审批链状态
    - pending_count: 待审批数
    - next_approval: 下一审批节点
    - recent_decisions: 近期审批决定
12. Related Documents             - 关联文档
    - recent_docs: 最近访问文档列表
    - pending_docs: 待处理文档
13. Cross-Department Dependencies - 跨部门依赖
    - pending_dependencies: 待处理依赖
    - completed_deps: 已完成依赖
14. Business Rules Applied        - 应用的业务规则
    - applied_rules: 应用的规则
    - custom_rules: 自定义规则
```

### Decision 2: 压缩策略 - 4 层渐进式

**选择：** 实现 4 层渐进式压缩策略

**层级定义：**

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: 业务记忆压缩 (Business Memory Compact)                 │
│ - 最轻量，优先尝试                                                │
│ - 使用已提取的会话记忆，无需调用 LLM                              │
│ - 保留: 最近摘要之后的内容                                        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: 业务微压缩 (Business Micro Compact)                    │
│ - 清理过期的业务查询结果                                          │
│ - 保留: 最近3条详细结果 + 摘要                                    │
│ - 可清除: 历史通知、活动日志、旧文档预览                            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: 业务全量压缩 (Business Full Compact)                    │
│ - 调用 LLM 生成 9+X 段式摘要                                      │
│ - 完整业务上下文保留                                              │
│ - 触发条件最严格                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: 响应式压缩 (Reactive Compact)                           │
│ - API 错误时的最后防线                                            │
│ - 从尾部向前删除业务消息轮次                                      │
│ - 确保至少保留最近5轮                                             │
└─────────────────────────────────────────────────────────────────┘
```

**层级选择逻辑：**

```typescript
function selectCompressionStrategy(
  tokenCount: number,
  pendingApprovals: number,
  departmentChanged: boolean,
  lastCompactTime: Date | null
): CompressionStrategy {
  // 层级1: 会话记忆压缩（最优先）
  if (hasSessionMemory && tokenCount < MEMORY_COMPACT_THRESHOLD) {
    return 'business_memory';
  }

  // 层级2: 微压缩
  if (tokenCount >= MICRO_COMPACT_THRESHOLD || hasStaleNotifications) {
    return 'micro';
  }

  // 层级3: 业务全量压缩
  if (tokenCount >= FULL_COMPACT_THRESHOLD) {
    return 'business_full';
  }

  // 层级4: 响应式压缩
  return 'reactive';
}
```

### Decision 3: 触发条件 - 多维度触发

**选择：** Token 阈值 + 业务事件双维度触发

**触发条件矩阵：**

| 触发类型 | 条件 | 压缩层级 | 优先级 |
|---------|------|---------|--------|
| Token 阈值 | token > window - 15000 | Layer 2/3 | 中 |
| 部门切换 | user switches department | Layer 1 | 高 |
| 审批变更 | approval status changed | Layer 2 | 高 |
| 时效过期 | 30min 无操作后首次交互 | Layer 2 | 中 |
| 手动触发 | user clicks compress | Layer 3 | 用户 |
| API 错误 | prompt_too_long | Layer 4 | 错误 |

**阈值配置：**

```typescript
export const BUSINESS_COMPACT_CONFIG = {
  // Token 阈值
  AUTO_COMPACT_BUFFER_TOKENS: 15_000,      // 自动压缩缓冲
  WARNING_THRESHOLD: 25_000,               // 警告阈值
  ERROR_THRESHOLD: 25_000,                 // 错误阈值

  // 层级阈值
  MEMORY_COMPACT_THRESHOLD: 20_000,        // 业务记忆压缩
  MICRO_COMPACT_THRESHOLD: 40_000,        // 微压缩
  FULL_COMPACT_THRESHOLD: 60_000,         // 全量压缩

  // 业务阈值
  APPROVAL_CONTEXT_BUFFER: 20_000,        // 审批流程额外缓冲
  STALE_THRESHOLD_MINUTES: 30,             // 过期时间
  ARCHIVE_THRESHOLD_HOURS: 24,             // 归档时间

  // 保留规则
  KEEP_RECENT_MESSAGES: 5,                 // 最近消息数
  KEEP_RECENT_RESULTS: 3,                  // 最近结果数
}
```

### Decision 4: 保留规则 - Never Compress

**选择：** 定义明确的 Never Compress 类型列表

**Never Compress 类型：**

```typescript
const NEVER_COMPRESS_TYPES = {
  // 用户明确指定
  user_explicit_reference: {
    reason: '用户明确关注的数据',
    retention: 'permanent_until_user_dismissed'
  },

  // 审批相关（时效性最强）
  pending_approval: {
    reason: '待审批项时效性最高',
    retention: 'permanent_until_decided'
  },
  approval_decision: {
    reason: '审批决定影响后续流程',
    retention: 'permanent'
  },

  // 业务关键状态
  transaction_in_progress: {
    reason: '进行中的事务不能丢失',
    retention: 'permanent_until_completed'
  },
  form_draft: {
    reason: '表单草稿用户可能继续编辑',
    retention: 'permanent_until_submitted'
  },

  // 当前上下文
  current_department_context: {
    reason: '当前部门是操作的基础',
    retention: 'session_permanent'
  },
  user_permission_context: {
    reason: '权限上下文决定操作范围',
    retention: 'session_permanent'
  },

  // 最近访问
  recently_edited_document: {
    reason: '用户可能继续编辑',
    retention: '24_hours'
  }
}
```

**Compressible 类型：**

```typescript
const COMPRESSIBLE_TYPES = {
  // 历史查询结果
  historical_data_query: {
    compressAfter: '24_hours',
    keepSummary: true,
    summaryTemplate: '[查询条件] 返回 [结果数] 条记录'
  },

  // 报告预览
  report_preview: {
    compressAfter: '1_hour',
    keepSummary: true,
    summaryTemplate: '[报告名] 生成于 [时间]'
  },

  // 搜索结果
  search_results: {
    compressAfter: '30_minutes',
    keepSummary: true,
    summaryTemplate: '[搜索词] 找到 [结果数] 条'
  },

  // 历史通知
  notification: {
    compressAfter: '1_hour',
    keepSummary: false
  },

  // 活动日志
  activity_log: {
    compressAfter: '30_minutes',
    keepSummary: false
  }
}
```

### Decision 5: 恢复机制 - 按需恢复

**选择：** 自动恢复 + 手动恢复双模式

**自动恢复规则：**

```typescript
const AUTO_RECOVERY_RULES = [
  {
    trigger: 'user_mentions_document',
    documentPattern: /\b(doc|文档|文件|合同|报告)\s*[#：:]\s*(\w+)/i,
    action: 'restore_document_content',
    priority: 1
  },
  {
    trigger: 'user_mentions_approval',
    approvalPattern: /\b(审批|approve|approve)\s*[#：:]\s*(\w+)/i,
    action: 'restore_approval_details',
    priority: 1
  },
  {
    trigger: 'department_switch',
    action: 'restore_department_context',
    priority: 2
  },
  {
    trigger: 'user_asks_about_previous',
    pattern: /\b(之前|刚才|上面|之前提到)\b/,
    action: 'restore_recent_context',
    priority: 2
  }
]
```

**手动恢复触发：**

```typescript
interface ManualRecoveryTriggers {
  '@查看详情 {entity_id}': 'restore_entity_full_content',
  '@恢复文档 {doc_id}': 'restore_document',
  '@审批详情 {approval_id}': 'restore_approval_chain',
  '@查看历史 {query}': 'restore_search_history'
}
```

### Decision 6: 压缩执行位置

**选择：** 前端 + 后端协同

**理由：**
- Token 计算在 Rust 端已有实现
- 业务上下文在前端更易获取
- 减少跨进程通信开销

**职责划分：**

```
前端 (React/TypeScript):
├── 获取业务上下文（部门、审批、文档）
├── 执行微压缩（清理过期通知）
├── 管理压缩状态 UI
└── 触发恢复请求

后端 (Rust):
├── Token 计算和阈值判断
├── 执行全量压缩（LLM 调用）
├── 存储压缩历史
└── 管理会话记忆
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|-----|------|---------|
| 业务关键信息被误压缩 | 可能导致审批遗漏或操作错误 | Never Compress 规则 + 用户确认 |
| 摘要质量差丢失信息 | 后续决策缺乏完整上下文 | 保留完整历史 + 可恢复机制 |
| 多层压缩性能开销 | 响应延迟增加 | 渐进式策略 + 异步执行 |
| 跨部门信息丢失 | 协作场景上下文断裂 | 保留跨部门依赖关系 |
| 压缩时机不当 | 关键信息被截断 | 多种触发条件 + 最近消息保留 |

## Migration Plan

### Phase 1: 基础设施（1-2 天）

1. 创建业务压缩类型定义 `compact.types.ts`
2. 创建业务压缩服务目录结构
3. 定义 9+X 段式压缩提示词模板
4. 定义 Never Compress 和 Compressible 类型列表

### Phase 2: 层级实现（2-3 天）

1. 实现业务记忆压缩层
2. 实现业务微压缩层
3. 实现业务全量压缩层
4. 实现响应式压缩层

### Phase 3: 触发和恢复（1-2 天）

1. 实现多维度触发器
2. 实现自动恢复机制
3. 实现手动恢复触发

### Phase 4: 集成和测试（1-2 天）

1. 集成到现有 Agent Runtime
2. UI 添加压缩状态指示
3. 端到端测试
4. 性能测试和调优

### Rollback

- 压缩为可配置选项，可通过设置关闭
- 保留完整消息历史，可随时重建压缩上下文

## Open Questions

1. **LLM 摘要成本**：全量压缩需要额外 LLM 调用，如何控制成本？
2. **部门切换的压缩时机**：切换前压缩当前部门上下文，还是切换后重建？
3. **跨部门依赖的保留粒度**：需要保留多少历史依赖信息？
4. **用户感知**：压缩是否需要通知用户？通知频率如何控制？
5. **与现有压缩的关系**：新设计和现有 `context_compression.rs` 如何合并？
