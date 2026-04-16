import { useEffect, useMemo } from 'react'
import {
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  ShoppingBag,
  Package,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { useManagementStore } from '@/features/management/stores/managementStore'
import { useFinanceStore, useFinanceStats } from '@/features/finance/stores/financeStore'
import { useApprovalStore, useApprovalStats } from '@/features/approval/stores/approvalStore'
import { useSalesStore } from '@/features/sales/stores/salesStore'
import { useServiceStore } from '@/features/service/stores/serviceStore'

function formatCurrency(n: number) {
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`
  return `¥${n.toLocaleString()}`
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color: string
  bgColor: string
}

function StatCard({ title, value, icon, trend, color, bgColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-lg', bgColor)}>
            <span className={color}>{icon}</span>
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {trend.value >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span className={trend.value >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

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

function ServiceSummary({ statistics }: ServiceSummaryProps) {
  if (!statistics) return <EmptyState variant="data" title="暂无售后数据" description="售后工单统计数据未加载" />

  const completionRate = statistics.total > 0
    ? Math.round((statistics.completed / statistics.total) * 100)
    : 0

  return (
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
  )
}

export function DashboardHome() {
  const { dashboard, warnings, isLoading: mgmtLoading, fetchAll } = useManagementStore()
  const financeStats = useFinanceStats()
  const approvalStats = useApprovalStats()
  const salesStats = useSalesStore((s) => s.stats)
  const serviceStatistics = useServiceStore((s) => s.statistics)
  const fetchSalesStats = useSalesStore((s) => s.fetchStats)
  const fetchFinanceStats = useFinanceStore((s) => s.fetchStats)
  const fetchApprovalStats = useApprovalStore((s) => s.fetchStats)
  const fetchServiceStatistics = useServiceStore((s) => s.fetchStatistics)

  useEffect(() => {
    fetchAll()
    fetchSalesStats()
    fetchFinanceStats()
    fetchApprovalStats()
    fetchServiceStatistics()
  }, [fetchAll, fetchSalesStats, fetchFinanceStats, fetchApprovalStats, fetchServiceStatistics])

  const isLoading = mgmtLoading && !dashboard

  const recentWarnings = useMemo(() => warnings.slice(0, 5), [warnings])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">企业驾驶舱</h2>
          <p className="text-sm text-muted-foreground">各部门关键指标概览</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchAll(); fetchSalesStats(); fetchFinanceStats(); fetchApprovalStats(); fetchServiceStatistics(); }}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="员工总数"
          value={dashboard?.totalEmployees ?? '-'}
          icon={<Users className="h-4 w-4" />}
          color="text-blue-500"
          bgColor="bg-blue-100 dark:bg-blue-900"
        />
        <StatCard
          title="客户总数"
          value={dashboard?.totalCustomers ?? salesStats?.totalCustomers ?? '-'}
          icon={<TrendingUp className="h-4 w-4" />}
          color="text-green-500"
          bgColor="bg-green-100 dark:bg-green-900"
        />
        <StatCard
          title="销售总额"
          value={dashboard?.totalSales ? formatCurrency(dashboard.totalSales) : salesStats?.totalAmount ? formatCurrency(salesStats.totalAmount) : '-'}
          icon={<DollarSign className="h-4 w-4" />}
          color="text-emerald-500"
          bgColor="bg-emerald-100 dark:bg-emerald-900"
        />
        <StatCard
          title="合同总数"
          value={dashboard?.totalContracts ?? salesStats?.totalContracts ?? '-'}
          icon={<FileText className="h-4 w-4" />}
          color="text-purple-500"
          bgColor="bg-purple-100 dark:bg-purple-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="待审批"
          value={dashboard?.pendingApprovals ?? approvalStats?.pending ?? '-'}
          icon={<CheckSquare className="h-4 w-4" />}
          color="text-yellow-500"
          bgColor="bg-yellow-100 dark:bg-yellow-900"
        />
        <StatCard
          title="应收总额"
          value={financeStats?.totalReceivable ? formatCurrency(financeStats.totalReceivable) : dashboard?.totalReceivable ? formatCurrency(dashboard.totalReceivable) : '-'}
          icon={<ArrowUpRight className="h-4 w-4" />}
          color="text-cyan-500"
          bgColor="bg-cyan-100 dark:bg-cyan-900"
        />
        <StatCard
          title="应付总额"
          value={financeStats?.totalPayable ? formatCurrency(financeStats.totalPayable) : dashboard?.totalPayable ? formatCurrency(dashboard.totalPayable) : '-'}
          icon={<ArrowDownRight className="h-4 w-4" />}
          color="text-orange-500"
          bgColor="bg-orange-100 dark:bg-orange-900"
        />
        <StatCard
          title="售后工单"
          value={serviceStatistics?.total ?? '-'}
          icon={<ShoppingBag className="h-4 w-4" />}
          color="text-pink-500"
          bgColor="bg-pink-100 dark:bg-pink-900"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-yellow-500" />
              审批概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            {approvalStats ? (
              <ApprovalProgress
                pending={approvalStats.pending}
                approved={approvalStats.approved}
                rejected={approvalStats.rejected}
                total={approvalStats.total}
              />
            ) : (
              <EmptyState variant="data" title="暂无审批数据" description="审批统计数据未加载" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-pink-500" />
              售后概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceSummary statistics={serviceStatistics} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              预警信息
              {recentWarnings.length > 0 && (
                <Badge variant="secondary" className="ml-auto">{recentWarnings.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentWarnings.length === 0 ? (
              <EmptyState variant="default" title="暂无预警" description="系统运行正常" />
            ) : (
              <div className="space-y-2">
                {recentWarnings.map((w) => (
                  <div key={w.id} className="flex items-start gap-2 p-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{w.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{w.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{w.warningType}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              财务概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financeStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-xs text-muted-foreground mb-1">应收总额</p>
                    <p className="text-lg font-bold text-cyan-600">
                      {formatCurrency(financeStats.totalReceivable)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-xs text-muted-foreground mb-1">应付总额</p>
                    <p className="text-lg font-bold text-orange-600">
                      {formatCurrency(financeStats.totalPayable)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">发票总数</span>
                    <span className="font-medium">{financeStats.totalInvoices}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <span className="text-sm text-muted-foreground">待处理</span>
                    <span className="font-medium text-yellow-600">{financeStats.pendingCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState variant="data" title="暂无财务数据" description="财务统计数据未加载" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-500" />
              销售概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesStats ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground mb-1">销售总额</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatCurrency(salesStats.totalAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg border">
                    <p className="text-lg font-bold">{salesStats.totalCustomers}</p>
                    <p className="text-xs text-muted-foreground">客户</p>
                  </div>
                  <div className="text-center p-2 rounded-lg border">
                    <p className="text-lg font-bold">{salesStats.totalQuotes}</p>
                    <p className="text-xs text-muted-foreground">报价</p>
                  </div>
                  <div className="text-center p-2 rounded-lg border">
                    <p className="text-lg font-bold">{salesStats.totalContracts}</p>
                    <p className="text-xs text-muted-foreground">合同</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState variant="data" title="暂无销售数据" description="销售统计数据未加载" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
