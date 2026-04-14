/**
 * PluginLifecycle 类型定义
 * 插件生命周期管理类型
 */

/**
 * 插件生命周期钩子接口
 */
export interface PluginLifecycleHooks {
  /**
   * 插件初始化时调用（注册后、挂载前）
   */
  onInit?: () => Promise<void> | void

  /**
   * 插件挂载时调用（UI 渲染前）
   */
  onMount?: () => Promise<void> | void

  /**
   * 插件卸载时调用（UI 移除后）
   */
  onUnmount?: () => Promise<void> | void

  /**
   * 插件销毁时调用（完全移除）
   */
  onDestroy?: () => Promise<void> | void

  /**
   * 插件启用时调用
   */
  onEnable?: () => Promise<void> | void

  /**
   * 插件禁用时调用
   */
  onDisable?: () => Promise<void> | void

  /**
   * 处理事件
   */
  onEvent?: (event: string, payload: unknown) => void

  /**
   * 错误处理
   */
  onError?: (error: Error) => void
}

/**
 * 插件生命周期状态
 */
export type PluginLifecycleState =
  | 'registered'
  | 'initialized'
  | 'mounted'
  | 'enabled'
  | 'disabled'
  | 'unmounting'
  | 'destroyed'

/**
 * 插件生命周期上下文
 */
export interface PluginLifecycleContext {
  /**
   * 插件 ID
   */
  pluginId: string

  /**
   * 插件版本
   */
  version: string

  /**
   * 插件名称
   */
  name: string

  /**
   * 当前状态
   */
  state: PluginLifecycleState

  /**
   * 错误信息（如果有）
   */
  error?: Error
}

/**
 * 插件生命周期管理器配置
 */
export interface PluginLifecycleManagerConfig {
  /**
   * 是否自动初始化
   */
  autoInit?: boolean

  /**
   * 是否自动挂载
   */
  autoMount?: boolean

  /**
   * 错误处理策略
   */
  errorStrategy?: 'throw' | 'log' | 'ignore'

  /**
   * 钩子执行顺序
   */
  hookOrder?: 'parallel' | 'sequential'
}

/**
 * 插件生命周期管理器接口
 */
export interface IPluginLifecycleManager {
  /**
   * 注册插件
   */
  register(pluginId: string, hooks: PluginLifecycleHooks, config?: { name?: string; version?: string }): this

  /**
   * 注销插件
   */
  unregister(pluginId: string): Promise<void>

  /**
   * 获取插件上下文
   */
  getContext(pluginId: string): PluginLifecycleContext | undefined

  /**
   * 获取插件状态
   */
  getState(pluginId: string): PluginLifecycleState | undefined

  /**
   * 初始化所有插件
   */
  initializeAll(): Promise<void>

  /**
   * 挂载所有插件
   */
  mountAll(): Promise<void>

  /**
   * 卸载所有插件
   */
  unmountAll(): Promise<void>

  /**
   * 启用插件
   */
  enable(pluginId: string): Promise<void>

  /**
   * 禁用插件
   */
  disable(pluginId: string): Promise<void>

  /**
   * 触发自定义事件
   */
  emit(pluginId: string, event: string, payload: unknown): void

  /**
   * 获取所有已注册的插件 ID
   */
  getRegisteredPlugins(): string[]

  /**
   * 获取已启用插件 ID 列表
   */
  getEnabledPlugins(): string[]

  /**
   * 重置管理器
   */
  reset(): void
}

/**
 * 生命周期钩子类型
 */
export type LifecycleHookName = keyof PluginLifecycleHooks
