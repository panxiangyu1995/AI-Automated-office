import { useMemo, useState, useCallback } from 'react'
import {
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  CheckSquare,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardSkeleton } from '@/components/ui/loading-skeleton'
import { useManagementStore } from '@/features/management/stores/managementStore'
import { useFinanceStore, useFinanceStats } from '@/features/finance/stores/financeStore'
import { useApprovalStore, useApprovalStats } from '@/features/approval/stores/approvalStore'
import { useSalesStore } from '@/features/sales/stores/salesStore'
import { useServiceStore } from '@/features/service/stores/serviceStore'
import { StatCard } from './StatCard'
import { ApprovalOverview } from './ApprovalOverview'
import { ServiceOverview } from './ServiceOverview'
import { WarningOverview } from './WarningOverview'
import { FinanceOverview } from './FinanceOverview'
import { SalesOverview } from './SalesOverview'
import { useAutoRefresh, formatTimeSince } from '@/hooks/useAutoRefresh'

function formatCurrency(n: number) {
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(1)}亿`
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`
  return `¥${n.toLocaleString()}`
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

  // 组合刷新函数
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchAll(),
      fetchSalesStats(),
      fetchFinanceStats(),
      fetchApprovalStats(),
      fetchServiceStatistics(),
    ]);
  }, [fetchAll, fetchSalesStats, fetchFinanceStats, fetchApprovalStats, fetchServiceStatistics]);

  // 自动刷新Hook
  const [autoRefreshConfig, _setAutoRefreshConfig] = useState({ enabled: true, interval: 30000 });
  const { isRefreshing, lastRefreshTime, refresh } = useAutoRefresh({
    enabled: autoRefreshConfig.enabled,
    interval: autoRefreshConfig.interval,
    onRefresh: refreshAll,
  });

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
          <p className="text-sm text-muted-foreground">
            各部门关键指标概览
            {autoRefreshConfig.enabled && (
              <span className="ml-2 text-xs text-muted-foreground/60">
                ({formatTimeSince(lastRefreshTime)})
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {autoRefreshConfig.enabled && (
            <span className="text-xs text-muted-foreground">
              每{Math.round(autoRefreshConfig.interval / 1000)}秒
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refresh()}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
        </div>
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
        <ApprovalOverview stats={approvalStats} />
        <ServiceOverview statistics={serviceStatistics} />
        <WarningOverview warnings={recentWarnings} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FinanceOverview stats={financeStats} />
        <SalesOverview stats={salesStats ?? null} />
      </div>
    </div>
  )
}
