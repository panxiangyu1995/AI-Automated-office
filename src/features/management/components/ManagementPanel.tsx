/**
 * 管理层看板组件
 */

import { useEffect } from 'react'
import { Users, FileCheck, Package, AlertTriangle, TrendingUp, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useManagementStore } from '../stores/managementStore'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(n)
}

export function ManagementPanel() {
  const { dashboard, warnings, isLoading, fetchAll } = useManagementStore()

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">管理驾驶舱</h2>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {dashboard && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500"/><div className="text-2xl font-bold">{dashboard.totalEmployees}</div></div>
              <p className="text-xs text-muted-foreground">员工总数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500"/><div className="text-2xl font-bold">{formatCurrency(dashboard.totalSales)}</div></div>
              <p className="text-xs text-muted-foreground">销售额</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-yellow-500"/><div className="text-2xl font-bold">{dashboard.pendingApprovals}</div></div>
              <p className="text-xs text-muted-foreground">待审批</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2"><Package className="h-5 w-5 text-orange-500"/><div className="text-2xl font-bold">{dashboard.pendingInventory}</div></div>
              <p className="text-xs text-muted-foreground">待入库</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="warnings">
        <TabsList>
          <TabsTrigger value="warnings">预警中心</TabsTrigger>
          <TabsTrigger value="summary">经营汇总</TabsTrigger>
        </TabsList>

        <TabsContent value="warnings">
          {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <div className="space-y-2">
              {warnings.length === 0 ? <div className="text-center py-8 text-muted-foreground">暂无预警</div> :
              warnings.map((w) => (
                <Card key={w.id}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${w.level === 'critical' ? 'text-red-500' : w.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}/>
                    <div>
                      <div className="font-medium">{w.title}</div>
                      <div className="text-sm text-muted-foreground">{w.description}</div>
                    </div>
                    <div className="ml-auto text-sm text-muted-foreground">{w.source}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summary">
          {dashboard && (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">应收总额</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(dashboard.totalReceivable)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">应付总额</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(dashboard.totalPayable)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">客户总数</div>
                  <div className="text-xl font-bold">{dashboard.totalCustomers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-sm text-muted-foreground">合同总数</div>
                  <div className="text-xl font-bold">{dashboard.totalContracts}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
