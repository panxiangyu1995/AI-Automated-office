import { ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'

interface ServiceSummaryProps {
  statistics: {
    total: number
    new: number
    processing: number
    pendingConfirm: number
    completed: number
    cancelled: number
  } | null
}

export function ServiceOverview({ statistics }: ServiceSummaryProps) {
  if (!statistics) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-pink-500" />
            售后概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState variant="data" title="暂无售后数据" description="售后工单统计数据未加载" />
        </CardContent>
      </Card>
    )
  }

  const completionRate = statistics.total > 0
    ? Math.round((statistics.completed / statistics.total) * 100)
    : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-pink-500" />
          售后概览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>工单完成率</span>
            <span className="font-medium">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <div className="space-y-2">
            {[
              { label: '新建', value: statistics.new, color: 'text-blue-500' },
              { label: '处理中', value: statistics.processing, color: 'text-yellow-500' },
              { label: '待确认', value: statistics.pendingConfirm, color: 'text-orange-500' },
              { label: '已完成', value: statistics.completed, color: 'text-green-500' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={cn('font-medium', item.color)}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
