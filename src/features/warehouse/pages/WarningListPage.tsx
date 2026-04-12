import { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, Bell, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface WarningItem {
  id: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  currentQuantity: number;
  minStock: number;
  maxStock: number;
  shortage: number;
  level: 'info' | 'warning' | 'critical';
  type: 'low' | 'high' | 'expiring';
  isRead: boolean;
  isResolved: boolean;
}

export function WarningListPage() {
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockWarnings: WarningItem[] = [
      {
        id: 'warn-001',
        productId: 'prod-002',
        productName: '罗技无线鼠标',
        locationId: 'loc-002',
        locationName: 'A区01货架02位',
        currentQuantity: 5,
        minStock: 50,
        maxStock: 500,
        shortage: 45,
        level: 'critical',
        type: 'low',
        isRead: false,
        isResolved: false,
      },
      {
        id: 'warn-002',
        productId: 'prod-001',
        productName: '联想ThinkPad笔记本',
        locationId: 'loc-001',
        locationName: 'A区01货架01位',
        currentQuantity: 15,
        minStock: 10,
        maxStock: 100,
        shortage: 0,
        level: 'info',
        type: 'low',
        isRead: true,
        isResolved: false,
      },
      {
        id: 'warn-003',
        productId: 'prod-003',
        productName: 'Dell显示器27寸',
        locationId: 'loc-003',
        locationName: 'B区02货架01位',
        currentQuantity: 45,
        minStock: 20,
        maxStock: 80,
        shortage: -35,
        level: 'warning',
        type: 'high',
        isRead: false,
        isResolved: false,
      },
    ];
    setWarnings(mockWarnings);
    setLoading(false);
  }, []);

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">严重</Badge>;
      case 'warning':
        return <Badge variant="secondary">警告</Badge>;
      default:
        return <Badge variant="outline">提示</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'low':
        return '库存不足';
      case 'high':
        return '库存过剩';
      case 'expiring':
        return '临期预警';
      default:
        return type;
    }
  };

  const handleMarkRead = (id: string) => {
    setWarnings(warnings.map(w => w.id === id ? { ...w, isRead: true } : w));
  };

  const handleResolve = (id: string) => {
    setWarnings(warnings.map(w => w.id === id ? { ...w, isResolved: true } : w));
  };

  const unreadCount = warnings.filter(w => !w.isRead).length;
  const criticalCount = warnings.filter(w => w.level === 'critical' && !w.isResolved).length;

  const renderShortage = (shortage: number) => {
    if (shortage > 0) {
      return <span className="text-red-600 font-medium">-{shortage}</span>;
    } else if (shortage < 0) {
      return <span className="text-amber-600 font-medium">+{Math.abs(shortage)}</span>;
    }
    return <span className="text-muted-foreground">-</span>;
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">库存预警</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} 条未读</Badge>
          )}
        </div>
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
              {warnings.filter(w => !w.isResolved).length}
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
              {warnings.filter(w => w.isResolved).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 border rounded-lg">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : warnings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  暂无预警
                </TableCell>
              </TableRow>
            ) : (
              warnings.map((item) => (
                <TableRow
                  key={item.id}
                  className={!item.isRead ? 'bg-muted/30' : ''}
                >
                  <TableCell>{getLevelBadge(item.level)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.locationName}
                  </TableCell>
                  <TableCell className="text-right">{item.currentQuantity}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.minStock}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderShortage(item.shortage)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkRead(item.id)}
                        >
                          标记已读
                        </Button>
                      )}
                      {!item.isResolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResolve(item.id)}
                        >
                          解决
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">补货建议</h4>
              <p className="text-sm text-blue-700 mt-1">
                根据当前预警，建议采购：
                <span className="font-medium">罗技无线鼠标 x50</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
