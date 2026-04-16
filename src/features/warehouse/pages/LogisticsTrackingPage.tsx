import { useState, useEffect, useCallback } from 'react'
import { Package, Truck, MapPin, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { listLogistics } from '../api/warehouseApi'
import type { LogisticsRecord, LogisticsStatus } from '../types/inventory'

export function LogisticsTrackingPage() {
  const [logistics, setLogistics] = useState<LogisticsRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchNo, setSearchNo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listLogistics()
      setLogistics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取物流数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadge = (status: LogisticsStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">待揽收</Badge>
      case 'in_transit':
        return <Badge variant="default">运输中</Badge>
      case 'delivered':
        return <Badge variant="success">已签收</Badge>
      case 'exception':
        return <Badge variant="destructive">异常</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'exception':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />
    }
  }

  const inTransitCount = logistics.filter((l) => l.status === 'in_transit').length
  const pendingCount = logistics.filter((l) => l.status === 'pending').length
  const deliveredCount = logistics.filter((l) => l.status === 'delivered').length

  if (error) {
    return (
      <div className="flex flex-col h-full p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">物流追踪</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="加载失败"
            description={error}
            icon={AlertCircle}
            action={{ label: "重试", onClick: fetchData }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">物流追踪</h1>
        <div className="flex items-center gap-2">
          <Input
            placeholder="输入物流单号..."
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            className="w-[200px]"
          />
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总运单</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logistics.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待揽收</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">运输中</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inTransitCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已签收</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveredCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : logistics.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState
              title="暂无物流信息"
              description="出库发货后物流信息将在此处显示"
              icon={Package}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>状态</TableHead>
                <TableHead>物流单号</TableHead>
                <TableHead>物流公司</TableHead>
                <TableHead>当前位置</TableHead>
                <TableHead>预计到达</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logistics.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{getStatusIcon(item.status)}</TableCell>
                  <TableCell className="font-mono">{item.tracking_no}</TableCell>
                  <TableCell>{item.carrier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {item.current_location}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.estimated_arrival || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {logistics.find((l) => l.status === 'in_transit') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">物流动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logistics
                .filter((l) => l.status === 'in_transit')
                .flatMap((l) => l.events.slice(0, 1))
                .map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1">
                      <Truck className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{event.status}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.time} · {event.location}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
