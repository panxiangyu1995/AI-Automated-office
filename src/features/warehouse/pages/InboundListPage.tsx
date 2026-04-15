import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Plus, Package, FileText, RefreshCw } from 'lucide-react'
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
import { InboundFormDialog } from '../components/InboundFormDialog'

interface InboundListItem {
  id: string
  number: string
  inboundType: string
  status: string
  createdAt: number
}

export function InboundListPage() {
  const [inbounds, setInbounds] = useState<InboundListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await invoke<InboundListItem[]>('warehouse_list_inbounds')
      setInbounds(data)
    } catch (error) {
      console.error('Failed to fetch inbounds:', error)
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
      case 'completed':
        return <Badge variant="success">已完成</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return '采购入库'
      case 'return':
        return '退货入库'
      case 'transfer':
        return '调拨入库'
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
        <h1 className="text-2xl font-bold">入库管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增入库
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总入库单</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inbounds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inbounds.filter((i) => i.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inbounds.filter((i) => i.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : inbounds.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState title="暂无入库单" description="点击新增按钮创建入库单" icon={Package} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>入库单号</TableHead>
                <TableHead>入库类型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inbounds.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">{item.number}</TableCell>
                  <TableCell>{getTypeLabel(item.inboundType)}</TableCell>
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
      <InboundFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchData} />
    </div>
  )
}
