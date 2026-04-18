/**
 * useAsyncState - 异步状态管理 Hook
 * 
 * 简化异步操作的状态管理：loading, error, data
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { TauriError } from './useTauriCommand'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: TauriError | null
}

export interface AsyncActions<T> {
  execute: (fn: () => Promise<T>) => Promise<T | null>
  executeWithParams: <P extends unknown[]>(fn: (...params: P) => Promise<T>, ...params: P) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
}

/**
 * 解析错误对象
 */
function parseError(err: unknown): TauriError {
  if (typeof err === 'string') {
    return { message: err, code: 'ERR_UNKNOWN' }
  }
  if (err instanceof Error) {
    return { message: err.message, code: 'ERR_UNKNOWN' }
  }
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>
    return {
      code: (obj.code as string) || 'ERR_UNKNOWN',
      message: (obj.message as string) || '请求失败',
      details: obj.details as Record<string, string> | undefined,
    }
  }
  return { message: '请求失败', code: 'ERR_UNKNOWN' }
}

/**
 * 创建异步状态 Hook
 */
export function useAsyncState<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<TauriError | null>(null)

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await fn()
      setData(result)
      return result
    } catch (err) {
      const errorObj: TauriError = parseError(err)
      setError(errorObj)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const executeWithParams = useCallback(async <P extends unknown[]>(
    fn: (...params: P) => Promise<T>,
    ...params: P
  ): Promise<T | null> => {
    return execute(() => fn(...params))
  }, [execute])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    executeWithParams,
    reset,
    setData,
  }
}

/**
 * 批量异步操作 Hook
 */
export function useBatchAsync<T>() {
  const [results, setResults] = useState<Map<string, AsyncState<T>>>(new Map())
  const [loadingCount, setLoadingCount] = useState(0)

  const execute = useCallback(async (key: string, fn: () => Promise<T>): Promise<T | null> => {
    setResults((prev) => {
      const next = new Map(prev)
      next.set(key, { data: null, loading: true, error: null })
      return next
    })
    setLoadingCount((c) => c + 1)

    try {
      const data = await fn()
      setResults((prev) => {
        const next = new Map(prev)
        next.set(key, { data, loading: false, error: null })
        return next
      })
      return data
    } catch (err) {
      const errorObj: TauriError = parseError(err)
      setResults((prev) => {
        const next = new Map(prev)
        next.set(key, { data: null, loading: false, error: errorObj })
        return next
      })
      return null
    } finally {
      setLoadingCount((c) => c - 1)
    }
  }, [])

  const executeAll = useCallback(async (
    items: Array<{ key: string; fn: () => Promise<T> }>
  ): Promise<Map<string, T | null>> => {
    const promises = items.map((item) =>
      execute(item.key, item.fn).then((result) => ({ key: item.key, result }))
    )
    const settled = await Promise.all(promises)
    const map = new Map<string, T | null>()
    settled.forEach(({ key, result }) => map.set(key, result))
    return map
  }, [execute])

  const reset = useCallback((key?: string) => {
    if (key) {
      setResults((prev) => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
    } else {
      setResults(new Map())
    }
  }, [])

  const isLoading = loadingCount > 0

  return {
    results,
    loadingCount,
    isLoading,
    execute,
    executeAll,
    reset,
  }
}

/**
 * 防抖 Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流 Hook
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now())

  return useCallback(
    ((...args: unknown[]) => {
      const now = Date.now()
      if (now - lastRan.current >= delay) {
        callback(...args)
        lastRan.current = now
      }
    }) as unknown as T,
    [callback, delay]
  )
}
