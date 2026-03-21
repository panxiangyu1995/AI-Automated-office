import { useEffect, useRef, useCallback } from 'react'
import { ApiClient } from '@/lib/api/client'
import { useAuthStore } from '@/stores/authStore'

interface SessionStatus {
  valid: boolean
  session_id?: string
  user_id?: string
  tenant_id?: string
  status?: string
  expires_at?: string
  last_activity_at?: string
  reason?: string
}

interface UseSessionCheckOptions {
  intervalMs?: number
  enabled?: boolean
  onSessionExpired?: (reason: string) => void
}

const DEFAULT_INTERVAL = 5 * 60 * 1000 // 5 minutes

const createApiClient = () => {
  return new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? '',
    timeout: 30000,
    retryCount: 3,
  })
}

export function useSessionCheck(options: UseSessionCheckOptions = {}) {
  const {
    intervalMs = DEFAULT_INTERVAL,
    enabled = true,
    onSessionExpired,
  } = options

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const checkInProgress = useRef(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const checkSession = useCallback(async () => {
    if (checkInProgress.current || !isAuthenticated) {
      return
    }

    checkInProgress.current = true

    try {
      const client = createApiClient()
      const response = await client.get<SessionStatus>('/api/auth/sessions/status')
      
      if (!response?.valid) {
        const reason = response?.reason || 'session_expired'
        onSessionExpired?.(reason)
      }
    } catch (error) {
      console.error('Session check failed:', error)
      // If we get an error, likely the session is invalid
      onSessionExpired?.('session_check_failed')
    } finally {
      checkInProgress.current = false
    }
  }, [isAuthenticated, onSessionExpired])

  // Start periodic check
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial check
    checkSession()

    // Set up interval
    intervalRef.current = setInterval(checkSession, intervalMs)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, isAuthenticated, intervalMs, checkSession])

  return {
    checkSession,
  }
}
