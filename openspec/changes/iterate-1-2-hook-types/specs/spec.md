# 规格文档 - Hooks类型定义

## EventBus类型

```typescript
export interface EventHandler<T = unknown> {
  (payload: T): void;
}

export interface IEventBus {
  subscribe<T>(event: string, handler: EventHandler<T>): () => void;
  once<T>(event: string, handler: EventHandler<T>): () => void;
  publish<T>(event: string, payload: T): void;
  unsubscribe(event: string, handler?: EventHandler): void;
  clear(event?: string): void;
  getSubscriptionCount(event?: string): number;
  getSubscribedEvents(): string[];
}
```

## PluginLifecycle类型

```typescript
export type LifecycleHookName = 
  | 'onInit'
  | 'onMount'
  | 'onUnmount'
  | 'onEvent';

export interface PluginLifecycleHooks {
  onInit?: () => Promise<void> | void;
  onMount?: () => Promise<void> | void;
  onUnmount?: () => Promise<void> | void;
  onEvent?: (event: string, payload: unknown) => void;
}

export interface PluginLifecycleContext {
  pluginId: string;
  version: string;
  name: string;
  state: PluginLifecycleState;
}

export type PluginLifecycleState = 
  | 'registered'
  | 'initialized'
  | 'mounted'
  | 'unmounted'
  | 'error';

export interface IPluginLifecycleManager {
  register(
    pluginId: string,
    hooks: PluginLifecycleHooks,
    config?: { name?: string; version?: string }
  ): this;
  initialize(pluginId: string): Promise<void>;
  mount(pluginId: string): Promise<void>;
  unmount(pluginId: string): Promise<void>;
  getState(pluginId: string): PluginLifecycleState | undefined;
}
```

## ServiceContainer类型

```typescript
export interface ServiceFactory<T> {
  (container: IServiceContainer): T;
}

export interface ServiceRegistration<T> {
  id: string;
  factory: ServiceFactory<T>;
  singleton: boolean;
  instance?: T;
  metadata?: Record<string, unknown>;
}

export interface IServiceContainer {
  register<T>(
    id: string,
    factory: ServiceFactory<T>,
    options?: { singleton?: boolean; metadata?: Record<string, unknown> }
  ): this;
  registerSingleton<T>(id: string, factory: ServiceFactory<T>): this;
  registerInstance<T>(id: string, instance: T): this;
  resolve<T>(id: string): T;
  tryResolve<T>(id: string): T | undefined;
  has(id: string): boolean;
  clearAll(): void;
}
```

## 验收标准

1. 所有类型定义完整
2. 类型可被正确导入使用
3. 与现有实现完全兼容
