import { useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  MessageSquare,
  SkipForward,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import type { ApprovalHistory, RecordStatus } from '../types/approval.types'

interface ApprovalFlowTimelineProps {
  history: ApprovalHistory[]
  currentStep: number
  totalSteps: number
  status: RecordStatus
}

const ACTION_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  approved: { label: '通过', icon: CheckCircle2, color: 'text-green-500' },
  rejected: { label: '驳回', icon: XCircle, color: 'text-red-500' },
  submitted: { label: '提交', icon: ArrowRight, color: 'text-blue-500' },
  cancelled: { label: '撤回', icon: SkipForward, color: 'text-gray-500' },
  pending: { label: '待审批', icon: Clock, color: 'text-yellow-500' },
  commented: { label: '评论', icon: MessageSquare, color: 'text-purple-500' },
}

function formatTimestamp(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(ts)
  }
}

export function ApprovalFlowTimeline({
  history,
  currentStep: _currentStep,
  totalSteps,
  status,
}: ApprovalFlowTimelineProps) {
  const timelineEntries = useMemo(() => {
    const entries = [...history].sort((a, b) => a.timestamp - b.timestamp)

    if (status === 'pending' && entries.length < totalSteps) {
      for (let i = entries.length; i < totalSteps; i++) {
        entries.push({
          id: `pending-step-${i}`,
          stepId: `step-${i}`,
          approverId: '',
          approverName: '待审批',
          action: 'pending',
          timestamp: 0,
        })
      }
    }

    return entries
  }, [history, totalSteps, status])

  if (timelineEntries.length === 0) {
    return <EmptyState variant="data" title="暂无审批记录" description="审批流程尚未开始" />
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-0">
        {timelineEntries.map((entry, idx) => {
          const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.pending
          const Icon = config.icon
          const isPending = entry.action === 'pending'
          const isLast = idx === timelineEntries.length - 1

          return (
            <div key={entry.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center border shrink-0',
                    isPending
                      ? 'bg-muted border-muted-foreground/20'
                      : entry.action === 'approved'
                        ? 'bg-green-500/10 border-green-500/20'
                        : entry.action === 'rejected'
                          ? 'bg-red-500/10 border-red-500/20'
                          : 'bg-blue-500/10 border-blue-500/20'
                  )}
                >
                  <Icon className={cn('h-4 w-4', config.color)} />
                </div>
                {!isLast && <div className="w-0.5 h-8 bg-border" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('font-medium text-sm', isPending && 'text-muted-foreground')}>
                    {entry.approverName}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs',
                      isPending
                        ? 'text-muted-foreground'
                        : config.color
                    )}
                  >
                    {config.label}
                  </Badge>
                </div>
                {entry.comment && (
                  <p className="text-xs text-muted-foreground mb-1 bg-muted/50 p-2 rounded">
                    {entry.comment}
                  </p>
                )}
                {entry.timestamp > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
