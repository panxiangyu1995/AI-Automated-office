/**
 * PluginLifecycle类型定义
 * 插件生命周期管理系统的类型声明
 */

/**
 * 插件生命周期钩子
 */
export interface PluginLifecycleHooks {
  /**
   * 初始化钩子 - 插件注册后调用
   */
  onInit?: () => Promise<void> | void;

  /**
   * 挂载钩子 - 插件激活时调用
   */
  onMount?: () => Promise<void> | void;

  /**
   * 卸载钩子 - 插件停用时调用
   */
  onUnmount?: () => Promise<void> | void;

  /**
   * 销毁钩子 - 插件移除时调用
   */
  onDestroy?: () => Promise<void> | void;

  /**
   * 启用钩子 - 插件启用时调用
   */
  onEnable?: () => Promise<void> | void;

  /**
   * 禁用钩子 - 插件禁用时调用
   */
  onDisable?: () => Promise<void> | void;

  /**
   * 事件处理钩子 - 接收事件总线事件
   */
  onEvent?: (event: string, payload: unknown) => void;

  /**
   * 错误处理钩子
   */
  onError?: (error: Error) => void;
}

/**
 * 插件生命周期上下文
 */
export interface PluginLifecycleContext {
  /** 插件ID */
  pluginId: string;
  /** 插件版本 */
  version: string;
  /** 插件名称 */
  name: string;
  /** 当前状态 */
  state: PluginLifecycleState;
  /** 错误信息 */
  error?: Error;
}

/**
 * 插件生命周期状态
 */
export type PluginLifecycleState =
  | 'registered'
  | 'initialized'
  | 'mounted'
  | 'unmounting'
  | 'unmounted'
  | 'enabled'
  | 'disabled'
  | 'destroyed'
  | 'error';

/**
 * 生命周期钩子名称
 */
export type LifecycleHookName =
  | 'onInit'
  | 'onMount'
  | 'onUnmount'
  | 'onDestroy'
  | 'onEnable'
  | 'onDisable'
  | 'onEvent';

/**
 * 插件生命周期管理器配置
 */
export interface PluginLifecycleManagerConfig {
  /** 是否自动初始化 */
  autoInit?: boolean;
  /** 是否自动挂载 */
  autoMount?: boolean;
  /** 错误策略 */
  errorStrategy?: 'throw' | 'log' | 'ignore';
  /** 钩子执行顺序 */
  hookOrder?: 'sequential' | 'parallel';
}

/**
 * 插件生命周期管理器接口
 */
export interface IPluginLifecycleManager {
  /**
   * 注册插件
   * @param pluginId 插件ID
   * @param hooks 插件钩子
   * @param config 插件配置
   */
  register(
    pluginId: string,
    hooks: PluginLifecycleHooks,
    config?: { name?: string; version?: string }
  ): this;

  /**
   * 注销插件
   * @param pluginId 插件ID
   */
  unregister(pluginId: string): Promise<void>;

  /**
   * 初始化插件
   * @param pluginId 插件ID
   */
  initialize(pluginId: string): Promise<void>;

  /**
   * 挂载插件
   * @param pluginId 插件ID
   */
  mount(pluginId: string): Promise<void>;

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  unmount(pluginId: string): Promise<void>;

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  enable(pluginId: string): Promise<void>;

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  disable(pluginId: string): Promise<void>;

  /**
   * 获取插件状态
   * @param pluginId 插件ID
   */
  getState(pluginId: string): PluginLifecycleState | undefined;

  /**
   * 获取插件上下文
   * @param pluginId 插件ID
   */
  getContext(pluginId: string): PluginLifecycleContext | undefined;

  /**
   * 获取已注册的插件ID列表
   */
  getRegisteredPlugins(): string[];

  /**
   * 获取已启用的插件ID列表
   */
  getEnabledPlugins(): string[];

  /**
   * 重置管理器
   */
  reset(): void;
}
