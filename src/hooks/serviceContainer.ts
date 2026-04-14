/**
 * ServiceContainer - 依赖注入容器
 *
 * 特性：
 * - 单例模式：每个服务可以选择单例或原型模式
 * - 延迟初始化：服务在首次解析时创建
 * - 循环依赖检测：防止循环依赖导致的无限递归
 */

import type {
  ServiceFactory,
  ServiceRegistration,
  IServiceContainer,
} from './types/serviceContainer'

/**
 * ServiceContainer 实现
 */
export class ServiceContainerImpl implements IServiceContainer {
  private static _instance: ServiceContainerImpl | null = null
  private services: Map<string, ServiceRegistration<unknown>> = new Map()
  private resolutionStack: Set<string> = new Set()

  private constructor() {
    // 私有构造函数
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ServiceContainerImpl {
    if (!ServiceContainerImpl._instance) {
      ServiceContainerImpl._instance = new ServiceContainerImpl()
    }
    return ServiceContainerImpl._instance
  }

  /**
   * 重置实例（主要用于测试）
   */
  static resetInstance(): void {
    if (ServiceContainerImpl._instance) {
      ServiceContainerImpl._instance.clearAll()
      ServiceContainerImpl._instance = null
    }
  }

  /**
   * 注册服务
   */
  register<T>(
    id: string,
    factory: ServiceFactory<T>,
    options: { singleton?: boolean; metadata?: Record<string, unknown> } = {}
  ): this {
    if (this.services.has(id)) {
      console.warn(`[ServiceContainer] Service "${id}" is already registered, skipping`)
      return this
    }

    this.services.set(id, {
      id,
      factory,
      singleton: options.singleton ?? true,
      metadata: options.metadata,
    })

    return this
  }

  /**
   * 注册单例服务
   */
  registerSingleton<T>(id: string, factory: ServiceFactory<T>): this {
    return this.register(id, factory, { singleton: true })
  }

  /**
   * 注册实例（已存在的对象）
   */
  registerInstance<T>(id: string, instance: T): this {
    this.services.set(id, {
      id,
      factory: () => instance,
      singleton: true,
      instance,
    })
    return this
  }

  /**
   * 解析服务
   */
  resolve<T>(id: string): T {
    const registration = this.services.get(id)

    if (!registration) {
      throw new Error(`[ServiceContainer] Service "${id}" is not registered`)
    }

    // 循环依赖检测
    if (this.resolutionStack.has(id)) {
      const stack = Array.from(this.resolutionStack).join(' -> ')
      throw new Error(
        `[ServiceContainer] Circular dependency detected: ${stack} -> ${id}`
      )
    }

    // 如果是单例且已有实例，直接返回
    if (registration.singleton && registration.instance !== undefined) {
      return registration.instance as T
    }

    // 开始解析
    this.resolutionStack.add(id)
    let resolvedInstance: unknown

    try {
      resolvedInstance = registration.factory(this)
      return resolvedInstance as T
    } finally {
      // 解析完成
      this.resolutionStack.delete(id)

      // 如果是单例，缓存实例
      if (registration.singleton && resolvedInstance !== undefined) {
        registration.instance = resolvedInstance
      }
    }
  }

  /**
   * 尝试解析服务
   */
  tryResolve<T>(id: string): T | undefined {
    try {
      return this.resolve<T>(id)
    } catch {
      return undefined
    }
  }

  /**
   * 检查服务是否已注册
   */
  has(id: string): boolean {
    return this.services.has(id)
  }

  /**
   * 清除服务实例
   */
  clearInstance(id: string): void {
    const registration = this.services.get(id)
    if (registration) {
      registration.instance = undefined
    }
  }

  /**
   * 清除所有服务实例
   */
  clearAll(): void {
    for (const registration of this.services.values()) {
      registration.instance = undefined
    }
  }

  /**
   * 获取所有已注册的服务
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys())
  }
}

// ==================== 单例导出 ====================

/**
 * 获取 ServiceContainer 单例
 */
export const serviceContainer = ServiceContainerImpl.getInstance()

// ==================== 预设服务注册 ====================

/**
 * 初始化核心服务
 */
export function initializeCoreServices(): void {
  // 注册事件总线
  serviceContainer.registerInstance('core:event-bus', require('./eventBus').eventBus)

  // 其他核心服务可以在此初始化
}

// 导出类型
export type { IServiceContainer, ServiceFactory }
