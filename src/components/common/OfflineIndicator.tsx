import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'

/**
 * 显示离线状态提示横幅
 */
export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm text-white">
        <WifiOff className="h-4 w-4" />
        <span>离线模式 - 部分功能可能不可用</span>
      </div>
    </div>
  )
}
