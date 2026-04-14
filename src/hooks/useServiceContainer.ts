/**
 * useServiceContainer Hook
 *
 * React 友好的 ServiceContainer 访问接口
 */

import { useCallback, useMemo } from 'react'
import { serviceContainer } from './serviceContainer'
import type { ServiceFactory } from './types/serviceContainer'

/**
 * useServiceContainer 返回类型
 */
export interface UseServiceContainerReturn {
  /**
   * 注册服务
   */
  register: <T>(
    id: string,
    factory: ServiceFactory<T>,
    options?: { singleton?: boolean; metadata?: Record<string, unknown> }
  ) => void

  /**
   * 注册单例服务
   */
  registerSingleton: <T>(id: string, factory: ServiceFactory<T>) => void

  /**
   * 注册实例
   */
  registerInstance: <T>(id: string, instance: T) => void

  /**
   * 解析服务
   */
  resolve: <T>(id: string) => T

  /**
   * 尝试解析服务
   */
  tryResolve: <T>(id: string) => T | undefined

  /**
   * 检查服务是否存在
   */
  has: (id: string) => boolean

  /**
   * 获取所有已注册的服务
   */
  getRegisteredServices: () => string[]
}

/**
 * useServiceContainer Hook
 *
 * @example
 * function MyComponent() {
 *   const { resolve } = useServiceContainer()
 *
 *   const eventBus = resolve('core:event-bus')
 *   eventBus.publish('my:event', { data: 'test' })
 * }
 */
export function useServiceContainer(): UseServiceContainerReturn {
  /**
   * 注册服务
   */
  const register = useCallback(
    <T>(
      id: string,
      factory: ServiceFactory<T>,
      options?: { singleton?: boolean; metadata?: Record<string, unknown> }
    ) => {
      serviceContainer.register(id, factory, options)
    },
    []
  )

  /**
   * 注册单例服务
   */
  const registerSingleton = useCallback(<T>(id: string, factory: ServiceFactory<T>) => {
    serviceContainer.registerSingleton(id, factory)
  }, [])

  /**
   * 注册实例
   */
  const registerInstance = useCallback(<T>(id: string, instance: T) => {
    serviceContainer.registerInstance(id, instance)
  }, [])

  /**
   * 解析服务
   */
  const resolve = useCallback(<T>(id: string): T => {
    return serviceContainer.resolve<T>(id)
  }, [])

  /**
   * 尝试解析服务
   */
  const tryResolve = useCallback(<T>(id: string): T | undefined => {
    return serviceContainer.tryResolve<T>(id)
  }, [])

  /**
   * 检查服务是否存在
   */
  const has = useCallback((id: string): boolean => {
    return serviceContainer.has(id)
  }, [])

  /**
   * 获取所有已注册的服务
   */
  const getRegisteredServices = useCallback((): string[] => {
    return serviceContainer.getRegisteredServices()
  }, [])

  return {
    register,
    registerSingleton,
    registerInstance,
    resolve,
    tryResolve,
    has,
    getRegisteredServices,
  }
}

/**
 * useService - 使用特定服务的 Hook
 *
 * @example
 * // 注册服务（在应用初始化时）
 * const { registerSingleton } = useServiceContainer()
 * registerSingleton('my:service', (container) => new MyService())
 *
 * // 使用服务（在组件中）
 * function MyComponent() {
 *   const myService = useService<MyService>('my:service')
 *   myService.doSomething()
 * }
 *
 * @param id - 服务 ID
 * @param options - 选项
 */
export function useService<T>(id: string, options?: { optional?: boolean }): T {
  const { resolve, has } = useServiceContainer()

  const service = useMemo(() => {
    if (options?.optional && !has(id)) {
      return undefined
    }
    return resolve<T>(id)
  }, [id, resolve, has, options?.optional])

  return service as T
}

/**
 * useOptionalService - 使用可选服务的 Hook
 * 如果服务不存在，返回 undefined 而不是抛出错误
 *
 * @example
 * function MyComponent() {
 *   const analytics = useOptionalService<AnalyticsService>('analytics:service')
 *
 *   if (analytics) {
 *     analytics.track('page_view')
 *   }
 * }
 */
export function useOptionalService<T>(id: string): T | undefined {
  return useService<T>(id, { optional: true })
}

/**
 * useServices - 使用多个服务的 Hook
 *
 * @example
 * function MyComponent() {
 *   const services = useServices([
 *     'core:event-bus',
 *     'agent:chat-store',
 *     'plugin:lifecycle',
 *   ])
 *
 *   const [eventBus, chatStore, lifecycle] = services
 * }
 */
export function useServices(ids: string[]): unknown[] {
  const { resolve } = useServiceContainer()

  return useMemo(() => {
    return ids.map((id) => resolve(id))
  }, [ids, resolve])
}
