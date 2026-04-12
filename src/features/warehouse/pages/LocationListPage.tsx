import { useState, useEffect } from 'react';
import { MapPin, Package, Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LocationItem {
  id: string;
  code: string;
  name: string;
  zone: string;
  capacity: number;
  currentCount: number;
  status: 'available' | 'full' | 'disabled';
}

export function LocationListPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formZone, setFormZone] = useState('');

  useEffect(() => {
    const mockData: LocationItem[] = [
      { id: 'loc-001', code: 'A-01-01', name: 'A区01货架01位', zone: 'A区', capacity: 50, currentCount: 15, status: 'available' },
      { id: 'loc-002', code: 'A-01-02', name: 'A区01货架02位', zone: 'A区', capacity: 100, currentCount: 5, status: 'available' },
      { id: 'loc-003', code: 'B-02-01', name: 'B区02货架01位', zone: 'B区', capacity: 30, currentCount: 45, status: 'available' },
      { id: 'loc-004', code: 'C-01-01', name: 'C区01货架01位', zone: 'C区', capacity: 20, currentCount: 20, status: 'full' },
    ];
    setLocations(mockData);
    setLoading(false);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">可用</Badge>;
      case 'full':
        return <Badge variant="secondary">已满</Badge>;
      case 'disabled':
        return <Badge variant="outline">已禁用</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getOccupancyRate = (current: number, capacity: number) => {
    return Math.round((current / capacity) * 100);
  };

  const zones = [...new Set(locations.map(l => l.zone))];
  const availableCount = locations.filter(l => l.status === 'available').length;
  const fullCount = locations.filter(l => l.status === 'full').length;

  const handleOpenDialog = (location?: LocationItem) => {
    if (location) {
      setEditingLocation(location);
      setFormCode(location.code);
      setFormName(location.name);
      setFormZone(location.zone);
    } else {
      setEditingLocation(null);
      setFormCode('');
      setFormName('');
      setFormZone('A区');
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editingLocation) {
      setLocations(locations.map(l => 
        l.id === editingLocation.id 
          ? { ...l, code: formCode, name: formName, zone: formZone }
          : l
      ));
    } else {
      const newLocation: LocationItem = {
        id: `loc-${Date.now()}`,
        code: formCode,
        name: formName,
        zone: formZone,
        capacity: 50,
        currentCount: 0,
        status: 'available',
      };
      setLocations([...locations, newLocation]);
    }
    setDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">库位管理</h1>
        <Button size="sm" onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          新增库位
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总库位数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{locations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">可用库位</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已满库位</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{fullCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">仓库区域</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Zone Filter */}
      <div className="flex items-center gap-4">
        <Label>区域筛选：</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full">全部</Button>
          {zones.map(zone => (
            <Button key={zone} variant="ghost" size="sm" className="rounded-full">
              {zone}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>库位编码</TableHead>
              <TableHead>库位名称</TableHead>
              <TableHead>区域</TableHead>
              <TableHead>容量</TableHead>
              <TableHead>当前数量</TableHead>
              <TableHead>占用率</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  暂无库位
                </TableCell>
              </TableRow>
            ) : (
              locations.map((item) => {
                const occupancy = getOccupancyRate(item.currentCount, item.capacity);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.zone}</Badge>
                    </TableCell>
                    <TableCell>{item.capacity}</TableCell>
                    <TableCell>{item.currentCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${occupancy >= 100 ? 'bg-red-500' : occupancy >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{occupancy}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? '编辑库位' : '新增库位'}</DialogTitle>
            <DialogDescription>填写库位信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">库位编码</Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="如：A-01-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">库位名称</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="如：A区01货架01位"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">区域</Label>
              <Select value={formZone} onValueChange={setFormZone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(z => (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                  <SelectItem value="新增区域">+ 新增区域</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
