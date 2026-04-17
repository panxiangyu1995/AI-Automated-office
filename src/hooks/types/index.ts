/**
 * Hooks 类型统一导出
 */

// EventBus类型
export type { EventHandler, IEventBus } from './eventBus';

// PluginLifecycle类型
export type {
  PluginLifecycleHooks,
  PluginLifecycleContext,
  PluginLifecycleState,
  LifecycleHookName,
  PluginLifecycleManagerConfig,
  IPluginLifecycleManager,
} from './pluginLifecycle';

// ServiceContainer类型
export type {
  ServiceFactory,
  ServiceRegistration,
  IServiceContainer,
} from './serviceContainer';
