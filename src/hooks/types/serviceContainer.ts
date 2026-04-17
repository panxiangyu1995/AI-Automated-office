/**
 * ServiceContainer类型定义
 * 依赖注入容器的类型声明
 */

/**
 * 服务工厂函数
 */
export interface ServiceFactory<T> {
  (container: IServiceContainer): T;
}

/**
 * 服务注册信息
 */
export interface ServiceRegistration<T> {
  /** 服务ID */
  id: string;
  /** 服务工厂 */
  factory: ServiceFactory<T>;
  /** 是否单例 */
  singleton: boolean;
  /** 单例实例 */
  instance?: T;
  /** 元数据 */
  metadata?: Record<string, unknown>;
}

/**
 * 服务容器接口
 */
export interface IServiceContainer {
  /**
   * 注册服务
   * @param id 服务ID
   * @param factory 服务工厂
   * @param options 注册选项
   */
  register<T>(
    id: string,
    factory: ServiceFactory<T>,
    options?: { singleton?: boolean; metadata?: Record<string, unknown> }
  ): this;

  /**
   * 注册单例服务
   * @param id 服务ID
   * @param factory 服务工厂
   */
  registerSingleton<T>(id: string, factory: ServiceFactory<T>): this;

  /**
   * 注册实例
   * @param id 服务ID
   * @param instance 已存在的实例
   */
  registerInstance<T>(id: string, instance: T): this;

  /**
   * 解析服务
   * @param id 服务ID
   * @throws 如果服务未注册
   */
  resolve<T>(id: string): T;

  /**
   * 尝试解析服务
   * @param id 服务ID
   * @returns 服务实例或undefined
   */
  tryResolve<T>(id: string): T | undefined;

  /**
   * 检查服务是否已注册
   * @param id 服务ID
   */
  has(id: string): boolean;

  /**
   * 清除所有注册
   */
  clearAll(): void;
}
