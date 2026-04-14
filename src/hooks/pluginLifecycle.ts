/**
 * PluginLifecycleManager - 插件生命周期管理器
 *
 * 特性：
 * - 完整的生命周期状态机
 * - 自动事件订阅/取消订阅
 * - 错误隔离（单个插件错误不影响其他插件）
 * - 与 EventBus 集成
 */

import type {
  PluginLifecycleHooks,
  PluginLifecycleState,
  PluginLifecycleContext,
  PluginLifecycleManagerConfig,
  IPluginLifecycleManager,
  LifecycleHookName,
} from './types/pluginLifecycle'
import { eventBus } from './eventBus'

/**
 * 内部插件注册信息
 */
interface PluginRegistration {
  hooks: PluginLifecycleHooks
  context: PluginLifecycleContext
  eventUnsubscribe?: () => void
}

/**
 * PluginLifecycleManager 实现
 */
export class PluginLifecycleManagerImpl implements IPluginLifecycleManager {
  private static _instance: PluginLifecycleManagerImpl | null = null
  private plugins: Map<string, PluginRegistration> = new Map()
  private config: Required<PluginLifecycleManagerConfig>

  private constructor(config: PluginLifecycleManagerConfig = {}) {
    this.config = {
      autoInit: config.autoInit ?? true,
      autoMount: config.autoMount ?? true,
      errorStrategy: config.errorStrategy ?? 'log',
      hookOrder: config.hookOrder ?? 'sequential',
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: PluginLifecycleManagerConfig): PluginLifecycleManagerImpl {
    if (!PluginLifecycleManagerImpl._instance) {
      PluginLifecycleManagerImpl._instance = new PluginLifecycleManagerImpl(config)
    }
    return PluginLifecycleManagerImpl._instance
  }

  /**
   * 重置实例
   */
  static resetInstance(): void {
    if (PluginLifecycleManagerImpl._instance) {
      PluginLifecycleManagerImpl._instance.reset()
      PluginLifecycleManagerImpl._instance = null
    }
  }

  /**
   * 注册插件
   */
  register(
    pluginId: string,
    hooks: PluginLifecycleHooks,
    config?: { name?: string; version?: string }
  ): this {
    if (this.plugins.has(pluginId)) {
      console.warn(`[PluginLifecycleManager] Plugin "${pluginId}" is already registered`)
      return this
    }

    const registration: PluginRegistration = {
      hooks,
      context: {
        pluginId,
        version: config?.version ?? '1.0.0',
        name: config?.name ?? pluginId,
        state: 'registered',
      },
    }

    this.plugins.set(pluginId, registration)

    // 自动订阅事件
    if (hooks.onEvent) {
      registration.eventUnsubscribe = eventBus.subscribe(
        `plugin:${pluginId}:*`,
        (payload: unknown) => {
          const event = (payload as { event?: string }).event ?? 'unknown'
          hooks.onEvent?.(event, payload)
        }
      )
    }

    // 自动初始化
    if (this.config.autoInit) {
      this.initialize(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Auto-init failed for "${pluginId}":`, err)
      })
    }

    // 自动挂载
    if (this.config.autoMount) {
      this.mount(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Auto-mount failed for "${pluginId}":`, err)
      })
    }

