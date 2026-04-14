# Design: Agent 和插件 Hook 机制架构优化

## 优化前架构

### 前端 Hook 依赖关系

```
┌──────────────────────────────────────────────────────────────────────┐
│                        现有架构 (问题)                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐     ┌────────────────┐                          │
│  │ useChatStore   │────▶│ useCheckpoint  │  硬编码依赖                │
│  └────────────────┘     │    Store       │  违反 DIP                  │
│         │               └────────────────┘                          │
│         ▼                                                                │
│  ┌────────────────┐     ┌────────────────┐                          │
│  │ useAgent      │────▶│  listen()      │  独立订阅                  │
│  │   Runtime     │     │  (每个实例)     │  可能重复订阅               │
│  └────────────────┘     └────────────────┘                          │
│         │                                                                │
│         ▼                                                                │
│  ┌────────────────┐     ┌────────────────┐                          │
│  │ usePlugin      │────▶│ PluginSidebar  │  生命周期                   │
│  │   Sidebar     │     │   Registry     │  管理混乱                   │
│  └────────────────┘     └────────────────┘                          │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 问题详情

1. **事件监听器泄漏**
   - 每个 `useAgentRuntime` 实例都创建新的 `listen()` 订阅
   - 组件卸载时可能未正确清理
   - 内存泄漏风险

2. **硬编码依赖**
   - `useChatStore.addUserMessage` 直接调用 `useCheckpointStore.getState()`
   - 难以单独测试 Checkpoint 功能
   - 难以替换为其他实现

3. **生命周期不清晰**
   - `usePluginSidebar` 在 mount 时注册条目
   - 订阅状态变化，但没有统一的生命周期管理
   - 热更新时可能残留旧订阅

## 优化后架构

### 整体架构图

```
┌──────────────────────────────────────────────────────────────────────┐
│                        优化后架构                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                      EventBus (单例)                          │    │
│  │  - 类型安全的事件发布/订阅                                     │    │
│  │  - 自动清理订阅                                               │    │
│  │  - 支持通配符                                                 │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                              ▲                                        │
│                              │                                        │
│         ┌────────────────────┼────────────────────┐                 │
│         │                    │                    │                 │
│         ▼                    ▼                    ▼                 │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐        │
│  │   Stores    │      │   Hooks     │      │ Components  │        │
│  │  (状态层)   │◀────▶│  (逻辑层)    │◀────▶│  (视图层)    │        │
│  └─────────────┘      └─────────────┘      └─────────────┘        │
│         │                    │                    │                 │
│         └────────────────────┼────────────────────┘                 │
│                              ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   ServiceContainer (依赖容器)                  │    │
│  │  - 依赖注入                                                   │    │
│  │  - 延迟初始化                                                 │    │
│  │  - 单例管理                                                   │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                 PluginLifecycleManager (生命周期)              │    │
│  │  - onLoad / onUnload / onEnable / onDisable                  │    │
│  │  - 自动触发钩子                                               │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 事件流

```
用户操作 ──▶ Store 更新 ──▶ EventBus.publish() ──▶ 订阅者接收
                                    │
                                    ▼
                          ┌─────────────────┐
                          │  Checkpoint     │
                          │  自动创建        │
                          └─────────────────┘
```

## 详细设计

### 1. EventBus (事件总线)

```typescript
// 类型定义
type EventHandler<T = unknown> = (payload: T) => void

interface EventBus {
  subscribe<T>(event: string, handler: EventHandler<T>): () => void
  publish<T>(event: string, payload: T): void
  once<T>(event: string, handler: EventHandler<T>): () => void
  clear(event?: string): void
}

// Hook 接口
interface UseEventBusReturn {
  subscribe: <T>(event: string, handler: EventHandler<T>) => void
  publish: <T>(event: string, payload: T) => void
  useSubscription: (event: string, handler: EventHandler) => void
}
```

### 2. ServiceContainer (依赖容器)

```typescript
interface ServiceFactory<T> {
  (container: ServiceContainer): T
}

interface ServiceContainer {
  register<T>(id: string, factory: ServiceFactory<T>, singleton?: boolean): void
  resolve<T>(id: string): T
  has(id: string): boolean
}

// 预注册服务
const SERVICES = {
  EVENT_BUS: 'event-bus',
  CHECKPOINT_SERVICE: 'checkpoint-service',
  AGENT_RUNTIME: 'agent-runtime',
} as const
```

