/**
 * 仓储面板组件
 */

import { useEffect } from 'react'
import { Package, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWarehouseStore } from '../stores/warehouseStore'

function formatNumber(n: number) { return n.toFixed(0) }

export function WarehousePanel() {
  const { inbounds, outbounds, inventory, stats, isLoading, fetchAll } = useWarehouseStore()

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">仓储中心</h2>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-500"/><div className="text-2xl font-bold">{stats.totalInventory}</div></div>
            <p className="text-xs text-muted-foreground">商品种类</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2"><ArrowDownToLine className="h-5 w-5 text-green-500"/><div className="text-2xl font-bold">{stats.pendingInbound}</div></div>
            <p className="text-xs text-muted-foreground">待入库</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2"><ArrowUpFromLine className="h-5 w-5 text-orange-500"/><div className="text-2xl font-bold">{stats.pendingOutbound}</div></div>
            <p className="text-xs text-muted-foreground">待出库</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4">
            <div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500"/><div className="text-2xl font-bold">{stats.lowStockCount}</div></div>
            <p className="text-xs text-muted-foreground">低库存预警</p>
          </CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">库存</TabsTrigger>
          <TabsTrigger value="inbound">入库单</TabsTrigger>
          <TabsTrigger value="outbound">出库单</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <div className="space-y-2">
              {inventory.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3"><Package className="h-5 w-5 text-muted-foreground"/>
                      <div><div className="font-medium">{item.productName}</div><div className="text-sm text-muted-foreground">SKU: {item.productId}</div></div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatNumber(item.availableQuantity)}</div>
                      <div className="text-sm text-muted-foreground">可用库存</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inbound">
          {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <div className="space-y-2">
              {inbounds.length === 0 ? <div className="text-center py-8 text-muted-foreground">暂无入库单</div> :
              inbounds.map((o) => (
                <Card key={o.id}><CardContent className="p-4 flex items-center justify-between">
                  <div><div className="font-medium">{o.number}</div><div className="text-sm text-muted-foreground">{o.inboundType}</div></div>
                  <div className="text-right"><div className="text-sm text-muted-foreground">{new Date(o.createdAt*1000).toLocaleDateString()}</div><div className="text-sm font-medium">{o.status}</div></div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="outbound">
          {isLoading ? <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin"/></div> : (
            <div className="space-y-2">
              {outbounds.length === 0 ? <div className="text-center py-8 text-muted-foreground">暂无出库单</div> :
              outbounds.map((o) => (
                <Card key={o.id}><CardContent className="p-4 flex items-center justify-between">
                  <div><div className="font-medium">{o.number}</div><div className="text-sm text-muted-foreground">{o.outboundType}</div></div>
                  <div className="text-right"><div className="text-sm text-muted-foreground">{new Date(o.createdAt*1000).toLocaleDateString()}</div><div className="text-sm font-medium">{o.status}</div></div>
                </CardContent></Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
