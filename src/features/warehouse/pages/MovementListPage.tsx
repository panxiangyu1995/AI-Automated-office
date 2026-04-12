import { useState, useEffect } from 'react';
import { ArrowDownRight, ArrowUpRight, ClipboardList, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MovementItem {
  id: string;
  type: 'inbound' | 'outbound' | 'stocktaking' | 'adjustment';
  refType: string;
  refId: string;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  remark?: string;
  createdBy: string;
  createdAt: number;
}

export function MovementListPage() {
  const [movements, setMovements] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const mockData: MovementItem[] = [
      {
        id: 'mov-001',
        type: 'inbound',
        refType: 'purchase',
        refId: 'IN-20240115-001',
        productId: 'prod-001',
        productName: '联想ThinkPad笔记本',
        locationId: 'loc-001',
        locationName: 'A区01货架01位',
        quantity: 10,
        beforeQuantity: 5,
        afterQuantity: 15,
        createdBy: 'admin',
        createdAt: 1705312800,
      },
      {
        id: 'mov-002',
        type: 'outbound',
        refType: 'sale',
        refId: 'OUT-20240115-001',
        productId: 'prod-002',
        productName: '罗技无线鼠标',
        locationId: 'loc-002',
        locationName: 'A区01货架02位',
        quantity: -5,
        beforeQuantity: 10,
        afterQuantity: 5,
        createdBy: 'admin',
        createdAt: 1705312900,
      },
      {
        id: 'mov-003',
        type: 'stocktaking',
        refType: 'stocktaking',
        refId: 'ST-20240114-001',
        productId: 'prod-003',
        productName: 'Dell显示器27寸',
        locationId: 'loc-003',
        locationName: 'B区02货架01位',
        quantity: -2,
        beforeQuantity: 47,
        afterQuantity: 45,
        remark: '盘点差异，已调整',
        createdBy: 'admin',
        createdAt: 1705226400,
      },
      {
        id: 'mov-004',
        type: 'inbound',
        refType: 'return',
        refId: 'IN-20240114-001',
        productId: 'prod-001',
        productName: '联想ThinkPad笔记本',
        locationId: 'loc-001',
        locationName: 'A区01货架01位',
        quantity: 3,
        beforeQuantity: 2,
        afterQuantity: 5,
        createdBy: 'admin',
        createdAt: 1705136400,
      },
    ];
    setMovements(mockData);
    setLoading(false);
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'inbound':
        return <Badge className="bg-green-100 text-green-800 border-green-200">入库</Badge>;
      case 'outbound':
        return <Badge variant="destructive">出库</Badge>;
      case 'stocktaking':
        return <Badge variant="secondary">盘点</Badge>;
      case 'adjustment':
        return <Badge variant="outline">调整</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getQuantityDisplay = (qty: number) => {
    if (qty > 0) {
      return <span className="text-green-600 font-medium">+{qty}</span>;
    } else if (qty < 0) {
      return <span className="text-red-600 font-medium">{qty}</span>;
    }
    return <span className="text-muted-foreground">{qty}</span>;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMovements = movements.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (keyword && !m.productName.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const totalInbound = movements.filter(m => m.type === 'inbound').reduce((sum, m) => sum + m.quantity, 0);
  const totalOutbound = Math.abs(movements.filter(m => m.type === 'outbound').reduce((sum, m) => sum + m.quantity, 0));
  const netChange = totalInbound - totalOutbound;

  const handleExport = () => {
    const csv = [
      ['时间', '类型', '商品', '库位', '数量', '变动前', '变动后', '备注'].join(','),
      ...filteredMovements.map(m => [
        formatDate(m.createdAt),
        m.type,
        m.productName,
        m.locationName,
        m.quantity,
        m.beforeQuantity,
        m.afterQuantity,
        m.remark || '',
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_movements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">库存流水</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
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
        <Card className={netChange >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${netChange >= 0 ? 'text-green-800' : 'text-red-800'}`}>净变动</CardTitle>
            <ClipboardList className={`h-4 w-4 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {netChange >= 0 ? '+' : ''}{netChange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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

      {/* Table */}
      <div className="flex-1 border rounded-lg">
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  暂无流水记录
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{getTypeBadge(item.type)}</TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.locationName}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {item.refId}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {getQuantityDisplay(item.quantity)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.beforeQuantity}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.afterQuantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(item.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
