# 设计文档 - Hooks类型定义完善

## 涉及文件

### 新增文件
- `src/hooks/types/eventBus.ts` - EventBus类型定义
- `src/hooks/types/pluginLifecycle.ts` - PluginLifecycle类型定义
- `src/hooks/types/serviceContainer.ts` - ServiceContainer类型定义

### 修改文件
- `src/hooks/eventBus.ts` - 导入类型定义
- `src/hooks/pluginLifecycle.ts` - 导入类型定义
- `src/hooks/serviceContainer.ts` - 导入类型定义

## 修改方案

### 1. 创建统一类型目录

```
src/hooks/types/
├── index.ts          # 统一导出
├── eventBus.ts       # EventBus类型
├── pluginLifecycle.ts # PluginLifecycle类型
└── serviceContainer.ts # ServiceContainer类型
```

### 2. EventBus类型定义

```typescript
// src/hooks/types/eventBus.ts
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

### 3. PluginLifecycle类型定义

```typescript
// src/hooks/types/pluginLifecycle.ts
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
```

### 4. ServiceContainer类型定义

```typescript
// src/hooks/types/serviceContainer.ts
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
  resolve<T>(id: string): T;
  tryResolve<T>(id: string): T | undefined;
  has(id: string): boolean;
}
```

## 数据流

无数据流变更，仅类型重构。