### 3. PluginLifecycleManager (插件生命周期)

```typescript
interface PluginLifecycleHooks {
  onInit?: () => Promise<void> | void
  onMount?: () => Promise<void> | void
  onUnmount?: () => Promise<void> | void
  onDestroy?: () => Promise<void> | void
}

interface PluginLifecycleManager {
  register(pluginId: string, hooks: PluginLifecycleHooks): void
  unregister(pluginId: string): Promise<void>
  triggerHook(hookName: keyof PluginLifecycleHooks): Promise<void>
  getRegisteredPlugins(): string[]
}
```

### 4. 后端 PluginLifecycle Hook (Rust)

```rust
/// 插件生命周期钩子 trait
#[async_trait::async_trait]
pub trait PluginLifecycleHook: Send + Sync {
    /// 获取钩子名称
    fn name(&self) -> &'static str;

    /// 插件加载时调用
    async fn on_load(&self, ctx: &PluginContext) -> Result<()>;

    /// 插件卸载时调用
    async fn on_unload(&self) -> Result<()>;

    /// 插件启用时调用
    async fn on_enable(&self) -> Result<()>;

    /// 插件禁用时调用
    async fn on_disable(&self) -> Result<()>;
}

/// 生命周期管理器
pub struct LifecycleManager {
    hooks: RwLock<HashMap<String, Arc<dyn PluginLifecycleHook>>>,
    event_emitter: Arc<dyn EventEmitter>,
}

impl LifecycleManager {
    pub async fn load_plugin(&self, plugin_id: &str) -> Result<()> {
        // 1. 触发 on_load
        // 2. 发送事件到前端
        // 3. 更新状态
    }
}
```

## 模块划分

| 模块 | 职责 | 文件位置 |
|------|------|----------|
| EventBus | 统一事件发布/订阅 | `src/hooks/useEventBus.ts` |
| ServiceContainer | 依赖注入容器 | `src/hooks/useServiceContainer.ts` |
| PluginLifecycle | 插件生命周期管理 | `src/hooks/usePluginLifecycle.ts` |
| ChatStore | 聊天状态（解耦后） | `src/features/agent/hooks/useChatStore.ts` |
| AgentRuntime | Agent 运行时（优化后） | `src/features/agent/hooks/useAgentRuntime.ts` |
| LifecycleManager | Rust 生命周期管理 | `src-tauri/src/capability/lifecycle/mod.rs` |

## 接口设计

### 前端事件列表

| 事件名 | Payload | 描述 |
|--------|---------|------|
| `chat:message:add` | `{ sessionId, message }` | 新消息添加 |
| `chat:session:create` | `{ session }` | 会话创建 |
| `chat:session:delete` | `{ sessionId }` | 会话删除 |
| `agent:runtime:start` | `{ sessionId }` | Agent 运行开始 |
| `agent:runtime:end` | `{ sessionId, duration }` | Agent 运行结束 |
| `agent:tool:call` | `{ toolId, params }` | 工具调用 |
| `plugin:load` | `{ pluginId }` | 插件加载 |
| `plugin:unload` | `{ pluginId }` | 插件卸载 |

### 后端命令接口

```rust
// 新增生命周期命令
#[tauri::command]
async fn trigger_plugin_lifecycle(
    plugin_id: String,
    lifecycle: LifecycleType,
) -> Result<(), String>

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum LifecycleType {
    OnLoad,
    OnUnload,
    OnEnable,
    OnDisable,
}
```

## 依赖关系

```
EventBus ──────────────┐
                       │
                       ▼
ServiceContainer ────▶ Stores
      │
      ▼
PluginLifecycle ──────▶ Hooks
      │
      ▼
   Backend ───────────▶ LifecycleManager (Rust)
```

## 实现要点

1. **EventBus 单例模式**
   - 全局只有一个实例
   - React Hook 封装提供订阅清理

2. **ServiceContainer 延迟初始化**
   - 服务在首次解析时创建
   - 支持单例和原型模式

3. **生命周期钩子链式调用**
   - 多个插件可以注册同一个钩子
   - 按注册顺序执行

4. **向后兼容**
   - 现有 API 保持不变
   - 内部实现逐步迁移
