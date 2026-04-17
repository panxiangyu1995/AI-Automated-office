import { CheckSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'

interface ApprovalProgressProps {
  pending: number
  approved: number
  rejected: number
  total: number
}

function ApprovalProgress({ pending, approved, rejected, total }: ApprovalProgressProps) {
  const approvedRate = total > 0 ? Math.round((approved / total) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span>审批通过率</span>
        <span className="font-medium">{approvedRate}%</span>
      </div>
      <Progress value={approvedRate} className="h-2" />
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <p className="text-lg font-bold text-yellow-600">{pending}</p>
          <p className="text-xs text-muted-foreground">待审批</p>
        </div>
        <div className="p-2 rounded-lg bg-green-500/10">
          <p className="text-lg font-bold text-green-600">{approved}</p>
          <p className="text-xs text-muted-foreground">已通过</p>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10">
          <p className="text-lg font-bold text-red-600">{rejected}</p>
          <p className="text-xs text-muted-foreground">已驳回</p>
        </div>
      </div>
    </div>
  )
}

interface ApprovalOverviewProps {
  stats: {
    pending: number
    approved: number
    rejected: number
    total: number
  } | null
}

export function ApprovalOverview({ stats }: ApprovalOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-yellow-500" />
          审批概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <ApprovalProgress
            pending={stats.pending}
            approved={stats.approved}
            rejected={stats.rejected}
            total={stats.total}
          />
        ) : (
          <EmptyState variant="data" title="暂无审批数据" description="审批统计数据未加载" />
        )}
      </CardContent>
    </Card>
  )
}
