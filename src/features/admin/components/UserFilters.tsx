/**
 * 用户筛选器组件
 *
 * @module UserFilters
 * @description 提供用户列表筛选功能
 */

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserFilters as UserFiltersType, UserStatus, DepartmentOption } from '../types/user.types'

interface UserFiltersProps {
  filters: UserFiltersType
  departments: DepartmentOption[]
  onFilter: (filters: UserFiltersType) => void
}

export function UserFilters({ filters, departments, onFilter }: UserFiltersProps) {
  const handleNameChange = (value: string) => {
    onFilter({ ...filters, name: value || undefined })
  }

  const handleEmployeeCodeChange = (value: string) => {
    onFilter({ ...filters, employee_code: value || undefined })
  }

  const handleDepartmentChange = (value: string) => {
    onFilter({ ...filters, department_id: value === 'all' ? undefined : value })
  }

  const handleStatusChange = (value: string) => {
    onFilter({ ...filters, status: value === 'all' ? undefined : (value as UserStatus) })
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* 姓名搜索 */}
      <div className="w-[200px] space-y-2">
        <label className="text-sm font-medium text-gray-700">姓名</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="搜索姓名..."
            value={filters.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* 工号搜索 */}
      <div className="w-[200px] space-y-2">
        <label className="text-sm font-medium text-gray-700">工号</label>
        <Input
          placeholder="输入工号..."
          value={filters.employee_code || ''}
          onChange={(e) => handleEmployeeCodeChange(e.target.value)}
        />
      </div>

      {/* 部门选择 */}
      <div className="w-[200px] space-y-2">
        <label className="text-sm font-medium text-gray-700">部门</label>
        <Select
          value={filters.department_id || 'all'}
          onValueChange={handleDepartmentChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="选择部门" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部部门</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 状态选择 */}
      <div className="w-[200px] space-y-2">
        <label className="text-sm font-medium text-gray-700">状态</label>
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">启用</SelectItem>
            <SelectItem value="inactive">停用</SelectItem>
            <SelectItem value="locked">锁定</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
