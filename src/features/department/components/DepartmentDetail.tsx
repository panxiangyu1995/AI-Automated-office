/**
 * 部门详情组件
 * Task 146 - 部门模块基础框架
 */

import { useEffect, useState } from 'react'
import {
  X,
  Users,
  FileCheck,
  TrendingUp,
  Wallet,
  Package,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Wrench,
  BookOpen,
  Route,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDepartmentStore } from '../stores/departmentStore'
import type { DepartmentStatus } from '../types/department'

// 部门图标映射
const DEPARTMENT_ICON_MAP: Record<string, typeof Users> = {
  hr: Users,
  approval: FileCheck,
  sales: TrendingUp,
  finance: Wallet,
  warehouse: Package,
  management: BarChart3,
}

// 状态颜色映射
const STATUS_COLORS: Record<DepartmentStatus, string> = {
  active: 'bg-green-500',
  inactive: 'bg-gray-400',
  loading: 'bg-yellow-500',
  unloading: 'bg-orange-500',
  error: 'bg-red-500',
}

// 状态文本映射
const STATUS_TEXT: Record<DepartmentStatus, string> = {
  active: '已启用',
  inactive: '未启用',
  loading: '加载中',
  unloading: '卸载中',
  error: '错误',
}

interface DepartmentDetailProps {
  departmentId: string | null
  onClose: () => void
}

export function DepartmentDetail({
  departmentId,
  onClose,
}: DepartmentDetailProps) {
  const {
    selectedDepartment,
    isLoadingDetail,
    fetchDepartmentDetail,
    enableDepartment,
    disableDepartment,
    isEnabling,
    isDisabling,
  } = useDepartmentStore()

  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (departmentId) {
      fetchDepartmentDetail(departmentId)
    }
  }, [departmentId, fetchDepartmentDetail])

  if (!departmentId) return null

  const dept = selectedDepartment?.department
  const Icon = dept ? (DEPARTMENT_ICON_MAP[dept.code] || Users) : Users

  const handleToggleStatus = () => {
    if (!departmentId) return
    if (dept?.status === 'active') {
      disableDepartment(departmentId)
    } else {
      enableDepartment(departmentId)
    }
  }

  return (
    <Dialog open={!!departmentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {dept ? (
              <>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span>{dept.name}</span>
                <Badge
                  variant="outline"
                  className={`${STATUS_COLORS[dept.status]} text-white border-0`}
                >
                  {STATUS_TEXT[dept.status]}
                </Badge>
              </>
            ) : (
              <span>部门详情</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoadingDetail ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : dept ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <Info className="h-4 w-4 mr-1" />
                概览
              </TabsTrigger>
              <TabsTrigger value="capabilities">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                能力
              </TabsTrigger>
              <TabsTrigger value="tools">
                <Wrench className="h-4 w-4 mr-1" />
                工具
              </TabsTrigger>
              <TabsTrigger value="routes">
                <Route className="h-4 w-4 mr-1" />
                路由
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      部门代码
                    </h4>
                    <p className="font-mono">{dept.code}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      版本
                    </h4>
                    <p>v{dept.version}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      描述
                    </h4>
                    <p>{dept.description || '暂无描述'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">
                      依赖部门
                    </h4>
                    {dept.dependencies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dept.dependencies.map((dep) => (
                          <Badge key={dep} variant="secondary">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">无依赖</p>
                    )}
                  </div>
                  {dept.loadedAt && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">
                        加载时间
                      </h4>
                      <p>{new Date(dept.loadedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="capabilities" className="space-y-3">
                {selectedDepartment?.capabilities &&
                selectedDepartment.capabilities.length > 0 ? (
                  selectedDepartment.capabilities.map((cap) => (
                    <div
                      key={cap.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{cap.name}</h4>
                        {cap.enabled && (
                          <Badge variant="outline" className="bg-green-500/10">
                            已启用
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cap.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        类型: {cap.capabilityType}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    暂无能力定义
                  </p>
                )}
              </TabsContent>

              <TabsContent value="tools" className="space-y-3">
                {selectedDepartment?.tools &&
                selectedDepartment.tools.length > 0 ? (
                  selectedDepartment.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-mono font-medium">{tool.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tool.description}
                      </p>
                      {tool.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tool.permissions.map((perm) => (
                            <Badge
                              key={perm}
                              variant="secondary"
                              className="text-xs"
                            >
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    暂无工具定义
                  </p>
                )}
              </TabsContent>

              <TabsContent value="routes" className="space-y-3">
                {selectedDepartment?.routes &&
                selectedDepartment.routes.length > 0 ? (
                  selectedDepartment.routes.map((route) => (
                    <div
                      key={route.path}
                      className="p-3 border rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{route.name}</h4>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-mono text-muted-foreground">
                        {route.path}
                      </p>
                      {route.permissions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {route.permissions.map((perm) => (
                            <Badge
                              key={perm}
                              variant="outline"
                              className="text-xs"
                            >
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-muted-foreground">
                    暂无路由定义
                  </p>
                )}
              </TabsContent>
            </ScrollArea>

            <div className="flex-shrink-0 flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-1" />
                关闭
              </Button>
              <Button
                variant={dept.status === 'active' ? 'destructive' : 'default'}
                onClick={handleToggleStatus}
                disabled={isEnabling || isDisabling}
              >
                {isEnabling || isDisabling ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : dept.status === 'active' ? (
                  <XCircle className="h-4 w-4 mr-1" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                {dept.status === 'active' ? '禁用部门' : '启用部门'}
              </Button>
            </div>
          </Tabs>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">未找到部门信息</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
