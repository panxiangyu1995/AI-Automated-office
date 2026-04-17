import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

function formatCurrency(n: number) {
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`
  return `¥${n.toLocaleString()}`
}

interface FinanceOverviewProps {
  stats: {
    totalReceivable: number
    totalPayable: number
    totalInvoices: number
    pendingCount: number
  } | null
}

export function FinanceOverview({ stats }: FinanceOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-500" />
          财务概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-xs text-muted-foreground mb-1">应收总额</p>
                <p className="text-lg font-bold text-cyan-600">
                  {formatCurrency(stats.totalReceivable)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-muted-foreground mb-1">应付总额</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(stats.totalPayable)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm text-muted-foreground">发票总数</span>
                <span className="font-medium">{stats.totalInvoices}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <span className="text-sm text-muted-foreground">待处理</span>
                <span className="font-medium text-yellow-600">{stats.pendingCount}</span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState variant="data" title="暂无财务数据" description="财务统计数据未加载" />
        )}
      </CardContent>
    </Card>
  )
}
