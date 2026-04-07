/**
 * 部门列表组件
 * Task 146 - 部门模块基础框架
 */

import { useEffect } from 'react'
import {
  Users,
  FileCheck,
  TrendingUp,
  Wallet,
  Package,
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDepartmentStore } from '../stores/departmentStore'
import type { DepartmentListItem, DepartmentStatus } from '../types/department'

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

interface DepartmentCardProps {
  department: DepartmentListItem
  onSelect: (id: string) => void
  onEnable: (id: string) => void
  onDisable: (id: string) => void
  isEnabling: boolean
  isDisabling: boolean
}

function DepartmentCard({
  department,
  onSelect,
  onEnable,
  onDisable,
  isEnabling,
  isDisabling,
}: DepartmentCardProps) {
  const Icon = DEPARTMENT_ICON_MAP[department.code] || Users
  const statusColor = STATUS_COLORS[department.status]
  const statusText = STATUS_TEXT[department.status]
  const isActive = department.status === 'active'
  const isLoading = department.status === 'loading' || department.status === 'unloading'

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{department.name}</CardTitle>
              <CardDescription className="text-xs">
                {department.code} · v{department.version}
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`${statusColor} text-white border-0`}
          >
            {statusText}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {department.description || '暂无描述'}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          <span>{department.capabilityCount} 个能力</span>
          <span>{department.toolCount} 个工具</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(department.id)
            }}
          >
            查看详情
          </Button>
          {isLoading ? (
            <Button variant="outline" size="sm" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDisable(department.id)
              }}
              disabled={isDisabling}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEnable(department.id)
              }}
              disabled={isEnabling}
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DepartmentListProps {
  onSelectDepartment?: (id: string) => void
}

export function DepartmentList({ onSelectDepartment }: DepartmentListProps) {
  const {
    departments,
    isLoading,
    isEnabling,
    isDisabling,
    fetchDepartments,
    fetchStats,
    enableDepartment,
    disableDepartment,
  } = useDepartmentStore()

  useEffect(() => {
    fetchDepartments()
    fetchStats()
  }, [fetchDepartments, fetchStats])

  const handleSelect = (id: string) => {
    if (onSelectDepartment) {
      onSelectDepartment(id)
    }
  }

  const handleEnable = (id: string) => {
    enableDepartment(id)
  }

  const handleDisable = (id: string) => {
    disableDepartment(id)
  }

  if (isLoading && departments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">部门列表</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchDepartments()
            fetchStats()
          }}
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          刷新
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          暂无部门，请联系管理员添加
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              onSelect={handleSelect}
              onEnable={handleEnable}
              onDisable={handleDisable}
              isEnabling={isEnabling}
              isDisabling={isDisabling}
            />
          ))}
        </div>
      )}
    </div>
  )
}
