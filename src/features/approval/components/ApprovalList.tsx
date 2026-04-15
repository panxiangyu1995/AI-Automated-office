/**
 * 审批列表组件
 * Task 148 - Approval审批中心模块
 */

import { useEffect } from 'react'
import { Clock, CheckCircle2, XCircle, RefreshCw, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useApprovalStore } from '../stores/approvalStore'
import type { RecordStatus } from '../types/approval.types'

const STATUS_ICONS: Record<RecordStatus, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: Clock,
}

const STATUS_COLORS: Record<RecordStatus, string> = {
  pending: 'bg-yellow-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-400',
}

const STATUS_LABELS: Record<RecordStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已撤回',
}

interface ApprovalListProps {
  onSelectRecord?: (id: string) => void
}

export function ApprovalList({ onSelectRecord }: ApprovalListProps) {
  const {
    records,
    stats,
    filterStatus,
    isLoadingRecords,
    fetchRecords,
    fetchStats,
    setFilterStatus,
  } = useApprovalStore()

  useEffect(() => {
    fetchRecords(filterStatus)
    fetchStats()
  }, [fetchRecords, fetchStats, filterStatus])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">审批中心</h2>
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus ?? 'all'}
            onValueChange={(v) => setFilterStatus(v === 'all' ? undefined : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待审批</SelectItem>
              <SelectItem value="approved">已通过</SelectItem>
              <SelectItem value="rejected">已驳回</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchRecords(filterStatus)}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingRecords ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">待审批</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">已通过</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">已驳回</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">总记录</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 记录列表 */}
      {isLoadingRecords ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState title="暂无审批记录" description="审批流程将在此处显示" icon={ClipboardList} />
      ) : (
        <div className="space-y-2">
          {records.map((record) => {
            const Icon = STATUS_ICONS[record.status]
            return (
              <Card
                key={record.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectRecord?.(record.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${STATUS_COLORS[record.status]} bg-opacity-10`}
                      >
                        <Icon
                          className={`h-5 w-5 ${STATUS_COLORS[record.status].replace('bg-', 'text-')}`}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{record.flowName}</div>
                        <div className="text-sm text-muted-foreground">
                          申请人: {record.applicantName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(record.createdAt * 1000).toLocaleDateString()}
                      </span>
                      <Badge className={`${STATUS_COLORS[record.status]} text-white border-0`}>
                        {STATUS_LABELS[record.status]}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
