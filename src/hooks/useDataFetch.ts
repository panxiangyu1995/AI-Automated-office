/**
 * useDataFetch - 统一的数据获取 Hook
 * 
 * 提供：
 * - 分页支持
 * - 搜索/过滤
 * - 自动刷新
 * - 数据缓存
 * - 乐观更新
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import type { TauriError } from './useTauriCommand'

export interface PaginationParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginationResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface UseDataFetchOptions<T, P = PaginationParams> {
  /** 命令名称 */
  command: string
  /** 默认参数 */
  defaultParams?: P
  /** 是否立即加载 */
  immediate?: boolean
  /** 缓存 key */
  cacheKey?: string
  /** 缓存时间(ms) */
  cacheTime?: number
  /** 自动刷新间隔(ms) */
  refreshInterval?: number
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: TauriError) => void
}

export interface UseDataFetchReturn<T, P = PaginationParams> {
  /** 数据 */
  data: T | null
  /** 分页数据（如果有） */
  paginatedData: PaginationResult<T> | null
  /** 加载状态 */
  loading: boolean
  /** 刷新中状态 */
  refreshing: boolean
  /** 错误 */
  error: TauriError | null
  /** 执行查询 */
  fetch: (params?: P) => Promise<void>
  /** 刷新数据 */
  refresh: () => Promise<void>
  /** 重置状态 */
  reset: () => void
  /** 更新本地数据（乐观更新） */
  updateLocal: (updater: (data: T | null) => T | null) => void
  /** 设置页码 */
  setPage: (page: number) => void
  /** 当前页码 */
  page: number
  /** 每页大小 */
  pageSize: number
  /** 总数 */
  total: number
}

/**
 * 缓存管理器
 */
class DataCache {
  private cache = new Map<string, { data: unknown; expiry: number }>()

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiry) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  set(key: string, data: unknown, ttlMs: number) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    })
  }

  invalidate(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

const globalCache = new DataCache()

export function useDataFetch<T extends object, P = PaginationParams>({
  command,
  defaultParams,
  immediate = false,
  cacheKey,
  cacheTime = 5 * 60 * 1000, // 5分钟默认缓存
  refreshInterval,
  onSuccess,
  onError,
}: UseDataFetchOptions<T, P>): UseDataFetchReturn<T, P> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<TauriError | null>(null)

  // 分页状态
  const [page, setPageState] = useState(1)
  const [pageSize, setPageSizeState] = useState(20)
  const [total, setTotal] = useState(0)

  // 定时器引用
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 构建缓存 key
  const getCacheKey = useCallback(
    (params?: P) => {
      if (cacheKey) return cacheKey
      return `${command}:${JSON.stringify(params ?? defaultParams ?? {})}`
    },
    [command, cacheKey, defaultParams]
  )

  // 解析分页数据
  const extractPaginatedData = useCallback(
    (result: unknown): PaginationResult<T> | null => {
      if (!result || typeof result !== 'object') return null
      const r = result as Record<string, unknown>
      if ('items' in r && Array.isArray(r.items)) {
        return {
          items: r.items as T[],
          total: (r.total as number) ?? 0,
          page: (r.page as number) ?? 1,
          page_size: (r.page_size as number) ?? pageSize,
          total_pages: (r.total_pages as number) ?? 0,
        }
      }
      return null
    },
    [pageSize]
  )

  // 执行数据获取
  const fetch = useCallback(
    async (params?: P) => {
      const finalParams = { ...defaultParams, ...params } as Record<string, unknown>

      // 检查缓存
      const cacheKeyStr = getCacheKey(finalParams as P)
      const cached = globalCache.get<T>(cacheKeyStr)
      if (cached && !refreshing) {
        setData(cached)
        const paginated = extractPaginatedData(cached)
        if (paginated) {
          setTotal(paginated.total)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await invoke<T>(command, finalParams)

        // 缓存结果
        if (cacheTime > 0) {
          globalCache.set(cacheKeyStr, result, cacheTime)
        }

        setData(result)

        // 提取分页信息
        const paginated = extractPaginatedData(result)
        if (paginated) {
          setTotal(paginated.total)
          setPageState(paginated.page)
          setPageSizeState(paginated.page_size)
        }

        onSuccess?.(result)
      } catch (err) {
        const errorObj =
          typeof err === 'string'
            ? { message: err, code: 'ERR_UNKNOWN' }
            : err instanceof Error
              ? { message: err.message, code: 'ERR_UNKNOWN' }
              : { message: '请求失败', code: 'ERR_UNKNOWN' }
        setError(errorObj as TauriError)
        onError?.(errorObj as TauriError)
      } finally {
        setLoading(false)
      }
    },
    [
      command,
      defaultParams,
      cacheTime,
      getCacheKey,
      extractPaginatedData,
      onSuccess,
      onError,
      refreshing,
    ]
  )

  // 刷新数据
  const refresh = useCallback(async () => {
    setRefreshing(true)
    // 使缓存失效
    if (cacheKey) {
      globalCache.invalidate(cacheKey)
    }
    await fetch()
    setRefreshing(false)
  }, [fetch, cacheKey])

  // 重置状态
  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setPageState(1)
    setTotal(0)
    if (cacheKey) {
      globalCache.invalidate(cacheKey)
    }
  }, [cacheKey])

  // 乐观更新
  const updateLocal = useCallback(
    (updater: (data: T | null) => T | null) => {
      setData((prev) => {
        const updated = updater(prev)
        // 同时更新缓存
        if (cacheKey && updated) {
          globalCache.set(cacheKey, updated, cacheTime)
        }
        return updated
      })
    },
    [cacheKey, cacheTime]
  )

  // 设置页码
  const setPage = useCallback(
    (newPage: number) => {
      setPageState(newPage)
      fetch({ ...defaultParams, page: newPage, page_size: pageSize } as P)
    },
    [fetch, defaultParams, pageSize]
  )

  // 立即加载
  useEffect(() => {
    if (immediate) {
      void fetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate])

  // 自动刷新
  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh()
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refreshInterval, refresh])

  // 获取分页数据
  const paginatedData = data ? extractPaginatedData(data) : null

  return {
    data,
    paginatedData,
    loading,
    refreshing,
    error,
    fetch,
    refresh,
    reset,
    updateLocal,
    setPage,
    page,
    pageSize,
    total,
  }
}

/**
 * 清除全局缓存
 */
export function clearAllCache() {
  globalCache.clear()
}

/**
 * 清除指定缓存
 */
export function invalidateCache(key: string) {
  globalCache.invalidate(key)
}
