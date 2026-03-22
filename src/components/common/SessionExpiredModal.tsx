import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Clock, ShieldAlert, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'

export type SessionExpiredReason = 
  | 'session_expired'
  | 'idle_timeout'
  | 'forced_logout'
  | 'token_invalid'
  | 'token_revoked'
  | 'unknown'

interface SessionExpiredModalProps {
  open: boolean
  reason: SessionExpiredReason
  message?: string
  onConfirm: () => void
}

const reasonConfig: Record<SessionExpiredReason, { title: string; description: string; icon: React.ReactNode }> = {
  session_expired: {
    title: '会话已过期',
    description: '您的登录会话已过期，请重新登录以继续使用。',
    icon: <Clock className="h-12 w-12 text-amber-500" />,
  },
  idle_timeout: {
    title: '登录已超时',
    description: '由于长时间未操作，您已自动登出。请重新登录。',
    icon: <Clock className="h-12 w-12 text-amber-500" />,
  },
  forced_logout: {
    title: '您已被登出',
    description: '您的账号已被管理员强制登出，请联系管理员了解详情。',
    icon: <ShieldAlert className="h-12 w-12 text-red-500" />,
  },
  token_invalid: {
    title: '登录状态无效',
    description: '您的登录状态已失效，请重新登录。',
    icon: <AlertCircle className="h-12 w-12 text-red-500" />,
  },
  token_revoked: {
    title: '登录已撤销',
    description: '您的登录凭证已被撤销，请重新登录。',
    icon: <LogOut className="h-12 w-12 text-red-500" />,
  },
  unknown: {
    title: '登录已失效',
    description: '您的登录状态已失效，请重新登录。',
    icon: <AlertCircle className="h-12 w-12 text-gray-500" />,
  },
}

export function SessionExpiredModal({ open, reason, message, onConfirm }: SessionExpiredModalProps) {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const [isClearing, setIsClearing] = useState(false)

  const config = reasonConfig[reason] || reasonConfig.unknown

  const handleConfirm = useCallback(async () => {
    setIsClearing(true)
    try {
      await clearAuth()
      onConfirm()
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Failed to clear auth:', error)
      navigate('/login', { replace: true })
    } finally {
      setIsClearing(false)
    }
  }, [clearAuth, navigate, onConfirm])

  // 自动跳转（5秒后）
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        handleConfirm()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [open, handleConfirm])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4">
            {config.icon}
          </div>
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-base">
            {message || config.description}
          </DialogDescription>
        </DialogHeader>
        <div className="text-center text-sm text-muted-foreground">
          将在 5 秒后自动跳转到登录页...
        </div>
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleConfirm} disabled={isClearing} className="min-w-24">
            {isClearing ? '处理中...' : '重新登录'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

