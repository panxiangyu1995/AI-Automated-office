import { useState, useEffect } from 'react';
import { Package, Truck, MapPin, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LogisticsItem {
  id: string;
  trackingNo: string;
  carrier: string;
  outboundId: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'exception';
  currentLocation: string;
  estimatedArrival?: string;
  events: Array<{
    time: string;
    location: string;
    status: string;
    description: string;
  }>;
}

export function LogisticsTrackingPage() {
  const [logistics, setLogistics] = useState<LogisticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchNo, setSearchNo] = useState('');

  useEffect(() => {
    const mockData: LogisticsItem[] = [
      {
        id: 'log-001',
        trackingNo: 'SF1234567890',
        carrier: '顺丰速运',
        outboundId: 'OUT-001',
        status: 'in_transit',
        currentLocation: '北京市海淀区',
        estimatedArrival: '2024-01-20',
        events: [
          {
            time: '2024-01-18 10:30',
            location: '北京市海淀区',
            status: '已揽收',
            description: '快件已收取，正在送往分拨中心',
          },
          {
            time: '2024-01-18 14:20',
            location: '北京分拨中心',
            status: '运输中',
            description: '快件已到达北京分拨中心',
          },
          {
            time: '2024-01-18 18:00',
            location: '北京分拨中心',
            status: '运输中',
            description: '快件已离开北京分拨中心',
          },
        ],
      },
      {
        id: 'log-002',
        trackingNo: 'ZTO9876543210',
        carrier: '中通快递',
        outboundId: 'OUT-002',
        status: 'pending',
        currentLocation: '上海市浦东新区',
        events: [
          {
            time: '2024-01-19 09:00',
            location: '上海市浦东新区',
            status: '待揽收',
            description: '等待快递员揽收',
          },
        ],
      },
      {
        id: 'log-003',
        trackingNo: 'YTO5555555555',
        carrier: '圆通速递',
        outboundId: 'OUT-003',
        status: 'delivered',
        currentLocation: '广州市天河区',
        estimatedArrival: '2024-01-15',
        events: [
          {
            time: '2024-01-13 10:00',
            location: '广州市天河区',
            status: '已签收',
            description: '已签收，签收人：前台',
          },
        ],
      },
    ];
    setLogistics(mockData);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">待揽收</Badge>;
      case 'in_transit':
        return <Badge variant="default">运输中</Badge>;
      case 'delivered':
        return <Badge variant="success">已签收</Badge>;
      case 'exception':
        return <Badge variant="destructive">异常</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      case 'in_transit':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'exception':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const inTransitCount = logistics.filter(l => l.status === 'in_transit').length;
  const pendingCount = logistics.filter(l => l.status === 'pending').length;
  const deliveredCount = logistics.filter(l => l.status === 'delivered').length;

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">物流追踪</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="输入物流单号..."
              value={searchNo}
              onChange={(e) => setSearchNo(e.target.value)}
              className="w-[200px]"
            />
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Table */}
      <div className="flex-1 border rounded-lg">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : logistics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  暂无物流信息
                </TableCell>
              </TableRow>
            ) : (
              logistics.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>{getStatusIcon(item.status)}</TableCell>
                  <TableCell className="font-mono">{item.trackingNo}</TableCell>
                  <TableCell>{item.carrier}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {item.currentLocation}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.estimatedArrival || '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Timeline Preview */}
      {logistics.find(l => l.status === 'in_transit') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">物流动态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logistics
                .filter(l => l.status === 'in_transit')
                .flatMap(l => l.events.slice(0, 1))
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
  );
}