    return this
  }

  /**
   * 注销插件
   */
  async unregister(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      console.warn(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
      return
    }

    try {
      // 触发 onUnmount
      await this.executeHook(pluginId, 'onUnmount')

      // 触发 onDestroy
      await this.executeHook(pluginId, 'onDestroy')

      // 取消事件订阅
      registration.eventUnsubscribe?.()

      // 更新状态
      registration.context.state = 'destroyed'

      // 移除注册
      this.plugins.delete(pluginId)
    } catch (error) {
      this.handleError(pluginId, 'unregister', error as Error)
    }
  }

  /**
   * 获取插件上下文
   */
  getContext(pluginId: string): PluginLifecycleContext | undefined {
    return this.plugins.get(pluginId)?.context
  }

  /**
   * 获取插件状态
   */
  getState(pluginId: string): PluginLifecycleState | undefined {
    return this.plugins.get(pluginId)?.context.state
  }

  /**
   * 初始化所有插件
   */
  async initializeAll(): Promise<void> {
    const promises = Array.from(this.plugins.keys()).map((pluginId) =>
      this.initialize(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Init failed for "${pluginId}":`, err)
      })
    )
    await Promise.all(promises)
  }

  /**
   * 初始化单个插件
   */
  async initialize(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
    }

    try {
      await this.executeHook(pluginId, 'onInit')
      registration.context.state = 'initialized'
    } catch (error) {
      registration.context.error = error as Error
      this.handleError(pluginId, 'onInit', error as Error)
      throw error
    }
  }

  /**
   * 挂载所有插件
   */
  async mountAll(): Promise<void> {
    const promises = Array.from(this.plugins.keys()).map((pluginId) =>
      this.mount(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Mount failed for "${pluginId}":`, err)
      })
    )
    await Promise.all(promises)
  }

  /**
   * 挂载单个插件
   */
  async mount(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
    }

    try {
      await this.executeHook(pluginId, 'onMount')
      registration.context.state = 'mounted'
    } catch (error) {
      registration.context.error = error as Error
      this.handleError(pluginId, 'onMount', error as Error)
      throw error
    }
  }

  /**
   * 卸载所有插件
   */
  async unmountAll(): Promise<void> {
    const promises = Array.from(this.plugins.keys()).map((pluginId) =>
      this.unmount(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Unmount failed for "${pluginId}":`, err)
      })
    )
    await Promise.all(promises)
  }

  /**
   * 卸载单个插件
   */
  async unmount(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
    }

    try {
      registration.context.state = 'unmounting'
      await this.executeHook(pluginId, 'onUnmount')
      registration.context.state = 'registered'
    } catch (error) {
      registration.context.error = error as Error
      this.handleError(pluginId, 'onUnmount', error as Error)
      throw error
    }
  }

  /**
   * 启用插件
   */
  async enable(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
    }

    try {
      await this.executeHook(pluginId, 'onEnable')
      registration.context.state = 'enabled'
    } catch (error) {
      registration.context.error = error as Error
      this.handleError(pluginId, 'onEnable', error as Error)
      throw error
    }
  }

  /**
   * 禁用插件
   */
  async disable(pluginId: string): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      throw new Error(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
    }

    try {
      await this.executeHook(pluginId, 'onDisable')
      registration.context.state = 'disabled'
    } catch (error) {
      registration.context.error = error as Error
      this.handleError(pluginId, 'onDisable', error as Error)
      throw error
    }
  }

  /**
   * 触发自定义事件
   */
  emit(pluginId: string, event: string, payload: unknown): void {
    const registration = this.plugins.get(pluginId)
    if (!registration) {
      console.warn(`[PluginLifecycleManager] Plugin "${pluginId}" is not registered`)
      return
    }

    registration.hooks.onEvent?.(event, payload)
  }

  /**
   * 获取所有已注册的插件 ID
   */
  getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys())
  }

  /**
   * 获取已启用插件 ID 列表
   */
  getEnabledPlugins(): string[] {
    return Array.from(this.plugins.entries())
      .filter(([, reg]) => reg.context.state === 'enabled')
      .map(([id]) => id)
  }

  /**
   * 重置管理器
   */
  reset(): void {
    // 卸载所有插件
    for (const pluginId of this.plugins.keys()) {
      this.unregister(pluginId).catch((err) => {
        console.error(`[PluginLifecycleManager] Reset failed for "${pluginId}":`, err)
      })
    }
    this.plugins.clear()
  }

  /**
   * 执行钩子
   */
  private async executeHook(
    pluginId: string,
    hookName: LifecycleHookName
  ): Promise<void> {
    const registration = this.plugins.get(pluginId)
    if (!registration) return

    const hook = registration.hooks[hookName]
    if (!hook) return

    // 直接调用钩子函数
    const result = (hook as () => void | Promise<void>)()

    // 如果返回 Promise，等待完成
    if (result instanceof Promise) {
      await result
    }
  }

  /**
   * 处理错误
   */
  private handleError(pluginId: string, hookName: string, error: Error): void {
    const registration = this.plugins.get(pluginId)
    if (registration?.hooks.onError) {
      registration.hooks.onError(error)
    }

    switch (this.config.errorStrategy) {
      case 'throw':
        throw error
      case 'log':
        console.error(
          `[PluginLifecycleManager] Error in "${pluginId}.${hookName}":`,
          error
        )
        break
      case 'ignore':
        break
    }
  }
}

// ==================== 单例导出 ====================

/**
 * 获取 PluginLifecycleManager 单例
 */
export const pluginLifecycleManager = PluginLifecycleManagerImpl.getInstance()
