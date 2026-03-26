import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListChecks, RotateCcw, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  countPendingCandidateChanges,
  useStagedReviewPackages,
  useStagedReviewStore,
  type CandidateChangeStatus,
  type ReviewPackageStatus,
} from '@/features/session/runtime'
import { cn } from '@/lib/utils'

interface StagedReviewPanelProps {
  sessionId?: string | null
  className?: string
}

const packageStatusLabel: Record<ReviewPackageStatus, string> = {
  staged: '待审阅',
  partially_accepted: '部分接受',
  accepted: '已接受',
  rejected: '已拒绝',
  rolled_back: '已回滚',
}

const changeStatusLabel: Record<CandidateChangeStatus, string> = {
  staged: '待处理',
  accepted: '已接受',
  rejected: '已拒绝',
}

export function StagedReviewPanel({ sessionId, className }: StagedReviewPanelProps) {
  const reviewPackages = useStagedReviewPackages(sessionId)
  const pendingCount = useMemo(
    () => countPendingCandidateChanges(reviewPackages),
    [reviewPackages],
  )
  const [collapsed, setCollapsed] = useState(false)
  const {
    acceptCandidateChange,
    rejectCandidateChange,
    acceptReviewPackage,
    rejectReviewPackage,
    rollbackReviewPackage,
  } = useStagedReviewStore()

  useEffect(() => {
    if (reviewPackages.length === 0) {
      setCollapsed(true)
      return
    }

    setCollapsed(false)
  }, [reviewPackages.length])

  if (!sessionId) {
    return null
  }

  return (
    <div className={cn('border-b border-slate-200 bg-slate-50/70', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setCollapsed((value) => !value)}
      >
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-[#1E3A5F]" />
          <span className="text-sm font-medium text-slate-800">候选改动清单</span>
          <Badge variant="outline" className="text-xs">
            {pendingCount}
          </Badge>
          <span className="text-xs text-slate-500">AI 只能暂存改动，接受/拒绝由用户执行</span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {!collapsed ? (
        <div className="border-t border-slate-200 px-4 py-3">
          {reviewPackages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
              当前没有待审阅的候选改动。后续 AI 通过 `workspace_stage_change` 和统一 writeback 适配器写回的内容，会先进入这里等待用户确认。
            </div>
          ) : (
            <ScrollArea className="max-h-72 pr-2">
              <div className="space-y-3">
                {reviewPackages.map((reviewPackage) => {
                  const hasPending = reviewPackage.changes.some((change) => change.status === 'staged')
                  const canRollback =
                    reviewPackage.status === 'accepted' || reviewPackage.status === 'partially_accepted'

                  return (
                    <Card key={reviewPackage.packageId} className="border-slate-200 bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-sm">{reviewPackage.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs leading-5">
                              {reviewPackage.summary}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {packageStatusLabel[reviewPackage.status]}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => acceptReviewPackage(sessionId, reviewPackage.packageId, 'user')}
                            disabled={!hasPending}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            全部接受
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectReviewPackage(sessionId, reviewPackage.packageId, 'user')}
                            disabled={!hasPending}
                          >
                            <X className="mr-1 h-3 w-3" />
                            全部拒绝
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => rollbackReviewPackage(sessionId, reviewPackage.packageId, 'user')}
                            disabled={!canRollback}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            回滚
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {reviewPackage.changes.map((change) => (
                            <div
                              key={change.changeId}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-800">{change.label}</span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-xs',
                                        change.status === 'accepted' && 'border-emerald-200 text-emerald-700',
                                        change.status === 'rejected' && 'border-red-200 text-red-700',
                                      )}
                                    >
                                      {changeStatusLabel[change.status]}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    目标: {change.targetKind} / {change.targetLabel}
                                  </p>
                                  <p className="text-xs text-slate-600">{change.summary}</p>
                                  {change.preview ? (
                                    <pre className="overflow-x-auto rounded-md bg-white p-2 text-[11px] text-slate-600">
                                      {change.preview}
                                    </pre>
                                  ) : null}
                                </div>
                                <div className="flex shrink-0 gap-2">
                                  <Button
                                    size="sm"
                                    variant={change.status === 'accepted' ? 'secondary' : 'outline'}
                                    onClick={() =>
                                      acceptCandidateChange(
                                        sessionId,
                                        reviewPackage.packageId,
                                        change.changeId,
                                        'user',
                                      )
                                    }
                                    disabled={change.status === 'accepted'}
                                  >
                                    接受
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={change.status === 'rejected' ? 'secondary' : 'outline'}
                                    onClick={() =>
                                      rejectCandidateChange(
                                        sessionId,
                                        reviewPackage.packageId,
                                        change.changeId,
                                        'user',
                                      )
                                    }
                                    disabled={change.status === 'rejected'}
                                  >
                                    拒绝
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default StagedReviewPanel
