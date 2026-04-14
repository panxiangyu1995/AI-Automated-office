/**
 * ServiceContainer 类型定义
 * 依赖注入容器类型
 */

/**
 * 服务工厂函数类型
 */
export type ServiceFactory<T> = (container: IServiceContainer) => T

/**
 * 服务实例类型
 */
export interface ServiceRegistration<T> {
  id: string
  factory: ServiceFactory<T>
  singleton: boolean
  instance?: T
  metadata?: Record<string, unknown>
}

/**
 * 服务容器接口
 */
export interface IServiceContainer {
  /**
   * 注册服务
   */
  register<T>(
    id: string,
    factory: ServiceFactory<T>,
    options?: { singleton?: boolean; metadata?: Record<string, unknown> }
  ): this

  /**
   * 注册单例服务
   */
  registerSingleton<T>(id: string, factory: ServiceFactory<T>): this

  /**
   * 注册实例（已存在的对象）
   */
  registerInstance<T>(id: string, instance: T): this

  /**
   * 解析服务
   * @throws 如果服务未注册
   */
  resolve<T>(id: string): T

  /**
   * 尝试解析服务
   * @returns 服务实例或 undefined
   */
  tryResolve<T>(id: string): T | undefined

  /**
   * 检查服务是否已注册
   */
  has(id: string): boolean

  /**
   * 清除服务实例（但不删除注册）
   */
  clearInstance(id: string): void

  /**
   * 清除所有服务实例
   */
  clearAll(): void

  /**
   * 获取所有已注册的服务 ID
   */
  getRegisteredServices(): string[]
}

// ==================== 预定义服务 ID ====================

/**
 * 核心服务 ID
 */
export const CORE_SERVICES = {
  /** 事件总线 */
  EVENT_BUS: 'core:event-bus',
  /** 本地存储 */
  LOCAL_STORAGE: 'core:local-storage',
  /** Tauri API */
  TAURI_API: 'core:tauri-api',
} as const

/**
 * Agent 服务 ID
 */
export const AGENT_SERVICES = {
  /** Agent 运行时 */
  AGENT_RUNTIME: 'agent:runtime',
  /** Chat Store */
  CHAT_STORE: 'agent:chat-store',
  /** Checkpoint Store */
  CHECKPOINT_STORE: 'agent:checkpoint-store',
} as const

/**
 * 插件服务 ID
 */
export const PLUGIN_SERVICES = {
  /** 插件生命周期管理器 */
  PLUGIN_LIFECYCLE: 'plugin:lifecycle',
  /** 插件注册表 */
  PLUGIN_REGISTRY: 'plugin:registry',
  /** 侧边栏注册表 */
  SIDEBAR_REGISTRY: 'plugin:sidebar-registry',
} as const

/**
 * 业务服务 ID
 */
export const BUSINESS_SERVICES = {
  /** 认证服务 */
  AUTH: 'business:auth',
  /** 租户服务 */
  TENANT: 'business:tenant',
  /** 通知服务 */
  NOTIFICATION: 'business:notification',
} as const

/**
 * 所有服务 ID 的联合类型
 */
export type ServiceId =
  | (typeof CORE_SERVICES)[keyof typeof CORE_SERVICES]
  | (typeof AGENT_SERVICES)[keyof typeof AGENT_SERVICES]
  | (typeof PLUGIN_SERVICES)[keyof typeof PLUGIN_SERVICES]
  | (typeof BUSINESS_SERVICES)[keyof typeof BUSINESS_SERVICES]
  | string
