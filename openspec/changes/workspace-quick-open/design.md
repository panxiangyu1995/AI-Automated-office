# Design: workspace-quick-open

## Context

当前 Quick Open 功能（Ctrl+Shift+M）在 `AppLayout.tsx` 中只是一个空壳：
```typescript
const searchResults: SearchResult[] = []  // 永远是空的
```

用户无法通过 Quick Open 快速定位到项目、单据、模板等资源，跨模块切换需要通过多层菜单或导航，操作成本高。

**约束：**
- 现有 Quick Search UI 骨架已存在，需复用
- 搜索需要跨多种资源类型（项目、单据、模板、知识）
- 需要高性能，避免阻塞主线程
- 需要与现有权限系统集成

## Goals / Non-Goals

**Goals:**
- 实现完整的 Quick Open 搜索功能
- 支持多资源类型搜索和筛选
- 实现相关性排序（当前工作区 > 最近使用 > 其他）
- 提供键盘导航支持

**Non-Goals:**
- 不实现全文检索（知识库独立系统）
- 不实现搜索结果缓存（Phase 3 或 4）
- 不实现高级搜索语法（如正则、过滤器）

## Decisions

### Decision 1: 搜索架构采用「聚合-分发」模式

**选择：**
- Search Aggregator 接收搜索请求
- 并发查询多个 Search Provider（项目、单据、模板、知识）
- Aggregator 合并结果、排序、返回

**替代方案考虑：**
- 后端聚合搜索：增加后端复杂度，单点瓶颈
- 前端仅搜索本地缓存：无法跨设备同步

**理由：**
- 解耦各资源类型的搜索逻辑
- 支持并行查询提高性能
- 便于扩展新的资源类型

### Decision 2: 搜索结果排序策略

**选择：**
1. 当前工作区内的资源优先
2. 最近访问的资源其次
3. 按资源类型权重（项目 > 单据 > 模板 > 知识）
4. 名称匹配度（模糊匹配）

**替代方案考虑：**
- 仅按名称匹配：忽略工作区上下文
- 仅按最近访问：难以发现其他工作区资源

**理由：**
- FR1000-2 要求"优先展示当前工作区相关结果"
- 平衡发现性与相关性

### Decision 3: 搜索节流（Debounce）

**选择：**
- 搜索输入 debounce 300ms
- 避免频繁 API 请求

**替代方案考虑：**
- 实时搜索：无 debounce，响应更快但请求频繁
- 手动触发：需按 Enter，交互繁琐

**理由：**
- 300ms 用户感知不到延迟，但能有效减少请求

### Decision 4: 搜索结果数据结构

**选择：**
```typescript
interface SearchResult {
  id: string
  type: 'project' | 'document' | 'template' | 'knowledge' | 'user'
  title: string
  subtitle: string
  workspaceId?: string
  workspaceName?: string
  lastAccessedAt?: Date
  score: number  // 用于排序
}
```

**替代方案考虑：**
- 每种类型独立数据结构：类型安全但合并排序困难
- 泛型 SearchResult：灵活但类型丢失

**理由：**
- 统一接口便于聚合和排序
- 可扩展新资源类型

## Risks / Trade-offs

[Risk] 搜索性能可能成为瓶颈
→ [Mitigation] 使用 debounce、并行查询、结果数量限制（每类型最多10条）

[Risk] 搜索结果权限过滤复杂
→ [Mitigation] 各 Provider 负责自身权限过滤，Aggregator 仅合并

[Risk] 搜索历史占用过多存储
→ [Mitigation] 限制历史记录数量（最近20条），按工作区隔离

## Open Questions

1. 搜索是否需要支持模糊匹配（fuzzy search）？
2. 是否需要实现「搜索建议」功能（search suggestions）？
3. 搜索结果的「收藏」功能是否在本次实现？
