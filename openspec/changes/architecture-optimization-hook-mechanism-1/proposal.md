# Proposal: Agent 和插件 Hook 机制架构优化

## 变更类型
- [ ] 新功能
- [x] 架构优化
- [ ] 性能优化
- [ ] 代码重构

## 背景

### 现有问题

| 问题 | 位置 | 影响 |
|------|------|------|
| 事件系统分散 | 多个 hook 各自实现 listen | 重复订阅、内存泄漏风险 |
| 状态耦合 | useChatStore → CheckpointStore | 违反 DIP，难以独立测试 |
| 重复订阅 | useAgentRuntime | 每个实例创建独立订阅 |
| 生命周期混乱 | usePluginSidebar | 注册逻辑和 UI 更新混在一起 |
| 前后端接口不一致 | 多个 API | 类型安全降低 |

### 根因分析

1. **缺乏统一事件总线** - 前端没有 EventEmitter 模式
2. **依赖注入缺失** - 直接硬编码依赖，而非通过接口
3. **生命周期管理不规范** - 订阅和取消订阅分散在各处
4. **Hook 职责过重** - 一个 hook 承担了太多职责

## 优化目标

### 架构层面

```
┌─────────────────────────────────────────────────────────────┐
│                    优化后架构                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────────────┐               │
│  │   UI层      │     │    事件总线          │               │
│  │  Components │────▶│  EventBus (Hook)     │               │
│  └─────────────┘     └─────────────────────┘               │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌─────────────┐     ┌─────────────────────┐               │
│  │   Hooks    │◀───▶│  生命周期管理器       │               │
│  │  (纯逻辑)   │     │  PluginLifecycle     │               │
│  └─────────────┘     └─────────────────────┘               │
│         │                      │                             │
│         ▼                      ▼                             │
│  ┌─────────────┐     ┌─────────────────────┐               │
│  │   Stores   │◀───▶│   依赖容器           │               │
│  │ (Zustand)  │     │   ServiceContainer   │               │
│  └─────────────┘     └─────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则

| 原则 | 应用 |
|------|------|
| **单一职责** | Hook 只负责状态管理，业务逻辑提取到 Service |
| **依赖倒置** | 通过接口/上下文注入依赖，而非硬编码 |
| **开闭原则** | 通过事件扩展，而非修改现有代码 |
| **观察者模式** | 统一事件订阅/发布，消除重复订阅 |

## 优化方案

### 1. 前端：统一事件总线

```typescript
// 事件总线 Hook
class EventBus {
  private handlers: Map<string, Set<Handler>> = new Map()
  private static instance: EventBus

  static getInstance(): EventBus { /* singleton */ }
  
  subscribe(event: string, handler: Handler): () => void
  publish(event: string, payload: unknown): void
  unsubscribe(event: string, handler: Handler): void
}

function useEventBus(): EventBus {
  // React 友好的 event bus hook
}
```

### 2. 前端：生命周期管理器

```typescript
interface PluginLifecycleContext {
  eventBus: EventBus
  services: ServiceContainer
}

interface PluginHook {
  onInit?(ctx: PluginLifecycleContext): Promise<void>
  onMount?(ctx: PluginLifecycleContext): Promise<void>
  onUnmount?(ctx: PluginLifecycleContext): Promise<void>
  onEvent?(event: string, payload: unknown): void
}

class PluginLifecycleManager {
  register(plugin: PluginHook): void
  unregister(pluginId: string): void
  initialize(): Promise<void>
}
```

### 3. 前端：依赖容器

```typescript
class ServiceContainer {
  private services: Map<string, unknown> = new Map()
  
  register<T>(id: string, factory: () => T): void
  resolve<T>(id: string): T
  resolveOrDefault<T>(id: string, defaultValue: T): T
}

function useServiceContainer(): ServiceContainer {
  // 提供统一的依赖获取方式
}
```

### 4. 后端：插件生命周期钩子 (Rust)

```rust
// 插件生命周期 trait
#[async_trait]
pub trait PluginLifecycleHook: Send + Sync {
    async fn on_load(&self, ctx: &PluginContext) -> Result<()>;
    async fn on_unload(&self) -> Result<()>;
    async fn on_enable(&self) -> Result<()>;
    async fn on_disable(&self) -> Result<()>;
    fn lifecycle_name(&self) -> &'static str;
}

// 生命周期管理器
pub struct LifecycleManager {
    hooks: RwLock<HashMap<String, Arc<dyn PluginLifecycleHook>>>,
}

impl LifecycleManager {
    pub async fn trigger_load(&self, plugin_id: &str) -> Result<()>;
    pub async fn trigger_unload(&self, plugin_id: &str) -> Result<()>;
}
```

### 5. 重构现有 Hook

#### useChatStore 解耦

```typescript
// Before: 硬编码依赖
addUserMessage: (sessionId, content) => {
  const checkpointStore = useCheckpointStore.getState() // 硬依赖
  // ...
}

// After: 通过事件触发
addUserMessage: (sessionId, content) => {
  eventBus.publish('message:add', { sessionId, content })
}

// 独立的 checkpoint hook 订阅事件
useEffect(() => {
  return eventBus.subscribe('message:add', ({ sessionId }) => {
    if (autoCheckpointEnabled) {
      createCheckpoint(...)
    }
  })
}, [autoCheckpointEnabled])
```

#### useAgentRuntime 优化

```typescript
// Before: 每个实例独立订阅
useEffect(() => {
  const unlisten = listen(...)
  return () => unlisten()
}, [])

// After: 共享订阅 + 自动去重
const sharedSubscription = useSharedEventSubscription('agent_runtime_event')
```

## 影响范围

### 涉及文件

| 层级 | 文件 | 变更类型 |
|------|------|----------|
| Hook | `src/hooks/useEventBus.ts` | 新增 |
| Hook | `src/hooks/useServiceContainer.ts` | 新增 |
| Hook | `src/hooks/usePluginLifecycle.ts` | 新增 |
| Hook | `src/hooks/usePluginSidebar.ts` | 重构 |
| Hook | `src/hooks/usePluginRecommendation.ts` | 重构 |
| Store | `src/features/agent/hooks/useChatStore.ts` | 重构 |
| Store | `src/features/agent/hooks/useAgentRuntime.ts` | 重构 |
| Store | `src/features/agent/hooks/useAgentIntercom.ts` | 重构 |
| Store | `src/features/agent/hooks/useCheckpointStore.ts` | 重构 |
| Backend | `src-tauri/src/capability/loader/loader.rs` | 重构 |
| Backend | `src-tauri/src/capability/registry/registry.rs` | 重构 |

### 兼容性

- 现有 API 保持兼容
- 渐进式迁移，不破坏现有功能
- 提供向后兼容的 wrapper

## 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 事件订阅泄露 | 低 | 中 | 统一使用 useEffect 清理 |
| 性能下降 | 低 | 中 | 事件总线使用高效 Map |
| 迁移复杂度 | 中 | 中 | 逐步迁移，提供兼容层 |

## 依赖

- **前置依赖**: 无
- **后置依赖**: 无
