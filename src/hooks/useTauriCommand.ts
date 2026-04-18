/**
 * useTauriCommand - Tauri 命令调用的统一封装
 * 
 * 提供：
 * - 统一的错误处理
 * - 加载状态管理
 * - 数据验证
 * - 自动重试
 */

import { useState, useCallback, useRef } from 'react'
import { invoke, InvokeOptions } from '@tauri-apps/api/core'
import { getErrorMessage, isAuthError, isPermissionError } from '@/lib/api/errorCodes'

export interface TauriError {
  code: string
  message: string
  details?: Record<string, string>
}

export interface UseTauriCommandOptions<T> {
  /** 命令名称 */
  command: string
  /** 参数 */
  params?: Record<string, unknown>
  /** 是否在挂载时自动执行 */
  immediate?: boolean
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟(ms) */
  retryDelay?: number
  /** 请求选项 */
  invokeOptions?: InvokeOptions
  /** 成功回调 */
  onSuccess?: (data: T) => void
  /** 错误回调 */
  onError?: (error: TauriError) => void
  /** 完成回调(无论成功失败) */
  onFinally?: () => void
}

export interface UseTauriCommandReturn<T> {
  /** 数据 */
  data: T | null
  /** 加载状态 */
  loading: boolean
  /** 错误 */
  error: TauriError | null
  /** 是否正在重试 */
  retrying: boolean
  /** 重试次数 */
  retryAttempt: number
  /** 执行命令 */
  execute: (params?: Record<string, unknown>) => Promise<T | null>
  /** 重置状态 */
  reset: () => void
  /** 检查是否是认证错误 */
  isAuthError: () => boolean
  /** 检查是否是权限错误 */
  isPermissionError: () => boolean
}

/**
 * Tauri 命令调用的统一 Hook
 */
export function useTauriCommand<T>({
  command,
  params,
  immediate = false,
  retryCount = 0,
  retryDelay = 1000,
  invokeOptions,
  onSuccess,
  onError,
  onFinally,
}: UseTauriCommandOptions<T>): UseTauriCommandReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<TauriError | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)

  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 解析错误
  const parseError = (err: unknown): TauriError => {
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
        message: (obj.message as string) || getErrorMessage(obj.code as string) || '请求失败',
        details: obj.details as Record<string, string> | undefined,
      }
    }
    return { message: '请求失败', code: 'ERR_UNKNOWN' }
  }

  // 执行命令
  const execute = useCallback(
    async (execParams?: Record<string, unknown>): Promise<T | null> => {
      // 清理之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      // 清理重试定时器
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
        retryTimeoutRef.current = null
      }

      setLoading(true)
      setError(null)
      setRetrying(false)
      setRetryAttempt(0)

      const finalParams = execParams ?? params ?? {}

      const doExecute = async (attempt: number): Promise<T | null> => {
        try {
          const result = await invoke<T>(command, finalParams, invokeOptions)
          setData(result)
          setLoading(false)
          onSuccess?.(result)
          onFinally?.()
          return result
        } catch (err) {
          const parsedError = parseError(err)

          // 检查是否是可重试的错误
          const isRetryable =
            attempt < retryCount &&
            (parsedError.code === 'ERR_NETWORK' ||
              parsedError.code === 'ERR_TIMEOUT' ||
              parsedError.message.includes('network'))

          if (isRetryable) {
            setRetrying(true)
            setRetryAttempt(attempt + 1)

            // 等待后重试
            await new Promise((resolve) => {
              retryTimeoutRef.current = setTimeout(resolve, retryDelay * Math.pow(2, attempt))
            })

            return doExecute(attempt + 1)
          }

          setError(parsedError)
          setLoading(false)
          onError?.(parsedError)
          onFinally?.()
          return null
        }
      }

      return doExecute(0)
    },
    [command, params, retryCount, retryDelay, invokeOptions, onSuccess, onError, onFinally]
  )

  // 重置状态
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    setData(null)
    setError(null)
    setLoading(false)
    setRetrying(false)
    setRetryAttempt(0)
  }, [])

  // 检查是否是认证错误
  const checkIsAuthError = useCallback(() => {
    if (!error) return false
    return isAuthError(error.code)
  }, [error])

  // 检查是否是权限错误
  const checkIsPermissionError = useCallback(() => {
    if (!error) return false
    return isPermissionError(error.code)
  }, [error])

  // 立即执行
  if (immediate && !data && !loading && !error) {
    execute()
  }

  return {
    data,
    loading,
    error,
    retrying,
    retryAttempt,
    execute,
    reset,
    isAuthError: checkIsAuthError,
    isPermissionError: checkIsPermissionError,
  }
}

/**
 * 快捷命令执行器（不依赖 React 状态）
 */
export async function invokeCommand<T>(
  command: string,
  params?: Record<string, unknown>,
  options?: InvokeOptions
): Promise<T> {
  return invoke<T>(command, params, options)
}

/**
 * 带超时的命令执行
 */
export async function invokeCommandWithTimeout<T>(
  command: string,
  params: Record<string, unknown> = {},
  timeoutMs = 30000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('请求超时')), timeoutMs)
  })

  return Promise.race([invoke<T>(command, params), timeoutPromise])
}

/**
 * 批量执行多个命令
 */
export async function invokeBatch<T>(
  commands: Array<{ command: string; params?: Record<string, unknown> }>
): Promise<Array<{ success: true; data: T } | { success: false; error: TauriError }>> {
  return Promise.all(
    commands.map(async ({ command, params }) => {
      try {
        const data = await invoke<T>(command, params)
        return { success: true, data } as { success: true; data: T }
      } catch (err) {
        const error = typeof err === 'string'
          ? { message: err, code: 'ERR_UNKNOWN' }
          : err instanceof Error
            ? { message: err.message, code: 'ERR_UNKNOWN' }
            : { message: '请求失败', code: 'ERR_UNKNOWN' }
        return { success: false, error } as { success: false; error: TauriError }
      }
    })
  )
}
