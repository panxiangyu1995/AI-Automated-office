import { useState, type ComponentPropsWithoutRef } from 'react'
import { AlertTriangle, ArrowLeftRight, Check, Copy, Download, Upload } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog'
import type { SyncConflict, ConflictResolutionStrategy, ConflictResolutionResult } from '../types'

interface SyncConflictDialogProps extends ComponentPropsWithoutRef<typeof Dialog> {
  conflicts: SyncConflict[]
  onResolve: (results: ConflictResolutionResult[]) => void
  onDismiss?: () => void
}

/**
 * SyncConflictDialog
 *
 * Displays data synchronization conflicts and lets the user choose a resolution strategy.
 * Implements PRD FR40 (conflict detection) and FR41 (user chooses version to keep).
 */
export function SyncConflictDialog({
  conflicts,
  onResolve,
  onDismiss,
  ...dialogProps
}: SyncConflictDialogProps) {
  const [currentConflictIndex, setCurrentConflictIndex] = useState(0)
  const [resolutions, setResolutions] = useState<Map<string, ConflictResolutionStrategy>>(new Map())

  const currentConflict = conflicts[currentConflictIndex]
  const isLastConflict = currentConflictIndex >= conflicts.length - 1

  const hasConflicts = conflicts.length > 0

  const handleSetStrategy = (conflictId: string, strategy: ConflictResolutionStrategy) => {
    setResolutions((prev) => new Map(prev).set(conflictId, strategy))
  }

  const handleNext = () => {
    if (isLastConflict) {
      // All conflicts processed, submit resolutions
      const results: ConflictResolutionResult[] = []
      for (const [conflictId, strategy] of resolutions.entries()) {
        results.push({
          conflictId,
          strategy,
          resolvedAt: new Date().toISOString(),
        })
      }
      onResolve(results)
    } else {
      setCurrentConflictIndex((i) => i + 1)
    }
  }

  const handleApplyToAll = (strategy: ConflictResolutionStrategy) => {
    const newResolutions = new Map(resolutions)
    for (const conflict of conflicts) {
      newResolutions.set(conflict.id, strategy)
    }
    setResolutions(newResolutions)
  }

  if (!hasConflicts || !currentConflict) return null

  const currentStrategy = resolutions.get(currentConflict.id)

  return (
    <Dialog {...dialogProps}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: 'var(--ao-warningForeground)' }} />
            数据同步冲突
          </DialogTitle>
          <DialogDescription>
            检测到 {conflicts.length} 个数据冲突，请选择保留版本。
            （{currentConflictIndex + 1} / {conflicts.length}）
          </DialogDescription>
        </DialogHeader>

        {/* Current conflict details */}
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: 'var(--ao-card-border)',
            backgroundColor: 'var(--ao-card-background)',
          }}
        >
          <h4
            className="mb-3 text-sm font-semibold"
            style={{ color: 'var(--ao-sidebar-foreground)' }}
          >
            {currentConflict.entityLabel}
          </h4>

          {/* Conflict fields table */}
          <div className="space-y-2">
            {currentConflict.fields.map((field) => (
              <div
                key={field.fieldName}
                className="grid grid-cols-[1fr_2fr_2fr] gap-2 text-xs"
                style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}
              >
                <span className="font-medium" style={{ color: 'var(--ao-sidebar-foreground)' }}>
                  {field.fieldLabel}
                </span>
                <span
                  className="rounded px-2 py-1"
                  style={{ backgroundColor: 'var(--ao-sidebar-searchBackground)' }}
                  title={`本地修改: ${field.localModifiedAt}`}
                >
                  {String(field.localValue)}
                </span>
                <span
                  className="rounded px-2 py-1"
                  style={{ backgroundColor: 'var(--ao-sidebar-searchBackground)' }}
                  title={`远程修改: ${field.remoteModifiedAt}`}
                >
                  {String(field.remoteValue)}
                </span>
              </div>
            ))}
          </div>

          {/* Column headers for the values */}
          <div className="mt-2 grid grid-cols-[1fr_2fr_2fr] gap-2 text-xs" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>
            <span />
            <span className="flex items-center gap-1">
              <Upload className="h-3 w-3" /> 本地版本
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" /> 远程版本
            </span>
          </div>
        </div>

        {/* Resolution strategy options */}
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--ao-sidebar-foreground)' }}>
            选择解决方式：
          </p>

          <div className="grid grid-cols-2 gap-2">
            <StrategyButton
              icon={<Upload className="h-4 w-4" />}
              label="保留本地"
              description="使用本地版本覆盖远程"
              selected={currentStrategy === 'keep-local'}
              onClick={() => handleSetStrategy(currentConflict.id, 'keep-local')}
            />
            <StrategyButton
              icon={<Download className="h-4 w-4" />}
              label="保留远程"
              description="使用远程版本覆盖本地"
              selected={currentStrategy === 'keep-remote'}
              onClick={() => handleSetStrategy(currentConflict.id, 'keep-remote')}
            />
            <StrategyButton
              icon={<Copy className="h-4 w-4" />}
              label="保留两者"
              description="保留两个版本（远程版本将重命名）"
              selected={currentStrategy === 'keep-both'}
              onClick={() => handleSetStrategy(currentConflict.id, 'keep-both')}
            />
            <StrategyButton
              icon={<ArrowLeftRight className="h-4 w-4" />}
              label="手动合并"
              description="手动编辑合并两个版本"
              selected={currentStrategy === 'merge'}
              onClick={() => handleSetStrategy(currentConflict.id, 'merge')}
            />
          </div>
        </div>

        {/* Bulk actions */}
        {conflicts.length > 1 && (
          <div
            className="rounded-md border p-3"
            style={{ borderColor: 'var(--ao-card-border)' }}
          >
            <p className="mb-2 text-xs" style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}>
              对所有 {conflicts.length} 个冲突应用相同策略：
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyToAll('keep-local')}
              >
                全部保留本地
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyToAll('keep-remote')}
              >
                全部保留远程
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleApplyToAll('last-write-wins')}
              >
                全部以最新为准
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {onDismiss && (
            <Button variant="ghost" onClick={onDismiss}>
              稍后处理
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!currentStrategy}
          >
            {isLastConflict ? '确认解决' : '下一个冲突'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Internal strategy selection button */
function StrategyButton({
  icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2 rounded-md border p-3 text-left text-sm transition-colors"
      style={{
        borderColor: selected ? 'var(--ao-sidebar-activeIndicator)' : 'var(--ao-card-border)',
        backgroundColor: selected ? 'var(--ao-sidebar-activeBackground)' : 'transparent',
        color: selected ? 'var(--ao-sidebar-activeForeground)' : 'var(--ao-sidebar-foreground)',
      }}
    >
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="font-medium">{label}</div>
        <div
          className="text-xs"
          style={{ color: 'var(--ao-sidebar-secondaryForeground)' }}
        >
          {description}
        </div>
      </div>
      {selected && (
        <Check className="ml-auto h-4 w-4" style={{ color: 'var(--ao-sidebar-activeIndicator)' }} />
      )}
    </button>
  )
}
