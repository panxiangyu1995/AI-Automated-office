/**
 * 存储模块类型定义
 */

/**
 * 存储项
 */
export interface StorageItem<T = unknown> {
  /** 存储键 */
  key: string;
  /** 存储值 */
  value: T;
  /** 过期时间（Unix时间戳） */
  expiresAt?: number;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
}

/**
 * 存储选项
 */
export interface StorageOptions {
  /** 是否加密 */
  encrypt?: boolean;
  /** 是否压缩 */
  compress?: boolean;
  /** 过期时间（秒） */
  expiresIn?: number;
}

/**
 * 存储操作结果
 */
export interface StorageResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  /** 总条目数 */
  totalCount: number;
  /** 已用空间（字节） */
  usedSpace: number;
  /** 最大空间（字节） */
  maxSpace: number;
  /** 过期条目数 */
  expiredCount: number;
}
