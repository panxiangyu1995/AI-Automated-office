import { Package, AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { InventoryDetailItem } from '../types/inventory';

interface InventoryDetailProps {
  item: InventoryDetailItem | null;
  onClose?: () => void;
}

export function InventoryDetail({ item }: InventoryDetailProps) {
  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        选择商品查看详情
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'excess':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low':
        return '库存不足';
      case 'excess':
        return '库存过剩';
      default:
        return '正常';
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">{item.product_name}</h3>
            <p className="text-sm text-muted-foreground">{item.sku}</p>
          </div>
        </div>
        <Badge className={getStatusColor(item.stock_status)}>{getStatusText(item.stock_status)}</Badge>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        <Tabs defaultValue="info">
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">基本信息</TabsTrigger>
            <TabsTrigger value="stock" className="flex-1">库存信息</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品名称</span>
                  <span className="font-medium">{item.product_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU编码</span>
                  <span className="font-mono text-sm">{item.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品分类</span>
                  <Badge variant="outline">{item.category}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">仓库</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.warehouse_name}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">库存数量</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">当前库存</span>
                  <span className="text-2xl font-bold">{item.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">可用数量</span>
                  <span className="text-xl font-semibold text-green-600">{item.available_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">预留数量</span>
                  <span className="text-muted-foreground">{item.reserved_quantity}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">库存阈值</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最小库存</span>
                  <span className="text-amber-600 font-medium">{item.min_stock}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">最大库存</span>
                  <span className="text-blue-600 font-medium">{item.max_stock}</span>
                </div>
                {item.stock_status === 'low' && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-800">
                      库存不足，建议尽快补货
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
