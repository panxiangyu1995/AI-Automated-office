import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, TrendingDown, Bell, CheckCircle2, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listWarnings, markWarningRead, resolveWarning } from '../api/warehouseApi'
import type { InventoryWarning } from '../types/inventory'

export function WarningListPage() {
  const [warnings, setWarnings] = useState<InventoryWarning[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listWarnings()
      setWarnings(response.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取预警数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleMarkRead = async (id: string) => {
    try {
      await markWarningRead(id)
      setWarnings(warnings.map((w) => (w.id === id ? { ...w, is_read: true } : w)))
    } catch (_e) {
      // 错误已忽略：标记已读失败时静默处理
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await resolveWarning(id)
      setWarnings(warnings.map((w) => (w.id === id ? { ...w, is_resolved: true } : w)))
    } catch (_e) {
      // 错误已忽略：解决预警失败时静默处理
    }
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      case 'warning':
        return <Badge variant="secondary">警告</Badge>
      default:
        return <Badge variant="outline">提示</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low':
        return '库存不足'
      case 'high':
        return '库存过剩'
      case 'expiring':
        return '临期预警'
      default:
        return type
    }
  }

  const renderShortage = (shortage: number) => {
    if (shortage > 0) return <span className="text-red-600 font-medium">-{shortage}</span>
    if (shortage < 0)
      return <span className="text-amber-600 font-medium">+{Math.abs(shortage)}</span>
    return <span className="text-muted-foreground">-</span>
  }

  const unreadCount = warnings.filter((w) => !w.is_read).length
  const criticalCount = warnings.filter((w) => w.level === 'critical' && !w.is_resolved).length

  if (error) {
    return (
      <div className="flex flex-col h-full p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">库存预警</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="加载失败"
            description={error}
            icon={AlertTriangle}
            action={{ label: "重试", onClick: fetchData }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">库存预警</h1>
          {unreadCount > 0 && <Badge variant="destructive">{unreadCount} 条未读</Badge>}
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className={criticalCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">严重预警</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理预警</CardTitle>
            <Bell className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warnings.filter((w) => !w.is_resolved).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {warnings.filter((w) => w.is_resolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : warnings.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState title="暂无预警" description="当前没有库存预警信息" icon={CheckCircle2} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">级别</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>商品名称</TableHead>
                <TableHead>库位</TableHead>
                <TableHead className="text-right">当前库存</TableHead>
                <TableHead className="text-right">安全库存</TableHead>
                <TableHead className="text-right">缺口</TableHead>
                <TableHead className="w-[150px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warnings.map((item) => (
                <TableRow key={item.id} className={!item.is_read ? 'bg-muted/30' : ''}>
                  <TableCell>{getLevelBadge(item.level)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.location_name}</TableCell>
                  <TableCell className="text-right">{item.current_quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.min_stock}
                  </TableCell>
                  <TableCell className="text-right">{renderShortage(item.shortage)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!item.is_read && (
                        <Button variant="ghost" size="sm" onClick={() => handleMarkRead(item.id)}>
                          标记已读
                        </Button>
                      )}
                      {!item.is_resolved && (
                        <Button variant="ghost" size="sm" onClick={() => handleResolve(item.id)}>
                          解决
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
