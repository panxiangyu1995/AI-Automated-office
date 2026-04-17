import { Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'

function formatCurrency(n: number) {
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`
  return `¥${n.toLocaleString()}`
}

interface SalesOverviewProps {
  stats: {
    totalAmount: number
    totalCustomers: number
    totalQuotes: number
    totalContracts: number
  } | null
}

export function SalesOverview({ stats }: SalesOverviewProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4 text-indigo-500" />
          销售概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground mb-1">销售总额</p>
              <p className="text-xl font-bold text-emerald-600">
                {formatCurrency(stats.totalAmount)}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-lg border">
                <p className="text-lg font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">客户</p>
              </div>
              <div className="text-center p-2 rounded-lg border">
                <p className="text-lg font-bold">{stats.totalQuotes}</p>
                <p className="text-xs text-muted-foreground">报价</p>
              </div>
              <div className="text-center p-2 rounded-lg border">
                <p className="text-lg font-bold">{stats.totalContracts}</p>
                <p className="text-xs text-muted-foreground">合同</p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState variant="data" title="暂无销售数据" description="销售统计数据未加载" />
        )}
      </CardContent>
    </Card>
  )
}
