import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { checkNetworkStatus } from '../lib/tauri'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    let unlisten: (() => void) | undefined

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    const setup = async () => {
      const initial = await checkNetworkStatus().catch(() => navigator.onLine)
      setIsOnline(initial)
      unlisten = await listen('network-status-changed', (event) => {
        setIsOnline(Boolean(event.payload))
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setup()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      unlisten?.()
    }
  }, [])

  return { isOnline }
}
