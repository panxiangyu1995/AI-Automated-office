import { useState, useEffect, useCallback } from 'react'
import { MapPin, Package, Plus, Edit, Trash2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TableSkeleton } from '@/components/ui/loading-skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { listLocations, createLocation, updateLocation } from '../api/warehouseApi'
import type { Location } from '../types/inventory'

export function LocationListPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formZone, setFormZone] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listLocations()
      setLocations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取库位数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">可用</Badge>
      case 'full':
        return <Badge variant="secondary">已满</Badge>
      case 'disabled':
        return <Badge variant="outline">已禁用</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getOccupancyRate = (current: number, capacity: number) => {
    return capacity > 0 ? Math.round((current / capacity) * 100) : 0
  }

  const zones = [...new Set(locations.map((l) => l.zone))]
  const availableCount = locations.filter((l) => l.status === 'available').length
  const fullCount = locations.filter((l) => l.status === 'full').length

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormCode(location.code)
      setFormName(location.name)
      setFormZone(location.zone)
    } else {
      setEditingLocation(null)
      setFormCode('')
      setFormName('')
      setFormZone('A区')
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (editingLocation) {
        await updateLocation(editingLocation.id, { code: formCode, name: formName, zone: formZone })
      } else {
        await createLocation({ code: formCode, name: formName, zone: formZone })
      }
      setDialogOpen(false)
      fetchData()
    } catch (_e) {
      // 错误已忽略：创建库位失败时静默处理
    }
  }

  if (error) {
    return (
      <div className="flex flex-col h-full p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">库位管理</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="加载失败"
            description={error}
            icon={AlertTriangle}
            action={{ label: "重试", onClick: fetchData }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full p-6 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">库位管理</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            新增库位
          </Button>
        </div>
      </div>

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

      <div className="flex items-center gap-4">
        <Label>区域筛选：</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full">
            全部
          </Button>
          {zones.map((zone) => (
            <Button key={zone} variant="ghost" size="sm" className="rounded-full">
              {zone}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-auto">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : locations.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <EmptyState title="暂无库位" description="点击新增按钮添加库位" icon={MapPin} />
          </div>
        ) : (
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
              {locations.map((item) => {
                const occupancy = getOccupancyRate(item.current_count, item.capacity)
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.zone}</Badge>
                    </TableCell>
                    <TableCell>{item.capacity}</TableCell>
                    <TableCell>{item.current_count}</TableCell>
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
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

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
                  {zones.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                  <SelectItem value="新增区域">+ 新增区域</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} className="bg-[var(--ao-button.background)] hover:bg-[var(--ao-button.background)]/90">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
