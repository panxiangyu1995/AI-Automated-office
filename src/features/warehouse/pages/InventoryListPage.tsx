import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Search, Package, TrendingDown, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import type { InventoryDetailItem, WarehouseStats } from '../types/inventory'

interface InventoryListPageProps {
  onItemSelect?: (item: InventoryDetailItem) => void
}

export function InventoryListPage({ onItemSelect }: InventoryListPageProps) {
  const [items, setItems] = useState<InventoryDetailItem[]>([])
  const [stats, setStats] = useState<WarehouseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [stockStatus, setStockStatus] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await invoke<{
        items: InventoryDetailItem[]
        total: number
        categories: string[]
      }>('warehouse_list_inventory_detail', {
        request: {
          page,
          page_size: 10,
          keyword: keyword || null,
          category: category !== 'all' ? category : null,
          stock_status: stockStatus !== 'all' ? stockStatus : null,
        },
      })
      setItems(response.items)
      setTotal(response.total)
      setCategories(response.categories)
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setLoading(false)
    }
  }, [page, keyword, category, stockStatus])

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await invoke<WarehouseStats>('warehouse_get_stats')
      setStats(statsData)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [fetchData, fetchStats])

  const getStockIcon = (status: string) => {
    switch (status) {
      case 'low':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'excess':
        return <TrendingUp className="h-4 w-4 text-amber-500" />
      default:
        return <Package className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">库存查询</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchData()
            fetchStats()
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总商品数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_inventory ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">库存不足</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.low_stock_count ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待入库</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_inbound ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">待出库</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_outbound ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称/SKU..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="商品分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockStatus} onValueChange={setStockStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="库存状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="low">库存不足</SelectItem>
            <SelectItem value="normal">正常</SelectItem>
            <SelectItem value="excess">库存过剩</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState title="暂无库存" description="入库后库存数据将在此处显示" icon={Package} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">状态</TableHead>
                <TableHead>商品名称</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>分类</TableHead>
                <TableHead className="text-right">库存数量</TableHead>
                <TableHead className="text-right">可用数量</TableHead>
                <TableHead className="text-right">预留数量</TableHead>
                <TableHead>仓库</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onItemSelect?.(item)}
                >
                  <TableCell>{getStockIcon(item.stock_status)}</TableCell>
                  <TableCell className="font-medium">{item.product_name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.available_quantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.reserved_quantity}
                  </TableCell>
                  <TableCell>{item.warehouse_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          共 {total} 条记录，第 {page} 页
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 10 >= total}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
