import { useMemo, useRef, useState } from 'react'
import { ApiClient } from '../lib/api/client'
import type { ApiClientConfig, ApiError } from '../lib/api/types'

const buildConfig = (overrides?: Partial<ApiClientConfig>): ApiClientConfig => ({
  baseUrl: import.meta.env.VITE_API_URL ?? '',
  timeout: 30000,
  retryCount: 3,
  retryDelay: 1000,
  retryBackoff: 'exponential',
  ...overrides,
})

export function useApi(overrides?: Partial<ApiClientConfig>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const clientRef = useRef<ApiClient | null>(null)

  const client = useMemo(() => {
    if (!clientRef.current) {
      clientRef.current = new ApiClient(buildConfig(overrides))
    }
    return clientRef.current
  }, [overrides])

  const resetError = () => setError(null)

  const wrap = async <T>(promise: Promise<T>) => {
    setLoading(true)
    setError(null)
    try {
      return await promise
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    client,
    loading,
    error,
    resetError,
    wrap,
  }
}
