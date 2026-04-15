import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Plus, Package, FileText, RefreshCw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { OutboundFormDialog } from '../components/OutboundFormDialog'

interface OutboundListItem {
  id: string
  number: string
  outboundType: string
  salesOrderId?: string
  status: string
  createdAt: number
}

export function OutboundListPage() {
  const [outbounds, setOutbounds] = useState<OutboundListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invoke<OutboundListItem[]>('warehouse_list_outbounds')
      setOutbounds(data)
    } catch (error) {
      console.error('Failed to fetch outbounds:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">草稿</Badge>
      case 'submitted':
        return <Badge variant="secondary">已提交</Badge>
      case 'approved':
        return <Badge variant="default">已审批</Badge>
      case 'shipped':
        return <Badge variant="success">已发货</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sale':
        return '销售出库'
      case 'return':
        return '退货出库'
      case 'transfer':
        return '调拨出库'
      case 'damage':
        return '损耗'
      default:
        return type
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">出库管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增出库
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总出库单</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outbounds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outbounds.filter((o) => o.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已发货</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {outbounds.filter((o) => o.status === 'shipped').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : outbounds.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState title="暂无出库单" description="点击新增按钮创建出库单" icon={Package} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>出库单号</TableHead>
                <TableHead>出库类型</TableHead>
                <TableHead>销售订单</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outbounds.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{item.number}</TableCell>
                  <TableCell>{getTypeLabel(item.outboundType)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.salesOrderId || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create Dialog */}
      <OutboundFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchData} />
    </div>
  )
}
