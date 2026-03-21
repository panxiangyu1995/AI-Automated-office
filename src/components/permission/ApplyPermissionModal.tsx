/**
 * 申请权限弹窗组件
 *
 * @module ApplyPermissionModal
 * @description 用于提交权限申请的弹窗
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useApplyPermission } from '@/features/permission/hooks'
import { cn } from '@/lib/utils'

export interface ApplyPermissionModalProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 资源标识 */
  resource: string
  /** 所需权限 */
  requiredPermission: string
  /** 申请成功回调 */
  onSuccess?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * ApplyPermissionModal 组件
 *
 * 用于提交权限申请，需要用户填写申请原因。
 *
 * @example
 * ```tsx
 * <ApplyPermissionModal
 *   open={showApplyModal}
 *   onClose={() => setShowApplyModal(false)}
 *   resource="hr.employee"
 *   requiredPermission="hr_employee_write"
 *   onSuccess={() => toast.success('申请已提交')}
 * />
 * ```
 */
export function ApplyPermissionModal({
  open,
  onClose,
  resource,
  requiredPermission,
  onSuccess,
  className,
}: ApplyPermissionModalProps) {
  const [reason, setReason] = useState('')
  const { mutate, isPending } = useApplyPermission()

  const handleSubmit = () => {
    if (!reason.trim()) return

    mutate(
      {
        resource,
        permission: requiredPermission,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          setReason('')
          onSuccess?.()
        },
      },
    )
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={cn('sm:max-w-lg', className)}>
        <DialogHeader>
          <DialogTitle>申请权限</DialogTitle>
          <DialogDescription>
            请填写申请原因，我们将尽快处理您的申请。
          </DialogDescription>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="space-y-4">
          {/* 权限信息 */}
          <div className="rounded-lg bg-muted p-3">
            <div className="mb-1 text-xs text-muted-foreground">申请权限</div>
            <div className="font-mono text-sm text-foreground">{requiredPermission}</div>
          </div>

          {/* 申请原因 */}
          <div className="space-y-2">
            <Label htmlFor="reason">申请原因</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="请说明为什么需要此权限..."
              rows={4}
              disabled={isPending}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isPending}
          >
            {isPending ? '提交中...' : '提交申请'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
