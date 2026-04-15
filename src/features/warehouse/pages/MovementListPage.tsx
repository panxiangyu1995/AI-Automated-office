import { useState, useEffect, useCallback } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ClipboardList,
  RefreshCw,
  Download,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { listMovements } from '../api/warehouseApi'
import type { MovementRecord } from '../types/inventory'

export function MovementListPage() {
  const [movements, setMovements] = useState<MovementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [keyword, setKeyword] = useState('')
  const [summary, setSummary] = useState({ total_inbound: 0, total_outbound: 0, net_change: 0 })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listMovements({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        keyword: keyword || undefined,
      })
      setMovements(response.items)
      setSummary(response.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取流水数据失败')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, keyword])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'inbound':
        return <Badge className="bg-green-100 text-green-800 border-green-200">入库</Badge>
      case 'outbound':
        return <Badge variant="destructive">出库</Badge>
      case 'stocktaking':
        return <Badge variant="secondary">盘点</Badge>
      case 'adjustment':
        return <Badge variant="outline">调整</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getQuantityDisplay = (qty: number) => {
    if (qty > 0) return <span className="text-green-600 font-medium">+{qty}</span>
    if (qty < 0) return <span className="text-red-600 font-medium">{qty}</span>
    return <span className="text-muted-foreground">{qty}</span>
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const totalInbound = summary.total_inbound
  const totalOutbound = summary.total_outbound
  const netChange = summary.net_change

  const handleExport = () => {
    const csv = [
      ['时间', '类型', '商品', '库位', '数量', '变动前', '变动后', '备注'].join(','),
      ...movements.map((m) =>
        [
          formatDate(m.created_at),
          m.type,
          m.product_name,
          m.location_name,
          m.quantity,
          m.before_quantity,
          m.after_quantity,
          m.remark || '',
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (error) {
    return (
      <div className="flex flex-col h-full p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">库存流水</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="加载失败"
            description={error}
            icon={AlertTriangle}
            actionLabel="重试"
            onAction={fetchData}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">库存流水</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={movements.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总记录数</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movements.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800">总入库</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">+{totalInbound}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">总出库</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">-{totalOutbound}</div>
          </CardContent>
        </Card>
        <Card
          className={netChange >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle
              className={`text-sm font-medium ${netChange >= 0 ? 'text-green-800' : 'text-red-800'}`}
            >
              净变动
            </CardTitle>
            <ClipboardList
              className={`h-4 w-4 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}
            >
              {netChange >= 0 ? '+' : ''}
              {netChange}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="搜索商品名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>类型：</Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="inbound">入库</SelectItem>
              <SelectItem value="outbound">出库</SelectItem>
              <SelectItem value="stocktaking">盘点</SelectItem>
              <SelectItem value="adjustment">调整</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : movements.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState
              title="暂无流水记录"
              description="库存变动记录将在此处显示"
              icon={ClipboardList}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">类型</TableHead>
                <TableHead>商品名称</TableHead>
                <TableHead>库位</TableHead>
                <TableHead>关联单据</TableHead>
                <TableHead className="text-right">变动数量</TableHead>
                <TableHead className="text-right">变动前</TableHead>
                <TableHead className="text-right">变动后</TableHead>
                <TableHead className="w-[150px]">时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.location_name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {item.ref_id}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getQuantityDisplay(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.before_quantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.after_quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(item.created_at)}
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
