/**
 * 权限拒绝弹窗组件
 *
 * @module ForbiddenModal
 * @description 当 API 返回 403 时显示的权限拒绝弹窗
 */

import { useState } from 'react'
import { ShieldX } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ApplyPermissionModal } from './ApplyPermissionModal'
import type { ForbiddenData } from '@/features/permission/types/permission.types'
import { cn } from '@/lib/utils'

export interface ForbiddenModalProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 403 响应数据 */
  data: ForbiddenData | null
  /** 自定义类名 */
  className?: string
}

/**
 * ForbiddenModal 组件
 *
 * 用于展示权限被拒绝的详细信息，并提供申请权限入口。
 *
 * @example
 * ```tsx
 * <ForbiddenModal
 *   open={forbiddenModal.open}
 *   onClose={hideForbidden}
 *   data={forbiddenModal.data}
 * />
 * ```
 */
export function ForbiddenModal({
  open,
  onClose,
  data,
  className,
}: ForbiddenModalProps) {
  const [showApplyModal, setShowApplyModal] = useState(false)

  if (!data) return null

  const handleApplyClick = () => {
    setShowApplyModal(true)
  }

  const handleApplySuccess = () => {
    setShowApplyModal(false)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={cn('sm:max-w-md', className)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldX className="h-5 w-5 text-red-500" />
              操作被拒绝
            </DialogTitle>
          </DialogHeader>

          {/* 内容区域 */}
          <div className="space-y-4">
            <p className="text-muted-foreground">{data.message}</p>

            {/* 资源信息 */}
            <div className="rounded-lg bg-muted p-3">
              <div className="mb-2">
                <span className="text-xs text-muted-foreground">资源：</span>
                <span className="ml-1 font-mono text-sm text-foreground">
                  {data.resource}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">所需权限：</span>
                <span className="ml-1 font-mono text-sm text-foreground">
                  {data.requiredPermission}
                </span>
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              返回
            </Button>
            <Button onClick={handleApplyClick}>
              申请权限
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 申请权限弹窗 */}
      <ApplyPermissionModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        resource={data.resource}
        requiredPermission={data.requiredPermission}
        onSuccess={handleApplySuccess}
      />
    </>
  )
}
